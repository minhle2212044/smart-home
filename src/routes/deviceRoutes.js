const express = require('express');
const router = express.Router();
const deviceController = require('../controller/deviceController');

/**
 * @swagger
 * tags:
 *   name: Device
 *   description: Quản lý thiết bị trong hệ thống
 */

/**
 * @swagger
 * /api/device:
 *   get:
 *     summary: Lấy danh sách thiết bị theo userID và homeID
 *     tags: [Device]
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
 *         description: Trả về danh sách thiết bị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       DeviceID:
 *                         type: integer
 *                       DName:
 *                         type: string
 *                       DType:
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
router.get('/', deviceController.getDevicesByUser);

/**
 * @swagger
 * /api/device/infor:
 *   get:
 *     summary: Lấy thông tin chi tiết của thiết bị theo deviceID
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *                 example: 1
 *             required:
 *               - deviceID
 *     responses:
 *       200:
 *         description: Trả về thông tin thiết bị
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 device:
 *                   type: object
 *                   properties:
 *                     DeviceID:
 *                       type: integer
 *                     DName:
 *                       type: string
 *                     DType:
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
 *         description: Thiếu deviceID
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing deviceID"
 *       404:
 *         description: Không tìm thấy thiết bị
 *         content:
 *           application/json:
 *             example:
 *               message: "Device not found"
 *       500:
 *         description: Lỗi server nội bộ
 */
router.get('/infor', deviceController.getDeviceByID);

/**
 * @swagger
 * /api/device/mode:
 *   post:
 *     summary: Thiết lập chế độ hoạt động cho thiết bị
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *               modeID:
 *                 type: integer
 *                 enum: [0, 2]
 *                 description: "0: Manual, 2: Auto"
 *               userID:
 *                 type: integer
 *             required:
 *               - deviceID
 *               - modeID
 *               - userID
 *     responses:
 *       200:
 *         description: Thiết lập chế độ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 topic:
 *                   type: string
 *                 sentPayload:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                     mode:
 *                       type: integer
 *       400:
 *         description: Thiếu thông tin hoặc modeID không hợp lệ
 *         content:
 *           application/json:
 *             examples:
 *               missingParams:
 *                 summary: Thiếu deviceID, modeID hoặc userID
 *                 value:
 *                   message: "Thiếu deviceID, modeID hoặc userID"
 *               invalidMode:
 *                 summary: modeID không hợp lệ
 *                 value:
 *                   message: "Giá trị modeID không hợp lệ (0: Manual, 2: Auto)"
 *       404:
 *         description: Không tìm thấy thiết bị
 *         content:
 *           application/json:
 *             example:
 *               message: "Không tìm thấy thiết bị"
 *       500:
 *         description: Lỗi server hoặc gửi MQTT thất bại
 */
router.post('/mode', deviceController.setMode);

/**
 * @swagger
 * /api/device/manual-control:
 *   post:
 *     summary: Điều khiển thiết bị thủ công
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *               status:
 *                 type: boolean
 *           example:
 *             deviceID: 1
 *             status: true
 *     responses:
 *       200:
 *         description: Điều khiển thủ công thành công
*         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 topic:
 *                   type: string
 *                 sentPayload:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                     status:
 *                       type: boolean
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing or invalid deviceID/status"
 *       500:
 *         description: Lỗi server
 */
router.post('/manual-control', deviceController.manualControl);

/**
 * @swagger
 * /api/device/threshold:
 *   post:
 *     summary: Đặt ngưỡng cho thiết bị
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *               threshold:
 *                 type: number
 *           example:
 *             deviceID: 1
 *             threshold: 50
 *     responses:
 *       200:
 *         description: Đặt ngưỡng thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Đặt ngưỡng và cập nhật cảm biến thành công"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu hoặc sai deviceID/threshold"
 *       500:
 *         description: Lỗi server
 */
router.post('/threhold', deviceController.setThreshold);

/**
 * @swagger
 * /api/device/set-para:
 *   post:
 *     summary: Thiết lập tham số cho thiết bị
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *               para:
 *                 type: number
 *           example:
 *             deviceID: 1
 *             para: 50
 *     responses:
 *       200:
 *         description: Thiết lập tham số thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Gửi và lưu thành công"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu deviceID hoặc para"
 *       500:
 *         description: Lỗi server
 */
router.post('/set-para', deviceController.SetParameter);

/**
 * @swagger
 * /api/device/history:
 *   get:
 *     summary: Lấy lịch sử dữ liệu thiết bị
 *     tags: [Device]
 *     parameters:
 *       - in: query
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách ID thiết bị, cách nhau bằng dấu phẩy
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
 *         description: Thứ tự sắp xếp theo thời gian
 *     responses:
 *       200:
 *         description: Trả về lịch sử dữ liệu thiết bị
 *         content:
 *           application/json:
 *             example:
 *               currentPage: 1
 *               totalPages: 5
 *               totalRecords: 47
 *               sortOrder: "ASC"
 *               deviceIDs: [1,2]
 *               data:
 *                 - ID: 101
 *                   DeviceID: 1
 *                   AMode: "AUTO"
 *                   ADescription: "Device turned on"
 *                   ATime: "2025-05-01T08:30:00Z"
 *                   DName: "Quạt phòng khách"
 *                   DType: "Fan"
 *                   RoomName: "Phòng khách"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Missing deviceID"
 *       500:
 *         description: Lỗi server
 */
router.get('/history', deviceController.getDeviceDataHistory);

/**
 * @swagger
 * /api/device/export:
 *   get:
 *     summary: Xuất lịch sử dữ liệu thiết bị ra file Excel
 *     tags: [Device]
 *     parameters:
 *       - in: query
 *         name: deviceID
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách ID thiết bị, cách nhau bằng dấu phẩy
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
 *         description: Trả về file Excel chứa lịch sử dữ liệu thiết bị
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
 *               message: "Missing deviceID"
 *       500:
 *         description: Lỗi server
 */
router.get('/export', deviceController.exportDeviceDataToExcel);

/**
 * @swagger
 * /api/device/set-password:
 *   post:
 *     summary: Đặt mật khẩu cho thiết bị
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *               password:
 *                 type: string
 *           example:
 *             deviceID: 1
 *             password: "123456"
 *     responses:
 *       200:
 *         description: Đặt mật khẩu thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Đặt mật khẩu thành công"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu deviceID hoặc password"
 *       500:
 *         description: Lỗi server
 */
router.post('/set-password', deviceController.setPassword);

/**
 * @swagger
 * /api/device/verify-password:
 *   post:
 *     summary: Xác minh mật khẩu thiết bị và mở cửa thủ công nếu đúng
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceID:
 *                 type: integer
 *                 description: ID của thiết bị
 *               inputPassword:
 *                 type: string
 *                 description: Mật khẩu nhập vào
 *             required:
 *               - deviceID
 *               - inputPassword
 *     responses:
 *       200:
 *         description: Xác minh mật khẩu thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Mở cửa thủ công thành công"
 *       400:
 *         description: Thiếu hoặc sai tham số đầu vào hoặc thiết bị không hợp lệ
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiết bị không phải là cửa: Light"
 *       401:
 *         description: Mật khẩu sai
 *         content:
 *           application/json:
 *             example:
 *               message: "Mật khẩu sai"
 *       404:
 *         description: Không tìm thấy thiết bị
 *         content:
 *           application/json:
 *             example:
 *               message: "Không tìm thấy thiết bị"
 *       500:
 *         description: Lỗi server
 */
router.get('/verify-password', deviceController.verifyPassword);

/**
 * @swagger
 * /api/device:
 *   post:
 *     summary: Thêm thiết bị mới
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               DType:
 *                 type: string
 *               DName:
 *                 type: string
 *               APIKey:
 *                 type: string
 *               RoomID:
 *                 type: integer
 *               HomeID:
 *                 type: integer
 *           example:
 *             DType: "Fan"
 *             DName: "Quạt phòng khách"
 *             APIKey: "key123"
 *             RoomID: 1
 *             HomeID: 1
 *     responses:
 *       201:
 *         description: Thêm thiết bị thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Thêm thiết bị thành công"
 *               deviceID: 5
 *       500:
 *         description: Lỗi server
 */
router.post('/', deviceController.addDevice);

/**
 * @swagger
 * /api/device/{id}:
 *   put:
 *     summary: Cập nhật thông tin thiết bị
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thiết bị
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               DType:
 *                 type: string
 *               DName:
 *                 type: string
 *               APIKey:
 *                 type: string
 *               RoomID:
 *                 type: integer
 *               HomeID:
 *                 type: integer
 *           example:
 *             DType: "Fan"
 *             DName: "Quạt phòng khách"
 *             APIKey: "key123"
 *             RoomID: 1
 *             HomeID: 1
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Cập nhật thiết bị thành công"
 *       500:
 *         description: Lỗi server
 */
router.put('/:id', deviceController.updateDevice);

/**
 * @swagger
 * /api/device/{id}:
 *   delete:
 *     summary: Xóa thiết bị theo ID
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thiết bị
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Xóa thiết bị thành công"
 *       500:
 *         description: Lỗi server
 */
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;