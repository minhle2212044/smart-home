const express = require('express');
const router = express.Router();
const sensorController = require('../controller/sensorController');

router.get('/', sensorController.getSensorsByUser);
router.get('/data', sensorController.getLatestSensorData);

module.exports = router;