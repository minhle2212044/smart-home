const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notiController');

/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Quản lý thông báo người dùng
 */

/**
 * @swagger
 * /api/notification:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng
 *     tags: [Notification]
 *     parameters:
 *       - in: query
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số thông báo mỗi trang (default = 10)
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái đã đọc
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             example:
 *               currentPage: 1
 *               totalPages: 2
 *               totalRecords: 15
 *               notifications:
 *                 - ID: 1
 *                   Message: "Nhiệt độ vượt ngưỡng"
 *                   NTime: "2024-04-28T10:00:00Z"
 *                   NType: "Alert"
 *                   isRead: false
 *                   SName: "Sensor A"
 *                   SType: "Temperature"
 *       400:
 *         description: Thiếu userID
 */
router.get('/', notificationController.getNotifications);


/**
 * @swagger
 * /api/notification/{id}:
 *   get:
 *     summary: Lấy chi tiết một thông báo
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thông báo
 *     responses:
 *       200:
 *         description: Chi tiết thông báo
 *         content:
 *           application/json:
 *             example:
 *               ID: 1
 *               Message: "Cửa sổ mở quá lâu"
 *               NTime: "2024-04-28T10:00:00Z"
 *               NType: "Device"
 *               isRead: true
 *               SName: "Sensor B"
 *               SType: "Window"
 *               Fullname: "Nguyễn Văn A"
 *       404:
 *         description: Không tìm thấy thông báo
 */
router.get('/:id', notificationController.getNotificationById);


/**
 * @swagger
 * /api/notification/{id}/read:
 *   put:
 *     summary: Đánh dấu thông báo là đã đọc
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Notification marked as read"
 *       404:
 *         description: Không tìm thấy thông báo
 */
router.put('/:id/read', notificationController.markNotificationAsRead);

/**
 * @swagger
 * /api/notification/mark-all-read/{userID}:
 *   put:
 *     summary: Đánh dấu tất cả thông báo của người dùng là đã đọc
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "All notifications marked as read."
 *       400:
 *         description: Thiếu userID
 */
router.put('/mark-all-read/:userID', notificationController.markAllNotificationsAsRead);
module.exports = router;