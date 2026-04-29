const express = require('express');

const {authController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  changePasswordValidator,
  forgotPasswordValidator,
  otpVerifyValidator,
  resendOtpValidator,
  loginValidator,
  registerValidator,
  requestRegisterOtpValidator,
  resetPasswordValidator,
  updateProfileValidator,
} = require('../validators');

const router = express.Router();

router.post('/register', validate(registerValidator), authController.register);
router.post(
  '/register/request-otp',
  validate(requestRegisterOtpValidator),
  authController.requestRegisterOtp,
);
router.post(
  '/register/verify-otp',
  validate(otpVerifyValidator),
  authController.verifyRegisterOtp,
);
router.post(
  '/register/resend-otp',
  validate(resendOtpValidator),
  authController.resendRegisterOtp,
);
router.post('/login', validate(loginValidator), authController.login);
router.post(
  '/forgot-password/request-otp',
  validate(forgotPasswordValidator),
  authController.requestForgotPasswordOtp,
);
router.post(
  '/forgot-password/verify-otp',
  validate(otpVerifyValidator),
  authController.verifyForgotPasswordOtp,
);
router.post(
  '/forgot-password/resend-otp',
  validate(resendOtpValidator),
  authController.resendForgotPasswordOtp,
);
router.post(
  '/forgot-password',
  validate(forgotPasswordValidator),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  validate(resetPasswordValidator),
  authController.resetPassword,
);
router.get('/me', protect, authController.getMe);
router.patch(
  '/me',
  protect,
  validate(updateProfileValidator),
  authController.updateMe,
);
router.patch(
  '/change-password',
  protect,
  validate(changePasswordValidator),
  authController.changePassword,
);

module.exports = router;
