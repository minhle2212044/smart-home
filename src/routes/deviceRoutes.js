const express = require('express');
const router = express.Router();
const deviceController = require('../controller/deviceController');

router.get('/', deviceController.getDevicesByUser);
router.get('/infor', deviceController.getDeviceByID);
router.post('/mode', deviceController.setMode);
router.post('/manual-control', deviceController.manualControl);
router.post('/set-threshold', deviceController.setThreshold);
router.post('/set-para', deviceController.SetParameter);
router.get('/history', deviceController.getDeviceDataHistory);
router.get('/export', deviceController.exportDeviceDataToExcel);

router.post('/', deviceController.addDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;