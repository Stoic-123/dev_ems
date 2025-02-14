const express = require('express');

const { getStaffIndex , getPayrollStaff , getProfile, getPayrollManagement,getStaffRequest, getStaffAttendance} = require('../../controllers/web/staff');


const router = express.Router();

// Public routes (no authentication required)
router.get('/staffdashboard', getStaffIndex);
router.get('/payroll' , getPayrollStaff)
router.get('/profile', getProfile)
router.get('/staffattendance', getStaffAttendance);
router.get('/staffrequest', getStaffRequest);

module.exports = router;