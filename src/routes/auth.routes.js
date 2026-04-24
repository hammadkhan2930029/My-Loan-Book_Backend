const express = require('express');

const {authController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  changePasswordValidator,
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateProfileValidator,
} = require('../validators');

const router = express.Router();

router.post('/register', validate(registerValidator), authController.register);
router.post('/login', validate(loginValidator), authController.login);
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
