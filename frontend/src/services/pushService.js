/**
 * Push Notification Service
 * Handles push notification subscriptions and management
 */

import api from './api';

class PushService {
  constructor() {
    this.subscription = null;
    this.isSupported = false;
    this.isSubscribed = false;
    this.permission = 'default';
  }

  /**
   * Initialize push service
   */
  async init() {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported by this browser');
      return false;
    }

    this.isSupported = true;
    this.permission = Notification.permission;

    // Check if already subscribed
    const registration = await navigator.serviceWorker.ready;
    this.subscription = await registration.pushManager.getSubscription();
    this.isSubscribed = !!this.subscription;

    console.log('Push service initialized. Subscribed:', this.isSubscribed);
    return true;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;

    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else if (permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    } else {
      console.log('Notification permission dismissed');
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    // Request permission if not already granted
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Notification permission not granted');
      }
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const { data } = await api.get('/push/vapid-public-key');
      const vapidPublicKey = data.publicKey;

      // Subscribe to push notifications
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to backend
      await api.post('/push/subscribe', {
        subscription: this.subscription.toJSON(),
        device_info: this.getDeviceInfo()
      });

      this.isSubscribed = true;
      localStorage.setItem('push_subscribed', 'true');

      console.log('Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      console.log('Not subscribed to push notifications');
      return;
    }

    try {
      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Remove subscription from backend
      await api.post('/push/unsubscribe', {
        endpoint: this.subscription.endpoint
      });

      this.subscription = null;
      this.isSubscribed = false;
      localStorage.removeItem('push_subscribed');

      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    try {
      await api.post('/push/preferences', preferences);
      console.log('Notification preferences updated:', preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      const response = await api.get('/push/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification() {
    try {
      await api.post('/push/test');
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(filters = {}) {
    try {
      const response = await api.get('/push/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await api.post(`/push/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await api.post('/push/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Show local notification (for testing)
   */
  async showLocalNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body: options.body || 'Test notification',
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-72x72.png',
      vibrate: options.vibrate || [200, 100, 200],
      data: options.data || {},
      actions: options.actions || [],
      requireInteraction: options.requireInteraction || false
    });
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      vendor: navigator.vendor,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  /**
   * Check if subscribed
   */
  isUserSubscribed() {
    return this.isSubscribed;
  }

  /**
   * Check if supported
   */
  isPushSupported() {
    return this.isSupported;
  }

  /**
   * Get permission status
   */
  getPermission() {
    return this.permission;
  }

  /**
   * Get subscription
   */
  getSubscription() {
    return this.subscription;
  }
}

// Singleton instance
let instance = null;

export const getPushService = () => {
  if (!instance) {
    instance = new PushService();
  }
  return instance;
};

export default PushService;
