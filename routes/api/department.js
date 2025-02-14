const express = require("express");
const { 
  createDepartment, 
  getAllDepartment, 
  getDepartmentSummary,
  getDepartmentByName, 
  getDepartmentById, 
  updateDepartment, 
  deleteDepartment, 
  activateDepartment,
  assignManager, 
  removeManager, 
} = require("../../controllers/api/department");
const { requireAuth } = require("../../middlewares/auth");
const { isAdmin } = require("../../middlewares/role");

const router = express.Router();

// Create a new department
router.post("/departments", requireAuth, isAdmin, createDepartment);

// Get all departments
router.get("/departments", requireAuth, getAllDepartment);

router.get('/departments/summary', requireAuth, isAdmin, getDepartmentSummary);

// Search for a department by name (using query parameters)
router.get("/departments/search", requireAuth, getDepartmentByName);

// Get a specific department by ID
router.get("/departments/:department_id", requireAuth, getDepartmentById);

// Update a specific department by ID
router.put("/departments/:department_id", requireAuth, isAdmin, updateDepartment);

// Activate a specific department by ID
router.patch("/departments/:department_id/activate", requireAuth, isAdmin, activateDepartment);

// Delete a specific department by ID
router.delete("/departments/:department_id", requireAuth, isAdmin, deleteDepartment);

// Assign a manager to a specific department
router.put("/departments/:department_id/manager", requireAuth, isAdmin, assignManager);

// Remove a manager from a specific department
router.delete("/departments/:department_id/manager", requireAuth, isAdmin, removeManager);

module.exports = router;