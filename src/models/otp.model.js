const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'OTP purpose is required'],
      enum: ['register', 'forgot_password'],
      index: true,
    },
    codeHash: {
      type: String,
      required: [true, 'OTP code hash is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'OTP expiry is required'],
    },
    resendAvailableAt: {
      type: Date,
      required: [true, 'Resend availability is required'],
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    pendingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

otpSchema.index({email: 1, purpose: 1, createdAt: -1});

module.exports = mongoose.model('Otp', otpSchema);
