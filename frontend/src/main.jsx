import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 1000); // Check every minute
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Initialize offline storage and sync queue
import { getOfflineStorage } from './services/offlineStorage';
import { getSyncQueue } from './services/syncQueue';

(async () => {
  try {
    await getOfflineStorage();
    console.log('Offline storage initialized');

    getSyncQueue();
    console.log('Sync queue initialized');
  } catch (error) {
    console.error('Failed to initialize offline features:', error);
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
