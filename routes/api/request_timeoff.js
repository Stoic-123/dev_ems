const express = require('express'); 
const router = express.Router(); 
const { requireAuth } = require('../../middlewares/auth');
const { postRequestLeave } = require('../../controllers/api/request_timeoff');


router.post('/request-leave', requireAuth, postRequestLeave);

module.exports = router;