const express = require('express');
const router = express.Router();
const sensorController = require('../controller/sensorController');

router.get('/', sensorController.getSensorsByUser);
router.get('/infor', sensorController.getSensorByID);
router.get('/data', sensorController.getLatestSensorData);
router.get('/history', sensorController.getSensorDataHistory);

router.post('/', sensorController.addSensor);
router.put('/:id', sensorController.updateSensor);
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;