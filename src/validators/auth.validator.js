const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s\-()]{10,20}$/;
const minPasswordLength = 8;
const profilePhotoPattern = /^(https?:\/\/\S+|data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)$/;

const cleanString = value => (typeof value === 'string' ? value.trim() : '');

const createResult = (value, errors) => ({
  value,
  errors,
});

const addRequiredString = (source, target, errors, field, label) => {
  const value = cleanString(source[field]);

  if (!value) {
    errors.push({
      field,
      message: `${label} is required`,
    });
    return;
  }

  target[field] = value;
};

const validateEmail = (email, errors) => {
  if (!emailPattern.test(email)) {
    errors.push({
      field: 'email',
      message: 'Enter a valid email address',
    });
  }
};

const validatePassword = (password, errors, field = 'password', label = 'Password') => {
  if (!password) {
    errors.push({
      field,
      message: `${label} is required`,
    });
    return;
  }

  if (password.length < minPasswordLength) {
    errors.push({
      field,
      message: `${label} must be at least ${minPasswordLength} characters`,
    });
  }
};

const registerValidator = body => {
  const errors = [];
  const value = {};

  addRequiredString(body, value, errors, 'fullName', 'Full name');
  addRequiredString(body, value, errors, 'email', 'Email');
  addRequiredString(body, value, errors, 'phone', 'Phone number');

  const password = typeof body.password === 'string' ? body.password : '';
  validatePassword(password, errors);

  if (value.email) {
    value.email = value.email.toLowerCase();
    validateEmail(value.email, errors);
  }

  if (value.phone && !phonePattern.test(value.phone)) {
    errors.push({
      field: 'phone',
      message: 'Enter a valid phone number',
    });
  }

  if (password) {
    value.password = password;
  }

  return createResult(value, errors);
};

const loginValidator = body => {
  const errors = [];
  const value = {};

  addRequiredString(body, value, errors, 'phone', 'Phone number');

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else {
    value.password = password;
  }

  if (value.phone && !phonePattern.test(value.phone)) {
    errors.push({
      field: 'phone',
      message: 'Enter a valid phone number',
    });
  }

  return createResult(value, errors);
};

const forgotPasswordValidator = body => {
  const errors = [];
  const value = {};

  addRequiredString(body, value, errors, 'email', 'Email');

  if (value.email) {
    value.email = value.email.toLowerCase();
    validateEmail(value.email, errors);
  }

  return createResult(value, errors);
};

const resetPasswordValidator = body => {
  const errors = [];
  const value = {};

  addRequiredString(body, value, errors, 'token', 'Reset token');

  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword =
    typeof body.confirmPassword === 'string' ? body.confirmPassword : undefined;

  validatePassword(password, errors, 'password', 'New password');

  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Confirm password is required',
      });
    } else if (password && confirmPassword !== password) {
      errors.push({
        field: 'confirmPassword',
        message: 'Confirm password must match new password',
      });
    }
  }

  if (password) {
    value.password = password;
  }

  return createResult(value, errors);
};

const updateProfileValidator = body => {
  const errors = [];
  const value = {};

  addRequiredString(body, value, errors, 'fullName', 'Full name');
  addRequiredString(body, value, errors, 'email', 'Email');
  addRequiredString(body, value, errors, 'phone', 'Phone number');

  if (value.fullName) {
    if (value.fullName.length < 3) {
      errors.push({
        field: 'fullName',
        message: 'Full name must be at least 3 characters',
      });
    }

    if (value.fullName.length > 80) {
      errors.push({
        field: 'fullName',
        message: 'Full name cannot exceed 80 characters',
      });
    }
  }

  if (value.email) {
    value.email = value.email.toLowerCase();
    validateEmail(value.email, errors);
  }

  if (value.phone && !phonePattern.test(value.phone)) {
    errors.push({
      field: 'phone',
      message: 'Enter a valid phone number',
    });
  }

  const profilePhoto = cleanString(body.profilePhoto);

  if (profilePhoto) {
    if (profilePhoto.length > 2000000) {
      errors.push({
        field: 'profilePhoto',
        message: 'Profile photo is too large',
      });
    } else if (!profilePhotoPattern.test(profilePhoto)) {
      errors.push({
        field: 'profilePhoto',
        message: 'Enter a valid image URL or base64 image data',
      });
    } else {
      value.profilePhoto = profilePhoto;
    }
  } else {
    value.profilePhoto = '';
  }

  return createResult(value, errors);
};

const changePasswordValidator = body => {
  const errors = [];
  const value = {};

  const currentPassword =
    typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword =
    typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  validatePassword(currentPassword, errors, 'currentPassword', 'Current password');
  validatePassword(password, errors, 'password', 'New password');

  if (!confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Confirm password is required',
    });
  } else if (password && confirmPassword !== password) {
    errors.push({
      field: 'confirmPassword',
      message: 'Confirm password must match new password',
    });
  }

  if (currentPassword && password && currentPassword === password) {
    errors.push({
      field: 'password',
      message: 'New password must be different from current password',
    });
  }

  if (currentPassword) {
    value.currentPassword = currentPassword;
  }

  if (password) {
    value.password = password;
  }

  if (confirmPassword) {
    value.confirmPassword = confirmPassword;
  }

  return createResult(value, errors);
};

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
};
