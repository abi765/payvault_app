const PushNotificationService = require('../services/pushNotificationService');

/**
 * Get VAPID public key
 */
exports.getPublicKey = (req, res) => {
  try {
    const publicKey = PushNotificationService.getPublicKey();

    if (!publicKey) {
      return res.status(500).json({
        success: false,
        error: 'Push notifications not configured'
      });
    }

    res.json({
      success: true,
      publicKey
    });
  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get public key'
    });
  }
};

/**
 * Subscribe to push notifications
 */
exports.subscribe = async (req, res) => {
  try {
    const { subscription, device_info } = req.body;
    const userId = req.user.id;

    await PushNotificationService.saveSubscription(userId, subscription, device_info);

    res.json({
      success: true,
      message: 'Subscribed to push notifications successfully'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to push notifications'
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushNotificationService.removeSubscription(endpoint);

    res.json({
      success: true,
      message: 'Unsubscribed from push notifications successfully'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from push notifications'
    });
  }
};

/**
 * Send test notification
 */
exports.sendTest = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await PushNotificationService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test notification from PayVault',
      type: 'test',
      data: { timestamp: new Date().toISOString() }
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });
  } catch (error) {
    console.error('Send test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
};

/**
 * Get notification history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await PushNotificationService.getNotificationHistory(userId, limit, offset);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history'
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await PushNotificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await PushNotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Send notification to all users (admin only)
 */
exports.sendToAll = async (req, res) => {
  try {
    const { title, body, type, data } = req.body;

    const payload = { title, body, type, data };
    const results = await PushNotificationService.sendToAll(payload);

    res.json({
      success: true,
      message: 'Notification sent to all users',
      data: results
    });
  } catch (error) {
    console.error('Send to all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
};
