const CACHE_VERSION = 'payvault-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('payvault-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();

          // Cache successful GET requests
          if (response.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving API from cache:', url.pathname);
              return cachedResponse;
            }

            // Return offline response for API calls
            return new Response(
              JSON.stringify({
                success: false,
                error: 'You are offline. Please check your connection.',
                offline: true
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseClone = response.clone();

            // Cache the fetched resource
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          });
      })
      .catch(() => {
        // Both cache and network failed
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PayVault Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ],
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if available
          for (let client of clientList) {
            if (client.url === self.registration.scope && 'focus' in client) {
              return client.focus();
            }
          }

          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Message event - communication with main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Helper function for syncing offline data
async function syncOfflineData() {
  console.log('[Service Worker] Syncing offline data...');

  try {
    // Open IndexedDB and get pending operations
    const db = await openDatabase();
    const pendingOps = await getPendingOperations(db);

    if (pendingOps.length === 0) {
      console.log('[Service Worker] No pending operations to sync');
      return;
    }

    // Send each operation to server
    const results = await Promise.allSettled(
      pendingOps.map((op) => syncOperation(op))
    );

    console.log('[Service Worker] Sync complete:', results);

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        results: results
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error; // Will trigger retry
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PayVaultDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to get pending operations
function getPendingOperations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to sync individual operation
async function syncOperation(operation) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${operation.token}`
    },
    body: JSON.stringify(operation)
  });

  if (!response.ok) {
    throw new Error(`Sync failed for operation ${operation.id}`);
  }

  return response.json();
}

console.log('[Service Worker] Loaded successfully');
