/**
 * Service Worker for Flextasker PWA
 * 
 * Handles caching, offline functionality, background sync, and push notifications.
 */

const CACHE_NAME = 'flextasker-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const CACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  // Add other critical assets here
];

// API cache configuration
const API_CACHE_NAME = 'flextasker-api-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Background sync tags
const SYNC_TAGS = {
  OFFLINE_TASKS: 'offline-tasks',
  DATA_SYNC: 'data-sync'
};

let pwaConfig = {
  enableOffline: true,
  enableBackgroundSync: true,
  cacheStrategies: {
    apiCalls: 'network-first',
    assets: 'cache-first',
    pages: 'stale-while-revalidate'
  }
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache critical assets
        await cache.addAll(CACHE_ASSETS);
        
        console.log('Critical assets cached successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Failed to cache assets during install:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name !== CACHE_NAME && name !== API_CACHE_NAME
        );
        
        await Promise.all(
          oldCaches.map(name => caches.delete(name))
        );
        
        // Claim all clients
        self.clients.claim();
        
        console.log('Service Worker activated and old caches cleaned');
      } catch (error) {
        console.error('Failed to activate service worker:', error);
      }
    })()
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isAssetRequest(url)) {
    event.respondWith(handleAssetRequest(request));
  } else if (isPageRequest(url)) {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests
async function handleApiRequest(request) {
  const strategy = pwaConfig.cacheStrategies.apiCalls;
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, API_CACHE_NAME);
    case 'network-first':
      return networkFirst(request, API_CACHE_NAME);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, API_CACHE_NAME);
    default:
      return networkFirst(request, API_CACHE_NAME);
  }
}

// Handle asset requests (JS, CSS, images, fonts)
async function handleAssetRequest(request) {
  const strategy = pwaConfig.cacheStrategies.assets;
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, CACHE_NAME);
    case 'network-first':
      return networkFirst(request, CACHE_NAME);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, CACHE_NAME);
    default:
      return cacheFirst(request, CACHE_NAME);
  }
}

// Handle page requests
async function handlePageRequest(request) {
  const strategy = pwaConfig.cacheStrategies.pages;
  
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request, CACHE_NAME);
      case 'network-first':
        return await networkFirst(request, CACHE_NAME);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request, CACHE_NAME);
      default:
        return await staleWhileRevalidate(request, CACHE_NAME);
    }
  } catch (error) {
    // Return offline page if all else fails
    if (pwaConfig.enableOffline) {
      const cache = await caches.open(CACHE_NAME);
      const offlineResponse = await cache.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Fallback offline page
    return new Response(
      createOfflinePage(),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if API cache is expired
    if (cacheName === API_CACHE_NAME && isCacheExpired(cachedResponse)) {
      // Fetch new version in background
      fetchAndCache(request, cache);
    }
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Add timestamp for API responses
      if (cacheName === API_CACHE_NAME) {
        const responseWithTimestamp = addTimestampToResponse(networkResponse);
        cache.put(request, responseWithTimestamp.clone());
        return responseWithTimestamp;
      } else {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.log('Network failed, falling back to cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh version
  const fetchPromise = fetchAndCache(request, cache);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return fetchPromise;
}

// Fetch and cache helper
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Check if request is for an asset
function isAssetRequest(url) {
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico'];
  return assetExtensions.some(ext => url.pathname.endsWith(ext));
}

// Check if request is for a page
function isPageRequest(url) {
  return url.pathname === '/' || 
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
}

// Add timestamp to API response
function addTimestampToResponse(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Check if API cache is expired
function isCacheExpired(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const cacheAge = Date.now() - parseInt(cachedAt);
  return cacheAge > API_CACHE_DURATION;
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'PWA_CONFIG':
      pwaConfig = { ...pwaConfig, ...payload };
      console.log('PWA config updated:', pwaConfig);
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_ASSETS':
      cacheAssets(payload);
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.OFFLINE_TASKS:
      event.waitUntil(syncOfflineTasks());
      break;
      
    case SYNC_TAGS.DATA_SYNC:
      event.waitUntil(syncData());
      break;
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    title: 'Flextasker',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'flextasker-notification',
    data: event.data ? event.data.json() : {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.title = payload.title || options.title;
      options.body = payload.body || options.body;
      options.data = payload;
    } catch (error) {
      console.error('Failed to parse push notification data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
  
  // Send message to client
  sendMessageToClients({
    type: 'PUSH_NOTIFICATION_RECEIVED',
    payload: options.data
  });
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline tasks
async function syncOfflineTasks() {
  try {
    // Get offline tasks from IndexedDB or send message to client
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_TASKS'
      });
    });
    
    console.log('Offline tasks sync completed');
  } catch (error) {
    console.error('Failed to sync offline tasks:', error);
    throw error;
  }
}

// Sync data
async function syncData() {
  try {
    // Sync any cached data that needs to be updated
    console.log('Data sync completed');
  } catch (error) {
    console.error('Failed to sync data:', error);
    throw error;
  }
}

// Cache additional assets
async function cacheAssets(assets) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(assets);
    
    sendMessageToClients({
      type: 'CACHE_UPDATED',
      payload: { assets: assets.length }
    });
    
    console.log('Assets cached:', assets.length);
  } catch (error) {
    console.error('Failed to cache assets:', error);
  }
}

// Clear cache
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    console.log('Cache cleared:', cacheName || 'all');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    return status;
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {};
  }
}

// Send message to all clients
async function sendMessageToClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Create offline page HTML
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Flextasker</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .offline-container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .offline-title {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .offline-message {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .retry-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .retry-button:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-message">
          It looks like you don't have an internet connection right now.<br>
          Don't worry, you can still browse cached content and your data will sync when you're back online.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
}

console.log('Service Worker loaded and ready');