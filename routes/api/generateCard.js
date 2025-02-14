const express = require('express');
const { generateEmployeeCard } = require('../../controllers/api/generateCard');
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();

// Route to generate employee card
router.get('/generate-card',requireAuth, generateEmployeeCard);

module.exports = router;