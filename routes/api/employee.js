const express = require('express');
const { 
  createEmployee, 
  deleteEmployee,
  getListEmployee, 
  getEmployeeSummary,
  getEmployeeByName, 
  getEmployeeById,
  updateEmployeePersonalInfo,
  updateEmployeeContactInfo,
  updateEmployeeEmploymentInfo
} = require('../../controllers/api/employee');
const { requireAuth } = require('../../middlewares/auth');
const { isAdmin } = require('../../middlewares/role');

const router = express.Router();

// Create a new employee
router.post('/employees', requireAuth, isAdmin, createEmployee);

// Delete an employee by ID
router.delete('/employees/:user_id', requireAuth, isAdmin, deleteEmployee);

// Get a list of all employees
router.get('/employees', requireAuth, isAdmin, getListEmployee);

// Get employee summary
router.get('/employees/summary', requireAuth, isAdmin, getEmployeeSummary);

// Get an employee by username (using query parameters)
router.get('/employees/search', requireAuth, isAdmin, getEmployeeByName);

// Get an employee by ID
router.get('/employees/:user_id', requireAuth, isAdmin, getEmployeeById);

// Update personal info of an employee by ID
router.put('/employees/:user_id/personal', requireAuth, isAdmin, updateEmployeePersonalInfo);

// Update contact info of an employee by ID
router.put('/employees/:user_id/contact', requireAuth, isAdmin, updateEmployeeContactInfo);

// Update employment info of an employee by ID
router.put('/employees/:user_id/employment', requireAuth, isAdmin, updateEmployeeEmploymentInfo);


module.exports = router;