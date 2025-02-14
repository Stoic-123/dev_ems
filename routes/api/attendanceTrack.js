const express = require('express');

const { getAttendanceRecord, getAttendanceSummary } = require('../../controllers/api/attendanceTrack');
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require("../../middlewares/role");

const router = express.Router();

router.get('/attendance-record', requireAuth, isAdmin, getAttendanceRecord);
router.get('/attendance-summary', requireAuth, getAttendanceSummary);

module.exports = router;