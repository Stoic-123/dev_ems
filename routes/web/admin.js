const express = require('express');

const { getAdminIndex, getEmManagement, getEmDetail, getPayrollManagement, getRequestLeave, getRequestOT, getCompanyDetail, getNotification, getAnnouncement, getGenerateQR, getAttendanceForAdmin, getAddEmployee, getRequest } = require('../../controllers/web/admin');



const router = express.Router();

// Public routes (no authentication required)
router.get('/admindashboard', getAdminIndex); 
router.get('/employee', getEmManagement); 
router.get('/employeeDetail', getEmDetail);
router.get('/addEmployee', getAddEmployee);
router.get('/payrollmanagement', getPayrollManagement); 
router.get('/attendancemanagement', getAttendanceForAdmin); 
// router.get('/requestManagement', getRequestManagemment); 
router.get('/company', getCompanyDetail);
router.get('/notification', getNotification);
router.get('/announcement', getAnnouncement);
router.get('/generateQR', getGenerateQR);
router.get('/getRequest', getRequest)

module.exports = router;