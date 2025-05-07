const express = require('express');
const router = express.Router();
const mqttController = require('../controller/mqttController');

/**
 * @swagger
 * tags:
 *   name: MQTT
 *   description: Đăng ký topic dựa theo userID và homeID
 */

/**
 * @swagger
 * /api/topic/switch-topics:
 *   post:
 *     summary: Kết nối và đăng ký nhận dữ liệu từ các topic MQTT tương ứng với user + home
 *     tags: [MQTT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userID
 *               - homeID
 *             properties:
 *               userID:
 *                 type: integer
 *               homeID:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đăng ký MQTT thành công và lắng nghe message
 *         content:
 *           application/json:
 *             example:
 *               message: "Switched topics successfully and registered handler"
 *       400:
 *         description: Thiếu userID hoặc homeID
 *       500:
 *         description: Lỗi hệ thống
 */

router.post('/switch-topics', mqttController.switchTopicsForUser);

module.exports = router;
