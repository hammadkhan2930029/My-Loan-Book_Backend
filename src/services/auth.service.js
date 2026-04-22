const crypto = require('crypto');

const {User} = require('../models');
const ApiError = require('../utils/apiError');
const generateRegCode = require('../utils/generateRegCode');
const generateResetToken = require('../utils/generateResetToken');
const {generateJwt} = require('./token.service');

const resetTokenExpiryMinutes = 15;

const getPublicUser = user => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  reg_code: user.reg_code,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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

const registerUser = async payload => {
  const existingUser = await User.findOne({
    $or: [{email: payload.email}, {phone: payload.phone}],
  });

  if (existingUser) {
    if (existingUser.email === payload.email) {
      throw new ApiError('Email is already registered', 409);
    }

    throw new ApiError('Phone number is already registered', 409);
  }

  const user = await User.create({
    ...payload,
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

const createPasswordResetToken = async email => {
  const user = await User.findOne({email}).select(
    '+resetPasswordToken +resetPasswordExpires',
  );

  if (!user) {
    throw new ApiError('No user found with this email', 404);
  }

  const {resetToken, hashedToken} = generateResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(
    Date.now() + resetTokenExpiryMinutes * 60 * 1000,
  );

  await user.save({validateBeforeSave: false});

  return {
    resetToken,
    expiresInMinutes: resetTokenExpiryMinutes,
  };
};

const resetPassword = async ({token, password}) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {$gt: new Date()},
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new ApiError('Reset token is invalid or has expired', 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save({validateModifiedOnly: true});

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

module.exports = {
  registerUser,
  loginUser,
  generateJwt,
  createPasswordResetToken,
  resetPassword,
  getCurrentUser,
};
