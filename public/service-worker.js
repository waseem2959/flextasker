/**
 * Flextasker Service Worker
 * 
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'flextasker-v1.0.0';
const STATIC_CACHE_NAME = 'flextasker-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'flextasker-dynamic-v1.0.0';

// Static resources to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add your CSS and JS bundles here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache static assets:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('flextasker-') && 
                   cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Static assets - Cache First strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML pages - Network First with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
  
  // Default - Network First
  event.respondWith(networkFirst(request));
});

// Cache strategies
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const pendingTasks = await getPendingTasks();
    
    // Send each pending task
    for (const task of pendingTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task)
        });
        
        if (response.ok) {
          // Remove synced task from IndexedDB
          await removePendingTask(task.id);
          
          // Notify the client
          await notifyClients('task-synced', {
            taskId: task.id,
            title: task.title
          });
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync task:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { data, action } = event;
  let url = '/';
  
  if (action === 'view-task' && data?.taskId) {
    url = `/tasks/${data.taskId}`;
  } else if (action === 'view-message' && data?.conversationId) {
    url = `/messages/${data.conversationId}`;
  } else if (data?.url) {
    url = data.url;
  }
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Helper functions for IndexedDB (simplified)
async function getPendingTasks() {
  // Implementation would interact with IndexedDB
  return [];
}

async function removePendingTask(taskId) {
  // Implementation would remove from IndexedDB
}

async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}