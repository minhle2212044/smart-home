const express = require('express');
const router = express.Router();
const deviceController = require('../controller/deviceController');

router.post('/publish', deviceController.publishMessage);

module.exports = router;