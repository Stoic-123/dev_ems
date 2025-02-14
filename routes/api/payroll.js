const express = require('express');
const { postRecordPayroll, updatePayrollStatus ,getPayrollRecords,getPaySlip} = require('../../controllers/api/payroll');

const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');
const router = express.Router();

router.post('/payroll-record',requireAuth,isAdmin, postRecordPayroll);
router.get('/get-payroll-record',requireAuth,isAdmin, getPayrollRecords);
router.put('/update-payroll-status',requireAuth,isAdmin, updatePayrollStatus);
router.get('/get-pay-slip/:id',requireAuth , isAdmin,getPaySlip);
// router.put('/update-payroll-status',isAdmin,requireAuth ,updatePayrollStatus);

module.exports = router;