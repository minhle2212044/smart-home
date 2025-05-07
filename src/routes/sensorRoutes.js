const express = require('express');
const router = express.Router();
const sensorController = require('../controller/sensorController');

/**
 * @swagger
 * tags:
 *   name: Sensor
 *   description: Quản lý cảm biến trong hệ thống
 */

/**
 * @swagger
 * /api/sensor/:
 *   get:
 *     summary: Lấy danh sách cảm biến theo người dùng và ngôi nhà
 *     tags: [Sensor]
 *     parameters:
 *       - in: query
 *         name: userID
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *       - in: query
 *         name: homeID
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ngôi nhà
 *     responses:
 *       200:
 *         description: Trả về danh sách cảm biến
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       SensorID:
 *                         type: integer
 *                       SName:
 *                         type: string
 *                       SType:
 *                         type: string
 *                       RoomID:
 *                         type: integer
 *                       HomeID:
 *                         type: integer
 *                       APIKey:
 *                         type: string
 *       400:
 *         description: Thiếu userID hoặc homeID
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing userID or homeID"
 *       500:
 *         description: Lỗi server nội bộ
 */
router.get('/', sensorController.getSensorsByUser);

/**
 * @swagger
 * /api/sensor/infor:
 *   get:
 *     summary: Lấy thông tin chi tiết của một cảm biến theo sensorID
 *     tags: [Sensor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sensorID:
 *                 type: integer
 *           example:
 *             sensorID: 1
 *     responses:
 *       200:
 *         description: Trả về thông tin cảm biến
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sensor:
 *                   type: object
 *                   properties:
 *                     SensorID:
 *                       type: integer
 *                     SName:
 *                       type: string
 *                     SType:
 *                       type: string
 *                     DataEdge:
 *                       type: string
 *                     APIKey:
 *                       type: string
 *                     RoomID:
 *                       type: integer
 *                     RoomName:
 *                       type: string
 *                     HomeID:
 *                       type: integer
 *                     HomeName:
 *                       type: string
 *                     UserID:
 *                       type: integer
 *       400:
 *         description: Thiếu sensorID
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing sensorID"
 *       404:
 *         description: Không tìm thấy cảm biến
 *         content:
 *           application/json:
 *             example:
 *               message: "Sensor not found"
 *       500:
 *         description: Lỗi server nội bộ
 */
router.get('/infor', sensorController.getSensorByID);

/**
 * @swagger
 * /api/sensor/data:
 *   get:
 *     summary: Lấy dữ liệu gần nhất của nhiều cảm biến
 *     tags: [Sensor]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách sensorID, cách nhau bởi dấu phẩy
 *     responses:
 *       200:
 *         description: Trả về dữ liệu mới nhất của từng cảm biến
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sensorID:
 *                     type: integer
 *                   time:
 *                     type: string
 *                     format: date-time
 *                   value:
 *                     type: string
 *       400:
 *         description: Thiếu hoặc sai định dạng sensor IDs
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing sensor IDs"
 *       500:
 *         description: Lỗi server nội bộ
 */
router.get('/data', sensorController.getLatestSensorData);

/**
 * @swagger
 * /api/sensor/history:
 *   get:
 *     summary: Lấy lịch sử dữ liệu cảm biến (có phân trang, lọc thời gian và sắp xếp)
 *     tags: [Sensor]
 *     parameters:
 *       - in: query
 *         name: sensorID
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách ID cảm biến, cách nhau bằng dấu phẩy
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc dữ liệu từ thời điểm này trở đi
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc dữ liệu đến thời điểm này
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Thứ tự sắp xếp theo thời gian (mặc định "asc")
 *     responses:
 *       200:
 *         description: Kết quả phân trang lịch sử dữ liệu cảm biến
 *         content:
 *           application/json:
 *             example:
 *               currentPage: 1
 *               totalPages: 5
 *               totalRecords: 47
 *               sortOrder: "ASC"
 *               sensorIDs: [1,2]
 *               data:
 *                 - ID: 101
 *                   SensorID: 1
 *                   STime: "2025-05-01T08:30:00Z"
 *                   NumData: 23.7
 *                   TextData: null
 *                   DataType: "Number"
 *                   SName: "Nhiệt độ phòng khách"
 *                   SType: "Temperature"
 *                   RoomName: "Phòng khách"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing sensorID"
 *       500:
 *         description: Lỗi server nội bộ
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.get('/history', sensorController.getSensorDataHistory);

/**
 * @swagger
 * /api/sensor/export:
 *   get:
 *     summary: Xuất lịch sử dữ liệu cảm biến ra file Excel
 *     tags: [Sensor]
 *     parameters:
 *       - in: query
 *         name: sensorID
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách ID cảm biến, cách nhau bằng dấu phẩy
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc dữ liệu từ thời điểm này
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Lọc dữ liệu đến thời điểm này
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Thứ tự sắp xếp theo thời gian
 *     responses:
 *       200:
 *         description: Trả về file Excel chứa lịch sử dữ liệu cảm biến
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing sensorID"
 *       500:
 *         description: Lỗi server nội bộ
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
router.get('/export', sensorController.exportSensorDataToExcel);

/**
 * @swagger
 * /api/sensor/:
 *   post:
 *     summary: Thêm cảm biến mới
 *     tags: [Sensor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               SName:
 *                 type: string
 *               SType:
 *                 type: string
 *               DataEdge:
 *                 type: string
 *               APIKey:
 *                 type: string
 *               HomeID:
 *                 type: integer
 *               RoomID:
 *                 type: integer
 *           example:
 *             SName: "Cảm biến nhiệt độ"
 *             SType: "Temperature"
 *             DataEdge: "ESP32"
 *             APIKey: "key123"
 *             HomeID: 1
 *             RoomID: 2
 *     responses:
 *       201:
 *         description: Thêm cảm biến thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Thêm cảm biến thành công"
 *               sensorID: 5
 *       500:
 *         description: Lỗi server
 */
router.post('/', sensorController.addSensor);

/**
 * @swagger
 * /api/sensor/{id}:
 *   put:
 *     summary: Cập nhật thông tin cảm biến
 *     tags: [Sensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               SName:
 *                 type: string
 *               SType:
 *                 type: string
 *               DataEdge:
 *                 type: string
 *               APIKey:
 *                 type: string
 *               HomeID:
 *                 type: integer
 *               RoomID:
 *                 type: integer
 *           example:
 *             SName: "Cập nhật cảm biến"
 *             SType: "Humidity"
 *             DataEdge: "ESP32"
 *             APIKey: "key456"
 *             HomeID: 1
 *             RoomID: 2
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Cập nhật cảm biến thành công"
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', sensorController.updateSensor);

/**
 * @swagger
 * /api/sensor/{id}:
 *   delete:
 *     summary: Xóa cảm biến theo ID
 *     tags: [Sensor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Xóa cảm biến thành công"
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;