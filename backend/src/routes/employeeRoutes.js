const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { validateEmployee, validateEmployeeUpdate } = require('../middleware/validateEmployee');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.protect);

// GET routes
router.get('/', employeeController.getAllEmployees);
router.get('/check-duplicate', employeeController.checkDuplicateBank);
router.get('/:id', employeeController.getEmployee);

// POST routes
router.post('/', validateEmployee, employeeController.createEmployee);

// PUT routes
router.put('/:id', validateEmployeeUpdate, employeeController.updateEmployee);

// DELETE routes
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
