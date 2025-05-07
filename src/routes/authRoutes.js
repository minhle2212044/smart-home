const express = require('express');
const router = express.Router();
const authController = require("../controller/authController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xác thực và đăng ký người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               tel:
 *                 type: string
 *           example:
 *             username: "minhle2212"
 *             password: "12345678"
 *             name: "Minh Lê"
 *             dob: "2001-12-04"
 *             email: "minh@example.com"
 *             tel: "0987654321"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             example:
 *               message: "User created successfully"
 *               user:
 *                 Username: "minhle2212"
 *                 Fullname: "Minh Lê"
 *                 Dob: "2001-12-04"
 *                 Email: "minh@example.com"
 *                 Tel: "0987654321"
 *       409:
 *         description: Tên người dùng đã tồn tại
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             username: "minhle2212"
 *             password: "12345678"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 ID: 1
 *                 Username: "minhle2212"
 *                 Fullname: "Minh Lê"
 *                 Email: "minh@example.com"
 *               homeId: 1
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Kiểm tra token hợp lệ
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *         content:
 *           application/json:
 *             example:
 *               message: "Token is valid"
 *               userID: 1
 *       401:
 *         description: Token không hợp lệ hoặc không tồn tại
 */
router.get("/verify", authController.verifyToken);

module.exports = router;
