const express = require('express');

const {notificationController} = require('../controllers');
const {protect} = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadNotificationCount);
router.patch('/read-all', notificationController.markAllNotificationsAsRead);
router.patch('/:id/read', notificationController.markNotificationAsRead);

module.exports = router;
