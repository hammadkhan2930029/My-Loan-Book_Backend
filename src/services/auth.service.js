const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const {Otp, User} = require('../models');
const ApiError = require('../utils/apiError');
const generateRegCode = require('../utils/generateRegCode');
const generateUserId = require('../utils/generateUserId');
const {generateJwt} = require('./token.service');
const {sendOtpEmail} = require('./email.service');

const registerOtpExpiryMinutes = 3;
const forgotPasswordOtpExpiryMinutes = 3;
const resendCooldownSeconds = 60;
const resetTokenExpiryMinutes = 10;
const maxOtpAttempts = 5;

const getPublicUser = user => ({
  id: user._id.toString(),
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  reg_code: user.reg_code,
  profilePhoto: user.profilePhoto || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const hashValue = value => crypto.createHash('sha256').update(value).digest('hex');
const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));
const generateResetTokenValue = () => crypto.randomBytes(32).toString('hex');

const createUniqueRegCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const regCode = generateRegCode();
    const exists = await User.exists({reg_code: regCode});

    if (!exists) {
      return regCode;
    }
  }

  throw new ApiError('Could not generate unique registration code', 500);
};

const createUniqueUserId = async () => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const userId = generateUserId();
    const exists = await User.exists({userId});

    if (!exists) {
      return userId;
    }
  }

  throw new ApiError('Could not generate unique 2 digit user ID', 500);
};

const ensureEmailAndPhoneAreAvailable = async ({email, phone}) => {
  const existingUser = await User.findOne({
    $or: [{email}, {phone}],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError('Email is already registered', 409);
    }

    throw new ApiError('Phone number is already registered', 409);
  }
};

const getLatestOtpRecord = (email, purpose) =>
  Otp.findOne({
    email,
    purpose,
  }).sort({createdAt: -1});

const invalidateActiveOtps = async (email, purpose) => {
  await Otp.updateMany(
    {
      email,
      purpose,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        consumedAt: new Date(),
      },
    },
  );
};

const createOtpRecord = async ({email, purpose, pendingData = null, expiryMinutes}) => {
  const latestRecord = await getLatestOtpRecord(email, purpose);
  const now = new Date();

  if (latestRecord?.isActive && latestRecord.resendAvailableAt > now) {
    const secondsRemaining = Math.max(
      1,
      Math.ceil((latestRecord.resendAvailableAt.getTime() - now.getTime()) / 1000),
    );
    throw new ApiError(
      `Please wait ${secondsRemaining} seconds before requesting another code`,
      429,
    );
  }

  await invalidateActiveOtps(email, purpose);

  const otpCode = generateOtpCode();
  const otpRecord = await Otp.create({
    email,
    purpose,
    codeHash: hashValue(otpCode),
    expiresAt: new Date(now.getTime() + expiryMinutes * 60 * 1000),
    resendAvailableAt: new Date(now.getTime() + resendCooldownSeconds * 1000),
    attemptCount: 0,
    isActive: true,
    pendingData,
  });

  await sendOtpEmail(email, otpCode, purpose);

  return {
    email: otpRecord.email,
    expiresInMinutes: expiryMinutes,
    resendAvailableInSeconds: resendCooldownSeconds,
  };
};

const validateLatestOtp = async ({email, purpose, otp}) => {
  const otpRecord = await getLatestOtpRecord(email, purpose);
  const now = new Date();

  if (!otpRecord || !otpRecord.isActive) {
    throw new ApiError('No active OTP found for this email', 404);
  }

  if (otpRecord.expiresAt <= now) {
    otpRecord.isActive = false;
    otpRecord.consumedAt = now;
    await otpRecord.save({validateBeforeSave: false});
    throw new ApiError('OTP has expired. Please request a new code', 400);
  }

  if (otpRecord.attemptCount >= maxOtpAttempts) {
    otpRecord.isActive = false;
    otpRecord.consumedAt = now;
    await otpRecord.save({validateBeforeSave: false});
    throw new ApiError('Maximum OTP attempts exceeded. Please request a new code', 429);
  }

  if (otpRecord.codeHash !== hashValue(otp)) {
    otpRecord.attemptCount += 1;

    if (otpRecord.attemptCount >= maxOtpAttempts) {
      otpRecord.isActive = false;
      otpRecord.consumedAt = now;
    }

    await otpRecord.save({validateBeforeSave: false});

    throw new ApiError('Invalid OTP code', 400);
  }

  return otpRecord;
};

const createUserFromPendingData = async pendingData => {
  const user = new User({
    fullName: pendingData.fullName,
    email: pendingData.email,
    phone: pendingData.phone,
    password: pendingData.passwordHash,
    userId: await createUniqueUserId(),
    reg_code: await createUniqueRegCode(),
  });

  user.$locals.skipPasswordHash = true;
  await user.save();

  return user;
};

const requestRegisterOtp = async payload => {
  const email = payload.email.toLowerCase();
  await ensureEmailAndPhoneAreAvailable({email, phone: payload.phone});

  const passwordHash = await bcrypt.hash(payload.password, 12);

  return createOtpRecord({
    email,
    purpose: 'register',
    expiryMinutes: registerOtpExpiryMinutes,
    pendingData: {
      fullName: payload.fullName,
      email,
      phone: payload.phone,
      passwordHash,
    },
  });
};

const verifyRegisterOtp = async ({email, otp}) => {
  const normalizedEmail = email.toLowerCase();
  const otpRecord = await validateLatestOtp({
    email: normalizedEmail,
    purpose: 'register',
    otp,
  });

  if (!otpRecord.pendingData) {
    throw new ApiError('Registration data is missing for this OTP session', 400);
  }

  await ensureEmailAndPhoneAreAvailable({
    email: otpRecord.pendingData.email,
    phone: otpRecord.pendingData.phone,
  });

  const user = await createUserFromPendingData(otpRecord.pendingData);
  const token = generateJwt(user._id);

  otpRecord.verifiedAt = new Date();
  otpRecord.consumedAt = new Date();
  otpRecord.isActive = false;
  await otpRecord.save({validateBeforeSave: false});

  return {
    token,
    user: getPublicUser(user),
  };
};

const resendRegisterOtp = async ({email}) => {
  const normalizedEmail = email.toLowerCase();
  const latestRecord = await getLatestOtpRecord(normalizedEmail, 'register');

  if (!latestRecord?.pendingData) {
    throw new ApiError('No pending registration found for this email', 404);
  }

  await ensureEmailAndPhoneAreAvailable({
    email: latestRecord.pendingData.email,
    phone: latestRecord.pendingData.phone,
  });

  return createOtpRecord({
    email: normalizedEmail,
    purpose: 'register',
    expiryMinutes: registerOtpExpiryMinutes,
    pendingData: latestRecord.pendingData,
  });
};

const requestForgotPasswordOtp = async ({email}) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({email: normalizedEmail});

  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  return createOtpRecord({
    email: normalizedEmail,
    purpose: 'forgot_password',
    expiryMinutes: forgotPasswordOtpExpiryMinutes,
    pendingData: {
      userId: user._id.toString(),
    },
  });
};

const verifyForgotPasswordOtp = async ({email, otp}) => {
  const normalizedEmail = email.toLowerCase();
  const otpRecord = await validateLatestOtp({
    email: normalizedEmail,
    purpose: 'forgot_password',
    otp,
  });

  const resetToken = generateResetTokenValue();

  otpRecord.verifiedAt = new Date();
  otpRecord.isActive = false;
  otpRecord.resetTokenHash = hashValue(resetToken);
  otpRecord.resetTokenExpiresAt = new Date(
    Date.now() + resetTokenExpiryMinutes * 60 * 1000,
  );
  await otpRecord.save({validateBeforeSave: false});

  return {
    resetToken,
    expiresInMinutes: resetTokenExpiryMinutes,
  };
};

const resendForgotPasswordOtp = async ({email}) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({email: normalizedEmail}).select('_id');

  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  return createOtpRecord({
    email: normalizedEmail,
    purpose: 'forgot_password',
    expiryMinutes: forgotPasswordOtpExpiryMinutes,
    pendingData: {
      userId: user._id.toString(),
    },
  });
};

const registerUser = async payload => {
  await ensureEmailAndPhoneAreAvailable({
    email: payload.email.toLowerCase(),
    phone: payload.phone,
  });

  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
    userId: await createUniqueUserId(),
    reg_code: await createUniqueRegCode(),
  });
  const token = generateJwt(user._id);

  return {
    token,
    user: getPublicUser(user),
  };
};

const loginUser = async ({phone, password}) => {
  const user = await User.findOne({phone}).select('+password');

  if (!user) {
    throw new ApiError('Invalid phone number or password', 401);
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new ApiError('Invalid phone number or password', 401);
  }

  const token = generateJwt(user._id);

  return {
    token,
    reg_code: user.reg_code,
    user: getPublicUser(user),
  };
};

const createPasswordResetToken = async payload =>
  requestForgotPasswordOtp(
    typeof payload === 'string'
      ? {
          email: payload,
        }
      : payload,
  );

const resetPassword = async ({email, resetToken, token, newPassword, password}) => {
  const normalizedEmail = email.toLowerCase();
  const providedResetToken = resetToken || token;
  const nextPassword = newPassword || password;

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'forgot_password',
    resetTokenHash: hashValue(providedResetToken),
    resetTokenExpiresAt: {$gt: new Date()},
    verifiedAt: {$ne: null},
    consumedAt: null,
  }).sort({createdAt: -1});

  if (!otpRecord) {
    throw new ApiError('Reset token is invalid or has expired', 400);
  }

  const user = await User.findOne({email: normalizedEmail}).select('+password');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  user.password = nextPassword;
  await user.save({validateModifiedOnly: true});

  otpRecord.consumedAt = new Date();
  otpRecord.resetTokenHash = null;
  otpRecord.resetTokenExpiresAt = null;
  await otpRecord.save({validateBeforeSave: false});

  const authToken = generateJwt(user._id);

  return {
    token: authToken,
    user: getPublicUser(user),
  };
};

const getCurrentUser = async userId => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return getPublicUser(user);
};

const updateCurrentUser = async (userId, payload) => {
  const conflictingUser = await User.findOne({
    _id: {$ne: userId},
    $or: [{email: payload.email}, {phone: payload.phone}],
  });

  if (conflictingUser) {
    if (conflictingUser.email === payload.email) {
      throw new ApiError('Email is already registered', 409);
    }

    throw new ApiError('Phone number is already registered', 409);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      profilePhoto: payload.profilePhoto || '',
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return getPublicUser(user);
};

const changeCurrentUserPassword = async (userId, {currentPassword, password}) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const passwordMatches = await user.comparePassword(currentPassword);

  if (!passwordMatches) {
    throw new ApiError('Current password is incorrect', 401);
  }

  user.password = password;
  await user.save();

  const token = generateJwt(user._id);

  return {
    token,
    user: getPublicUser(user),
  };
};

module.exports = {
  changeCurrentUserPassword,
  createPasswordResetToken,
  createUniqueRegCode,
  createUniqueUserId,
  generateJwt,
  getCurrentUser,
  loginUser,
  registerUser,
  requestForgotPasswordOtp,
  requestRegisterOtp,
  resendForgotPasswordOtp,
  resendRegisterOtp,
  resetPassword,
  updateCurrentUser,
  verifyForgotPasswordOtp,
  verifyRegisterOtp,
};
