const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification user is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification sender is required'],
      index: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'payment_submitted',
        'payment_confirmed',
        'payment_rejected',
        'contact_added',
      ],
    },
    status: {
      type: String,
      required: [true, 'Notification status is required'],
      enum: ['unread', 'read'],
      default: 'unread',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({userId: 1, status: 1, createdAt: -1});

module.exports = mongoose.model('Notification', notificationSchema);
