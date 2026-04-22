const {authService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: result.token,
    user: result.user,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: result.token,
    reg_code: result.reg_code,
    user: result.user,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.createPasswordResetToken(req.body.email);

  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    resetToken: result.resetToken,
    expiresInMinutes: result.expiresInMinutes,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    token: result.token,
    user: result.user,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Current user profile fetched',
    user,
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};
