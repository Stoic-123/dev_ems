const express = require('express');
const { loginGet } = require('../../controllers/web/auth');


const router = express.Router();

// Public routes (no authentication required)
router.get('/login', loginGet);


module.exports = router;