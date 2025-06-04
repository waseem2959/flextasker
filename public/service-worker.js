/**
 * Flextasker Service Worker
 * 
 * This service worker provides:
 * - Offline support
 * - Performance caching
 * - Background sync
 */

// Cache version - increment when resources change
const CACHE_VERSION = 'v1';

// Cache names
const STATIC_CACHE = `flextasker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `flextasker-dynamic-${CACHE_VERSION}`;
const API_CACHE = `flextasker-api-${CACHE_VERSION}`;

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/assets/index-*.js',
  '/assets/index-*.css',
  '/assets/fonts/*',
  '/placeholder.svg',
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
  '/api/categories',
  '/api/tasks/featured',
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        // If this is an old version of our cache, delete it
        if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  // Claim clients so the service worker is in control immediately
  return self.clients.claim();
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    // For API endpoints we want to cache, use network-first strategy
    if (API_ENDPOINTS.some(endpoint => event.request.url.includes(endpoint))) {
      return event.respondWith(networkFirstStrategy(event.request));
    }
    
    // For other API requests, use network-only but save successful responses to cache
    return event.respondWith(networkWithBackupStrategy(event.request));
  }
  
  // For navigation requests, use cache-first with network fallback
  if (event.request.mode === 'navigate') {
    return event.respondWith(
      caches.match('/index.html')
        .then(response => response || fetch(event.request))
        .catch(() => caches.match('/offline.html'))
    );
  }
  
  // For static assets, use cache-first with network fallback
  return event.respondWith(cacheFirstStrategy(event.request));
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Syncing', event.tag);
  
  if (event.tag === 'sync-new-task') {
    event.waitUntil(
      syncNewTasks()
    );
  } else if (event.tag === 'sync-new-bid') {
    event.waitUntil(
      syncNewBids()
    );
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received');
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click');
  
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

/**
 * Cache-first strategy
 * 1. Try the cache
 * 2. Fall back to network
 * 3. Cache the network response
 */
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then(cacheResponse => {
      // Return cached response if found
      if (cacheResponse) {
        return cacheResponse;
      }
      
      // Otherwise fetch from network
      return fetch(request)
        .then(networkResponse => {
          // Cache the network response
          return caches.open(DYNAMIC_CACHE)
            .then(cache => {
              // Clone the response because it can only be consumed once
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
        })
        .catch(error => {
          console.error('[Service Worker] Fetch failed:', error);
          // If the request is for an image, return a placeholder
          if (request.url.match(/\.(jpe?g|png|gif|svg)$/)) {
            return caches.match('/placeholder.svg');
          }
          
          // Otherwise, just propagate the error
          throw error;
        });
    });
}

/**
 * Network-first strategy
 * 1. Try the network
 * 2. Cache the response
 * 3. Fall back to cache if network fails
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then(networkResponse => {
      // Cache the network response
      caches.open(API_CACHE)
        .then(cache => {
          cache.put(request, networkResponse.clone());
        });
      
      return networkResponse;
    })
    .catch(() => {
      // If network fails, try the cache
      return caches.match(request);
    });
}

/**
 * Network with backup strategy
 * 1. Try the network
 * 2. Cache successful responses
 * 3. Don't fall back to cache
 */
function networkWithBackupStrategy(request) {
  return fetch(request)
    .then(networkResponse => {
      // Only cache successful responses
      if (networkResponse.ok) {
        caches.open(API_CACHE)
          .then(cache => {
            cache.put(request, networkResponse.clone());
          });
      }
      
      return networkResponse;
    });
}

/**
 * Process a single task for syncing
 */
function syncTask(task) {
  return fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': task.authToken
    },
    body: JSON.stringify(task.data)
  })
  .then(response => {
    if (response.ok) {
      // Remove from IndexedDB if successful
      return removeFromIndexedDB('offline-tasks', task.id);
    }
    throw new Error('Task sync failed');
  });
}

/**
 * Sync new tasks that were created offline
 */
function syncNewTasks() {
  return new Promise((resolve, reject) => {
    // Get IndexedDB data for tasks
    getDataFromIndexedDB('offline-tasks')
      .then(tasks => {
        // Process each task and send to server
        const syncPromises = tasks.map(syncTask);
        return Promise.all(syncPromises);
      })
      .then(() => {
        console.log('[Service Worker] Successfully synced tasks');
        resolve();
      })
      .catch(error => {
        console.error('[Service Worker] Task sync failed:', error);
        reject(error);
      });
  });
}

/**
 * Process a single bid for syncing
 */
function syncBid(bid) {
  return fetch(`/api/tasks/${bid.data.taskId}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': bid.authToken
    },
    body: JSON.stringify(bid.data)
  })
  .then(response => {
    if (response.ok) {
      // Remove from IndexedDB if successful
      return removeFromIndexedDB('offline-bids', bid.id);
    }
    throw new Error('Bid sync failed');
  });
}

/**
 * Sync new bids that were created offline
 */
function syncNewBids() {
  return new Promise((resolve, reject) => {
    // Get IndexedDB data for bids
    getDataFromIndexedDB('offline-bids')
      .then(bids => {
        // Process each bid and send to server
        const syncPromises = bids.map(syncBid);
        return Promise.all(syncPromises);
      })
      .then(() => {
        console.log('[Service Worker] Successfully synced bids');
        resolve();
      })
      .catch(error => {
        console.error('[Service Worker] Bid sync failed:', error);
        reject(error);
      });
  });
}

/**
 * Get data from IndexedDB
 */
function getDataFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const dbPromise = indexedDB.open('flextasker-offline', 1);
    
    dbPromise.onerror = reject;
    
    dbPromise.onsuccess = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = reject;
    };
  });
}

/**
 * Remove data from IndexedDB
 */
function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const dbPromise = indexedDB.open('flextasker-offline', 1);
    
    dbPromise.onerror = reject;
    
    dbPromise.onsuccess = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = resolve;
      request.onerror = reject;
    };
  });
}
