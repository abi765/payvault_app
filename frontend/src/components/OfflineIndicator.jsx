import React, { useState, useEffect } from 'react';
import { getSyncQueue } from '../services/syncQueue';

/**
 * Offline Indicator Component
 * Shows online/offline status and pending sync operations
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const syncQueue = getSyncQueue();

    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to sync events
    const unsubscribe = syncQueue.addListener((event) => {
      console.log('Sync event:', event);

      switch (event.type) {
        case 'ONLINE':
          setIsOnline(true);
          break;

        case 'OFFLINE':
          setIsOnline(false);
          break;

        case 'SYNC_START':
          setIsSyncing(true);
          break;

        case 'SYNC_COMPLETE':
          setIsSyncing(false);
          updatePendingCount();
          break;

        case 'SYNC_ERROR':
          setIsSyncing(false);
          break;

        default:
          break;
      }
    });

    // Initial pending count
    updatePendingCount();

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const syncQueue = getSyncQueue();
      const count = await syncQueue.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  };

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null; // Don't show anything when everything is normal
  }

  return (
    <div style={isOnline ? styles.containerOnline : styles.containerOffline}>
      <div style={styles.content}>
        {!isOnline && (
          <>
            <span style={styles.icon}>🔴</span>
            <span style={styles.text}>
              You are offline. Changes will sync when you're back online.
            </span>
          </>
        )}

        {isOnline && isSyncing && (
          <>
            <span style={styles.icon}>🔄</span>
            <span style={styles.text}>
              Syncing {pendingCount} {pendingCount === 1 ? 'change' : 'changes'}...
            </span>
          </>
        )}

        {isOnline && !isSyncing && pendingCount > 0 && (
          <>
            <span style={styles.icon}>⏳</span>
            <span style={styles.text}>
              {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending sync
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  containerOffline: {
    backgroundColor: '#EF4444',
    color: 'white',
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  containerOnline: {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '8px 16px',
    textAlign: 'center',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  icon: {
    fontSize: '16px'
  },
  text: {
    fontWeight: '500'
  }
};

export default OfflineIndicator;
