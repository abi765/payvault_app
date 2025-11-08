import React, { useState, useEffect } from 'react';

/**
 * PWA Install Button Component
 * Provides a persistent button to install the PWA
 * Shows in header/navbar for easy access
 */
const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
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
      // Show manual install instructions
      showManualInstructions();
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install error:', error);
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const browser = detectBrowser();
    let message = '';

    switch (browser) {
      case 'chrome':
      case 'edge':
        message = 'To install:\n\n1. Click the ⊕ Install icon in the address bar\nOR\n2. Click Menu (⋮) → "Install PayVault..."';
        break;
      case 'safari':
        message = 'To install on iPhone/iPad:\n\n1. Tap the Share button (box with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right\n\nOn Mac:\n1. Click Share button in toolbar\n2. Select "Add to Dock"';
        break;
      case 'ios-other':
        message = '⚠️ PWA installation not supported in this browser on iOS.\n\nTo install PayVault:\n\n1. Open Safari browser\n2. Visit: payvault-app.onrender.com\n3. Tap Share button (box with arrow)\n4. Tap "Add to Home Screen"\n5. Tap "Add"\n\nPayVault will appear on your home screen!';
        break;
      case 'firefox':
        message = 'To install:\n\n1. Click the ⊕ icon in the address bar\nOR\n2. Enable PWA support in about:config';
        break;
      default:
        message = 'To install:\n\nLook for an Install icon in your browser\'s address bar or menu.';
    }

    alert(message);
  };

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // On iOS, only Safari supports PWA installation
    if (isIOS) {
      if (userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('firefox')) {
        return 'safari';
      }
      return 'ios-other'; // Firefox, Chrome, etc. on iOS
    }

    if (userAgent.includes('edg')) return 'edge';
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('firefox')) return 'firefox';
    return 'unknown';
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      style={styles.button}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#4338CA';
        e.target.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#4F46E5';
        e.target.style.transform = 'translateY(0)';
      }}
      title="Install PayVault as an app"
    >
      <span style={styles.icon}>📱</span>
      <span style={styles.text}>Install App</span>
    </button>
  );
};

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    whiteSpace: 'nowrap'
  },
  icon: {
    fontSize: '16px',
    lineHeight: 1
  },
  text: {
    lineHeight: 1
  }
};

export default PWAInstallButton;
