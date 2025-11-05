const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route to get VAPID public key
router.get('/vapid-public-key', pushController.getPublicKey);

// All other routes require authentication
router.use(authMiddleware.protect);

// Subscribe to push notifications
router.post('/subscribe', pushController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', pushController.unsubscribe);

// Send test notification
router.post('/test', pushController.sendTest);

// Get notification history
router.get('/history', pushController.getHistory);

// Mark notification as read
router.post('/notifications/:id/read', pushController.markAsRead);

// Mark all notifications as read
router.post('/notifications/read-all', pushController.markAllAsRead);

// Send notification to all users (admin only)
router.post('/send-all', authMiddleware.authorize('admin'), pushController.sendToAll);

module.exports = router;
