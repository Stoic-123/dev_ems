const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const { 
  updateEmployeeAvatar, 
  deleteEmployeeAvatar, 
  updateEmployeeEmail, 
  deleteEmployeeEmail 
} = require('../../controllers/api/profile');

const router = express.Router();

router.put('/user/avatar', requireAuth, updateEmployeeAvatar);
router.delete('/user/avatar', requireAuth, deleteEmployeeAvatar);
router.put('/user/email', requireAuth, updateEmployeeEmail);
router.delete('/user/email', requireAuth, deleteEmployeeEmail);

module.exports = router;
