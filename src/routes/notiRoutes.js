const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notiController');

router.get('/', notificationController.getNotifications);

router.get('/:id', notificationController.getNotificationById);

router.put('/:id/read', notificationController.markNotificationAsRead);

router.put('/mark-all-read/:userID', notificationController.markAllNotificationsAsRead);
module.exports = router;