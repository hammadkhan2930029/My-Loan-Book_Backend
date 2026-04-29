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

const requestRegisterOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestRegisterOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Registration OTP sent successfully',
    ...result,
  });
});

const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyRegisterOtp(req.body);

  res.status(201).json({
    success: true,
    message: 'Registration verified successfully',
    token: result.token,
    user: result.user,
  });
});

const resendRegisterOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendRegisterOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Registration OTP resent successfully',
    ...result,
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

const requestForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestForgotPasswordOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Forgot password OTP sent successfully',
    ...result,
  });
});

const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyForgotPasswordOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Forgot password OTP verified successfully',
    resetToken: result.resetToken,
    expiresInMinutes: result.expiresInMinutes,
  });
});

const resendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendForgotPasswordOtp(req.body);

  res.status(200).json({
    success: true,
    message: 'Forgot password OTP resent successfully',
    ...result,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.createPasswordResetToken(req.body);

  res.status(200).json({
    success: true,
    message: 'Forgot password OTP sent successfully',
    ...result,
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

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateCurrentUser(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changeCurrentUserPassword(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    token: result.token,
    user: result.user,
  });
});

module.exports = {
  register,
  requestRegisterOtp,
  verifyRegisterOtp,
  resendRegisterOtp,
  login,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resendForgotPasswordOtp,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
};
