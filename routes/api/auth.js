const express = require('express');
const { loginPost, logout, resetPassword, changePassword, forceLogout, postGetMe } = require('../../controllers/api/auth');
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', loginPost);

// Protected routes (authentication required)
router.get('/get-me', requireAuth, postGetMe);
router.post('/logout', requireAuth, logout);
router.put('/change-password', requireAuth, changePassword);

// Admin-only routes (authentication + admin role required)
router.post('/reset-password', requireAuth, isAdmin, resetPassword);
router.post('/force-logout', requireAuth, isAdmin, forceLogout);

module.exports = router;