const mongoose = require('mongoose');

const {Notification} = require('../models');
const ApiError = require('../utils/apiError');

const ensureValidObjectId = (value, fieldName) => {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(`Invalid ${fieldName}`, 400);
  }
};

const mapNotification = notification => ({
  id: notification._id.toString(),
  userId: notification.userId?._id
    ? notification.userId._id.toString()
    : notification.userId.toString(),
  senderId: notification.senderId?._id
    ? notification.senderId._id.toString()
    : notification.senderId.toString(),
  loanId: notification.loanId?._id
    ? notification.loanId._id.toString()
    : notification.loanId
      ? notification.loanId.toString()
      : null,
  transactionId: notification.transactionId?._id
    ? notification.transactionId._id.toString()
    : notification.transactionId
      ? notification.transactionId.toString()
      : null,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  status: notification.status,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
  sender: notification.senderId?._id
    ? {
        id: notification.senderId._id.toString(),
        fullName: notification.senderId.fullName,
        profilePhoto: notification.senderId.profilePhoto || '',
      }
    : null,
  transaction: notification.transactionId?._id
    ? {
        id: notification.transactionId._id.toString(),
        amount: notification.transactionId.amount,
        currency: notification.transactionId.currency,
        status: notification.transactionId.status,
        category: notification.transactionId.category,
        transactionDate: notification.transactionId.transactionDate,
      }
    : null,
  loan: notification.loanId?._id
    ? {
        id: notification.loanId._id.toString(),
        amount: notification.loanId.amount,
        currency: notification.loanId.currency,
        status: notification.loanId.status,
        type: notification.loanId.type,
        transactionDate: notification.loanId.transactionDate,
      }
    : null,
});

const populateNotification = query =>
  query
    .populate({
      path: 'senderId',
      select: 'fullName profilePhoto',
    })
    .populate({
      path: 'transactionId',
      select: 'amount currency status category transactionDate',
    })
    .populate({
      path: 'loanId',
      select: 'amount currency status type transactionDate',
    });

const createNotification = async payload => {
  const notification = await Notification.create({
    userId: payload.userId,
    senderId: payload.senderId,
    loanId: payload.loanId || null,
    transactionId: payload.transactionId || null,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    status: payload.status || 'unread',
  });

  return populateNotification(Notification.findById(notification._id)).then(doc =>
    mapNotification(doc),
  );
};

const listNotifications = async userId => {
  const notifications = await populateNotification(
    Notification.find({userId}).sort({createdAt: -1}),
  );

  return notifications.map(mapNotification);
};

const getUnreadCount = async userId => Notification.countDocuments({userId, status: 'unread'});

const markNotificationAsRead = async (userId, notificationId) => {
  ensureValidObjectId(notificationId, 'notification identifier');

  const notification = await populateNotification(
    Notification.findOne({
      _id: notificationId,
      userId,
    }),
  );

  if (!notification) {
    throw new ApiError('Notification not found', 404);
  }

  if (notification.status !== 'read') {
    notification.status = 'read';
    await notification.save();
  }

  return mapNotification(notification);
};

const markAllNotificationsAsRead = async userId => {
  const result = await Notification.updateMany(
    {
      userId,
      status: 'unread',
    },
    {
      $set: {
        status: 'read',
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

module.exports = {
  createNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
