import React, { useState, useEffect } from 'react';

/**
 * Install Prompt Component
 * Shows a banner prompting users to install the PWA
 */
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('install_prompt_dismissed');
    const dismissedAt = localStorage.getItem('install_prompt_dismissed_at');

    if (dismissed) {
      // Show again after 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (dismissedAt && parseInt(dismissedAt) > sevenDaysAgo) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      console.log('Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install_prompt_dismissed', 'true');
    localStorage.setItem('install_prompt_dismissed_at', Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>📱</div>
        <div style={styles.text}>
          <strong>Install PayVault</strong>
          <p>Get quick access and work offline by installing PayVault on your device.</p>
        </div>
        <div style={styles.actions}>
          <button onClick={handleInstall} style={styles.installButton}>
            Install
          </button>
          <button onClick={handleDismiss} style={styles.dismissButton}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    color: 'white',
    padding: '16px',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    animation: 'slideUp 0.3s ease-out'
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
  installButton: {
    backgroundColor: 'white',
    color: '#4F46E5',
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

export default InstallPrompt;
