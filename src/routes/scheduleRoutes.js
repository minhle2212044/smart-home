const express = require('express');
const router = express.Router();
const scheduleController = require('../controller/scheduleController');

router.post('/add-schedule', scheduleController.addSchedule);
router.delete('/delete-schedule/:modeID', scheduleController.deleteSchedule);
router.put('/update-schedule', scheduleController.updateSchedule);
router.get('/', scheduleController.getSchedules);
router.get('/:index', scheduleController.getScheduleByIndex);

module.exports = router;