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
 * /user/{id}:
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
 *               message: "User not found"
 */
router.get("/:id", userController.getUserById);

/**
 * @swagger
 * /user/update/{id}:
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
 *             properties:
 *               fullname:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               tel:
 *                 type: string
 *           example:
 *             fullname: "Nguyễn Văn C"
 *             dob: "1995-12-01"
 *             email: "nguyenc@example.com"
 *             tel: "0123456789"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "User updated successfully"
 *               user:
 *                 ID: 1
 *                 Fullname: "Nguyễn Văn C"
 *                 Dob: "1995-12-01"
 *                 Email: "nguyenc@example.com"
 *                 Tel: "0123456789"
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put("/update/:id", userController.updateUser);

/**
 * @swagger
 * /user/change-pass/{id}:
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
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *           example:
 *             oldPassword: "123456"
 *             newPassword: "654321"
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "Cập nhật mật khẩu thành công."
 *       401:
 *         description: Mật khẩu cũ không đúng
 *         content:
 *           application/json:
 *             example:
 *               message: "Mật khẩu cũ không đúng."
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put("/change-pass/:id", userController.updatePassword);

module.exports = router;
