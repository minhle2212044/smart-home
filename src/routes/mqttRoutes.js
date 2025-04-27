const express = require('express');
const router = express.Router();
const mqttController = require('../controller/mqttController');

router.post('/switch-topics', mqttController.switchTopicsForUser);

module.exports = router;
