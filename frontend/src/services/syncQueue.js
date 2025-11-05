/**
 * Sync Queue Service - Manages offline operations and syncs them when online
 */

import { getOfflineStorage, STORES } from './offlineStorage';
import api from './api';

class SyncQueue {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.listeners = [];

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Add operation to sync queue
   */
  async addToQueue(operation) {
    const storage = await getOfflineStorage();

    const queueItem = {
      ...operation,
      timestamp: new Date().toISOString(),
      synced: false,
      attempts: 0,
      error: null
    };

    await storage.put(STORES.SYNC_QUEUE, queueItem);
    console.log('Operation added to sync queue:', queueItem);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync();
    }

    return queueItem;
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations() {
    const storage = await getOfflineStorage();
    const allOps = await storage.getAll(STORES.SYNC_QUEUE);
    return allOps.filter((op) => !op.synced);
  }

  /**
   * Get pending operations count
   */
  async getPendingCount() {
    const pending = await this.getPendingOperations();
    return pending.length;
  }

  /**
   * Sync all pending operations
   */
  async sync() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'SYNC_START' });

    try {
      const storage = await getOfflineStorage();
      const pending = await this.getPendingOperations();

      if (pending.length === 0) {
        console.log('No pending operations to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`Syncing ${pending.length} operations...`);

      const results = [];

      for (const operation of pending) {
        try {
          const result = await this.syncOperation(operation);
          results.push({ success: true, operation, result });

          // Mark as synced
          operation.synced = true;
          operation.syncedAt = new Date().toISOString();
          await storage.put(STORES.SYNC_QUEUE, operation);
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);

          // Update error and attempt count
          operation.attempts = (operation.attempts || 0) + 1;
          operation.error = error.message;
          await storage.put(STORES.SYNC_QUEUE, operation);

          results.push({ success: false, operation, error });

          // If too many attempts, notify user
          if (operation.attempts >= 3) {
            this.notifyListeners({
              type: 'SYNC_ERROR',
              operation,
              error: 'Max retry attempts reached'
            });
          }
        }
      }

      // Clean up synced operations older than 24 hours
      await this.cleanupSyncedOperations();

      this.notifyListeners({
        type: 'SYNC_COMPLETE',
        results,
        successCount: results.filter((r) => r.success).length,
        errorCount: results.filter((r) => !r.success).length
      });

      console.log('Sync complete:', results);
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners({ type: 'SYNC_ERROR', error: error.message });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single operation
   */
  async syncOperation(operation) {
    const { entity_type, action, data, id } = operation;

    switch (entity_type) {
      case 'employee':
        return this.syncEmployee(action, data, id);

      case 'salary':
        return this.syncSalary(action, data, id);

      default:
        throw new Error(`Unknown entity type: ${entity_type}`);
    }
  }

  /**
   * Sync employee operation
   */
  async syncEmployee(action, data, localId) {
    switch (action) {
      case 'CREATE':
        const createResponse = await api.post('/employees', data);
        return createResponse.data;

      case 'UPDATE':
        const updateResponse = await api.put(`/employees/${data.id}`, data);
        return updateResponse.data;

      case 'DELETE':
        const deleteResponse = await api.delete(`/employees/${data.id}`);
        return deleteResponse.data;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Sync salary operation
   */
  async syncSalary(action, data, localId) {
    switch (action) {
      case 'GENERATE':
        const response = await api.post('/salary/generate', {
          payment_month: data.payment_month
        });
        return response.data;

      case 'UPDATE_STATUS':
        const updateResponse = await api.put(`/salary/payment/${data.id}/status`, {
          status: data.status
        });
        return updateResponse.data;

      case 'BULK_UPDATE':
        const bulkResponse = await api.post('/salary/bulk-update', {
          payment_ids: data.payment_ids,
          status: data.status
        });
        return bulkResponse.data;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Clean up old synced operations
   */
  async cleanupSyncedOperations() {
    const storage = await getOfflineStorage();
    const allOps = await storage.getAll(STORES.SYNC_QUEUE);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    for (const op of allOps) {
      if (op.synced && new Date(op.syncedAt) < oneDayAgo) {
        await storage.delete(STORES.SYNC_QUEUE, op.id);
      }
    }
  }

  /**
   * Clear all operations (for testing)
   */
  async clearQueue() {
    const storage = await getOfflineStorage();
    await storage.clear(STORES.SYNC_QUEUE);
    this.notifyListeners({ type: 'QUEUE_CLEARED' });
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Network connection restored');
    this.isOnline = true;
    this.notifyListeners({ type: 'ONLINE' });

    // Trigger sync after a short delay
    setTimeout(() => this.sync(), 1000);
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Network connection lost');
    this.isOnline = false;
    this.notifyListeners({ type: 'OFFLINE' });
  }

  /**
   * Add listener for sync events
   */
  addListener(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get online status
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }
}

// Singleton instance
let instance = null;

export const getSyncQueue = () => {
  if (!instance) {
    instance = new SyncQueue();
  }
  return instance;
};

export default SyncQueue;
