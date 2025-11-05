const webpush = require('web-push');
const pool = require('../config/database');

// Configure web-push with VAPID keys
// These should be generated once and stored in environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@payvault.com'),
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
  console.log('Generate VAPID keys by running: npx web-push generate-vapid-keys');
}

class PushNotificationService {
  /**
   * Save push subscription to database
   */
  static async saveSubscription(userId, subscription, deviceInfo = {}) {
    try {
      const { endpoint, keys } = subscription;

      const result = await pool.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, device_info)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, endpoint)
        DO UPDATE SET p256dh_key = $3, auth_key = $4, device_info = $5
        RETURNING *`,
        [
          userId,
          endpoint,
          keys.p256dh,
          keys.auth,
          JSON.stringify(deviceInfo)
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription
   */
  static async removeSubscription(endpoint) {
    try {
      await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user
   */
  static async getUserSubscriptions(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      throw error;
    }
  }

  /**
   * Send notification to a user
   */
  static async sendToUser(userId, payload) {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      const payloadString = JSON.stringify(payload);
      const results = await Promise.allSettled(
        subscriptions.map((sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          };

          return webpush.sendNotification(pushSubscription, payloadString);
        })
      );

      // Count successes and failures
      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      // Remove subscriptions that failed with 410 Gone
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected' && results[i].reason.statusCode === 410) {
          await this.removeSubscription(subscriptions[i].endpoint);
          console.log('Removed expired subscription:', subscriptions[i].endpoint);
        }
      }

      // Save notification to history
      await this.saveNotification(userId, payload);

      return { sent, failed };
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToMultipleUsers(userIds, payload) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    return results;
  }

  /**
   * Send notification to all admin users
   */
  static async sendToAdmins(payload) {
    try {
      const result = await pool.query(
        'SELECT id FROM users WHERE role = $1',
        ['admin']
      );

      const adminIds = result.rows.map((row) => row.id);
      return this.sendToMultipleUsers(adminIds, payload);
    } catch (error) {
      console.error('Error sending to admins:', error);
      throw error;
    }
  }

  /**
   * Send notification to all users
   */
  static async sendToAll(payload) {
    try {
      const result = await pool.query('SELECT DISTINCT user_id FROM push_subscriptions');
      const userIds = result.rows.map((row) => row.user_id);
      return this.sendToMultipleUsers(userIds, payload);
    } catch (error) {
      console.error('Error sending to all:', error);
      throw error;
    }
  }

  /**
   * Save notification to history
   */
  static async saveNotification(userId, payload) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, type, data)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          payload.title,
          payload.body,
          payload.type || 'general',
          payload.data ? JSON.stringify(payload.data) : null
        ]
      );
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  /**
   * Get notification history for a user
   */
  static async getNotificationHistory(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
        WHERE user_id = $1
        ORDER BY sent_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
        [userId]
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Get VAPID public key
   */
  static getPublicKey() {
    return vapidKeys.publicKey;
  }

  /**
   * Notify about employee action
   */
  static async notifyEmployeeAction(action, employee, userId) {
    const payload = {
      title: 'Employee Update',
      body: `Employee ${employee.full_name} has been ${action}`,
      type: 'employee_action',
      data: { action, employee_id: employee.id }
    };

    // Send to admins
    await this.sendToAdmins(payload);
  }

  /**
   * Notify about salary generation
   */
  static async notifySalaryGenerated(month, count) {
    const payload = {
      title: 'Salary Generated',
      body: `Monthly salary for ${month} has been generated for ${count} employees`,
      type: 'salary_generated',
      data: { month, count }
    };

    // Send to all users
    await this.sendToAll(payload);
  }

  /**
   * Notify about payment status update
   */
  static async notifyPaymentStatusUpdate(payment, newStatus) {
    const payload = {
      title: 'Payment Status Updated',
      body: `Payment status changed to ${newStatus}`,
      type: 'payment_status',
      data: { payment_id: payment.id, status: newStatus }
    };

    // Send to admins
    await this.sendToAdmins(payload);
  }
}

module.exports = PushNotificationService;
