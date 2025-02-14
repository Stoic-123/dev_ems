const express = require('express');

const { requireAuth } = require('../../middlewares/auth');
const { getPersonalAttendance, getPersonalAttendanceStats, getPersonalAttendanceToday } = require('../../controllers/api/personalAttendance');

const router = express.Router();

router.get('/personal-attendance', requireAuth, getPersonalAttendance);
router.get('/personal-attendance-stats', requireAuth, getPersonalAttendanceStats);
router.get('/personal-attendance-today', requireAuth, getPersonalAttendanceToday);

module.exports = router;