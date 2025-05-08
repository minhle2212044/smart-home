const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Quản lý thông tin người dùng
 */

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ID:
 *                   type: integer
 *                 Username:
 *                   type: string
 *                 Pass:
 *                   type: string
 *                 Fullname:
 *                   type: string
 *                 Dob:
 *                   type: string
 *                   format: date-time
 *                 Email:
 *                   type: string
 *                 Tel:
 *                   type: string
 *             example:
 *               ID: 1
 *               Username: "minhle2212044"
 *               Pass: "$2b$10$/hz7xE4nN82//ViRuSdXueSjghok4RqwVqmawHbgg4wTbnz4ep.3."
 *               Fullname: "Nguyễn Văn B"
 *               Dob: "1999-05-09T17:00:00.000Z"
 *               Email: "nguyenb@example.com"
 *               Tel: "0987654321"
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             example:
 *               message: "Không tìm thấy người dùng."
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /api/user/update/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - dob
 *               - email
 *               - tel
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: "Nguyễn Văn C"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-12-01"
 *               email:
 *                 type: string
 *                 example: "nguyenc@example.com"
 *               tel:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Cập nhật thông tin người dùng thành công"
 *               user:
 *                 ID: 1
 *                 Fullname: "Nguyễn Văn C"
 *                 Dob: "1995-12-01"
 *                 Email: "nguyenc@example.com"
 *                 Tel: "0123456789"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc thiếu thông tin
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu hoặc sai định dạng dữ liệu đầu vào."
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             example:
 *               message: "Không tìm thấy người dùng."
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             example:
 *               message: "Lỗi máy chủ."
 */
router.put("/update/:id", userController.updateUser);

/**
 * @swagger
 * /api/user/change-pass/{id}:
 *   put:
 *     summary: Thay đổi mật khẩu người dùng
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "654321"
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Cập nhật mật khẩu thành công."
 *       400:
 *         description: Thiếu thông tin mật khẩu hoặc lỗi đầu vào
 *         content:
 *           application/json:
 *             example:
 *               message: "Thiếu thông tin mật khẩu."
 *       401:
 *         description: Mật khẩu cũ không đúng
 *         content:
 *           application/json:
 *             example:
 *               message: "Mật khẩu cũ không đúng."
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             example:
 *               message: "Không tìm thấy người dùng."
 *       500:
 *         description: Lỗi máy chủ
 *         content:
 *           application/json:
 *             example:
 *               message: "Lỗi máy chủ."
 */

router.put("/change-pass/:id", userController.updatePassword);

module.exports = router;
