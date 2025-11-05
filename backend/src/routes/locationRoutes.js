const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.protect);

// Track location
router.post('/track', locationController.trackLocation);

// Get location history for current user
router.get('/history', locationController.getHistory);

// Get all location logs (admin only)
router.get('/logs', authMiddleware.authorize('admin'), locationController.getAllLogs);

// Get location statistics
router.get('/stats', locationController.getStats);

module.exports = router;
