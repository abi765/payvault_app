import React, { useState, useEffect } from 'react';

/**
 * Update Banner Component
 * Shows when a new version of the app is available
 */
const UpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [newWorker, setNewWorker] = useState(null);

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for service worker updates
    navigator.serviceWorker.ready.then((registration) => {
      // Check for updates periodically (every 5 minutes)
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);

      registration.addEventListener('updatefound', () => {
        const newSW = registration.installing;

        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and ready
            console.log('New version available');
            setNewWorker(newSW);
            setShowBanner(true);
          }
        });
      });
    });

    // Listen for controller change (when new service worker takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker has taken control');
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (newWorker) {
      // Tell the service worker to skip waiting
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>🎉</div>
        <div style={styles.text}>
          <strong>New version available!</strong>
          <p>Update now to get the latest features and improvements.</p>
        </div>
        <div style={styles.actions}>
          <button onClick={handleUpdate} style={styles.updateButton}>
            Update Now
          </button>
          <button onClick={handleDismiss} style={styles.dismissButton}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    color: 'white',
    padding: '16px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    zIndex: 10000,
    animation: 'slideDown 0.3s ease-out'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  icon: {
    fontSize: '32px'
  },
  text: {
    flex: 1,
    minWidth: '200px'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  updateButton: {
    backgroundColor: 'white',
    color: '#10B981',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  dismissButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '10px 24px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  }
};

export default UpdateBanner;
