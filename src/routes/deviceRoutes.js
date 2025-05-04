const express = require('express');
const router = express.Router();
const deviceController = require('../controller/deviceController');

router.get('/', deviceController.getDevicesByUser);
router.post('/mode', deviceController.setMode);
router.post('/manual-control', deviceController.manualControl);
router.post('/set-threshold', deviceController.setThreshold);

router.post('/', deviceController.addDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;