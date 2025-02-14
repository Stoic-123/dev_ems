const express = require('express');

const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');
const { addAttendance, updateAttendance, deleteAttendance } = require('../../controllers/api/manualAttendance');

const router = express.Router();

router.post('/add-attendance', requireAuth, isAdmin, addAttendance);
router.put('/update-manual-attendance', requireAuth, isAdmin, updateAttendance);
router.delete('/delete-manula-attenance', requireAuth, isAdmin, deleteAttendance);

module.exports = router;