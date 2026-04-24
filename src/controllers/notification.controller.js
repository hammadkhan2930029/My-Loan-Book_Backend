const {notificationService} = require('../services');
const asyncHandler = require('../utils/asyncHandler');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Notification fetched successfully',
    data: notifications,
    notifications,
  });
});

const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Unread notification count fetched successfully',
    data: {
      count: unreadCount,
    },
    unreadCount,
  });
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user.id,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: 'Notification marked as read successfully',
    data: notification,
    notification,
  });
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read successfully',
    data: result,
  });
});

module.exports = {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
