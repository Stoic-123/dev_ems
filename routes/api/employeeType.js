const express = require('express');

const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');
const { postCreateEmpType } = require('../../controllers/api/employeeType');

const router = express.Router();

router.post('/create-emp-type', requireAuth, isAdmin, postCreateEmpType);

module.exports = router;