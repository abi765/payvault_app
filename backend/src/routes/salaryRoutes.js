const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.protect);

// GET routes
router.get('/months', salaryController.getPaymentMonths);
router.get('/month/:month', salaryController.getPaymentsByMonth);
router.get('/month/:month/statistics', salaryController.getStatistics);
router.get('/month/:month/export', salaryController.exportPayments);
router.get('/employee/:employeeId/history', salaryController.getEmployeeHistory);

// POST routes
router.post('/generate', salaryController.generateMonthlySalary);
router.post('/bulk-update', salaryController.bulkUpdateStatus);

// PUT routes
router.put('/payment/:id/status', salaryController.updatePaymentStatus);

module.exports = router;
