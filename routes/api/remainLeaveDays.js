const express = require('express');
const { getRemainigLeaveDays } = require('../../controllers/api/remainLeaveDays');
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/remain-leave-day', requireAuth, getRemainigLeaveDays);

module.exports = router;