const express = require('express');

const {authController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
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

module.exports = router;
