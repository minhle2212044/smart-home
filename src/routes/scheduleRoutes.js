const express = require('express');
const router = express.Router();
const scheduleController = require('../controller/scheduleController');

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: Lập lịch cho các thiết bị
 */

/**
 * @swagger
 * /api/schedule/add-schedule:
 *   post:
 *     summary: Thêm lịch mới cho thiết bị (fan/led)
 *     tags: [Schedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceID
 *               - hour
 *               - minute
 *               - status
 *               - para
 *               - userID
 *             properties:
 *               deviceID:
 *                 type: integer
 *               hour:
 *                 type: integer
 *               minute:
 *                 type: integer
 *               status:
 *                 type: boolean
 *               para:
 *                 type: integer
 *               userID:
 *                 type: integer
 *               index:
 *                 type: integer
 *                 description: Tuỳ chọn - vị trí lịch (0-4)
 *           example:
 *             deviceID: 3
 *             hour: 18
 *             minute: 30
 *             status: true
 *             para: 70
 *             userID: 1
 *             index: 2
 *     responses:
 *       200:
 *         description: Thêm lịch thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule added successfully"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt giới hạn số lịch
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid data or schedule limit exceeded"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.post('/add-schedule', scheduleController.addSchedule);

/**
 * @swagger
 * /api/schedule/delete-schedule/{index}:
 *   delete:
 *     summary: Xoá lịch theo index
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vị trí index của lịch
 *     responses:
 *       200:
 *         description: Xoá thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule deleted successfully"
 *       400:
 *         description: Thiếu hoặc sai index
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing or invalid index"
 *       404:
 *         description: Không tìm thấy lịch
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule not found"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.delete('/delete-schedule/:index', scheduleController.deleteSchedule);

/**
 * @swagger
 * /api/schedule/update-schedule:
 *   put:
 *     summary: Cập nhật lịch theo index
 *     tags: [Schedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - index
 *               - hour
 *               - minute
 *               - status
 *               - para
 *               - userID
 *             properties:
 *               index:
 *                 type: integer
 *               hour:
 *                 type: integer
 *               minute:
 *                 type: integer
 *               status:
 *                 type: boolean
 *               para:
 *                 type: integer
 *               userID:
 *                 type: integer
 *           example:
 *             index: 2
 *             hour: 20
 *             minute: 0
 *             status: false
 *             para: 0
 *             userID: 1
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule updated successfully"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không tìm thấy lịch
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid data or schedule not found"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.put('/update-schedule', scheduleController.updateSchedule);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Lấy danh sách lịch theo userID
 *     tags: [Schedule]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: integer
 *             required:
 *               - userID
 *           example:
 *             userID: 1
 *     responses:
 *       200:
 *         description: Danh sách lịch theo user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       deviceID:
 *                         type: integer
 *                       deviceName:
 *                         type: string
 *                       deviceType:
 *                         type: string
 *                       description:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       userID:
 *                         type: integer
 *             example:
 *               total: 2
 *               schedules:
 *                 - index: 0
 *                   deviceID: 3
 *                   deviceName: "Quạt trần"
 *                   deviceType: "fan"
 *                   description: "Bật quạt lúc 18:30"
 *                   startTime: "2025-05-09T18:30:00"
 *                   endTime: "2025-05-09T19:00:00"
 *                   userID: 1
 *                 - index: 1
 *                   deviceID: 4
 *                   deviceName: "Đèn LED"
 *                   deviceType: "led"
 *                   description: "Tắt đèn lúc 22:00"
 *                   startTime: "2025-05-09T22:00:00"
 *                   endTime: "2025-05-09T22:30:00"
 *                   userID: 1
 *       400:
 *         description: Thiếu userID
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu userID"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             example:
 *               message: "Lỗi server"
 */
router.get('/', scheduleController.getSchedules);

/**
 * @swagger
 * /api/schedule/{index}:
 *   get:
 *     summary: Lấy thông tin lịch theo index
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vị trí index của lịch cần lấy
 *     responses:
 *       200:
 *         description: Thông tin lịch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 index:
 *                   type: integer
 *                 deviceID:
 *                   type: integer
 *                 hour:
 *                   type: integer
 *                 minute:
 *                   type: integer
 *                 status:
 *                   type: boolean
 *                 para:
 *                   type: integer
 *                 userID:
 *                   type: integer
 *             example:
 *               index: 2
 *               deviceID: 3
 *               hour: 18
 *               minute: 30
 *               status: true
 *               para: 70
 *               userID: 1
 *       404:
 *         description: Không tìm thấy lịch
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule not found"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.get('/:index', scheduleController.getScheduleByIndex);

module.exports = router;