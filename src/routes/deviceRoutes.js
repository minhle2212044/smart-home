const express = require('express');
const router = express.Router();
const deviceController = require('../controller/devicecontroller');

router.post('/fan', deviceController.controlFan);
router.get('/fan/data', deviceController.getFanData);

router.post('/door', deviceController.controlDoor);
router.get('/door/data', deviceController.getDoorData);


module.exports = router;
