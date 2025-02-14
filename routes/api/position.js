const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');
const {
    createPosition,
    getAllPositions,
    getPositionSummary,
    getPositionByName,
    getPositionById,
    updatePosition,
    deletePosition,
    activatePosition
} = require('../../controllers/api/position');

const router = express.Router();

// Create a new position
router.post('/positions', requireAuth, isAdmin, createPosition);

// Get all positions
router.get('/positions', requireAuth, getAllPositions);

router.get('/positions/summary', requireAuth, isAdmin, getPositionSummary);

// Get a position by name (using query parameters)
router.get('/positions/search', requireAuth, getPositionByName);

// Get a position by ID
router.get('/positions/:position_id', requireAuth, isAdmin, getPositionById);

// Update a specific position by ID
router.put("/positions/:position_id", requireAuth, isAdmin, updatePosition);

// Reactivate a specific position by ID
router.patch("/positions/:position_id/activate", requireAuth, isAdmin, activatePosition);

// Delete a position by ID
router.delete('/positions/:position_id', requireAuth, isAdmin, deletePosition);

module.exports = router;