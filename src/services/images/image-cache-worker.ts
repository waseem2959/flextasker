/**
 * Image Cache Worker
 * 
 * Service worker for advanced image caching strategies:
 * - Cache First for static images
 * - Network First for dynamic images
 * - Stale While Revalidate for frequently updated images
 * - Intelligent cache cleanup
 */

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const CACHE_NAME = 'flextasker-images-v1';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

interface CacheEntry {
  url: string;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

class ImageCacheManager {
  private cacheEntries: Map<string, CacheEntry> = new Map();

  /**
   * Initialize cache manager
   */
  async init(): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      // Load existing cache entries
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const contentLength = response.headers.get('content-length');
          const size = contentLength ? parseInt(contentLength, 10) : 0;
          
          this.cacheEntries.set(request.url, {
            url: request.url,
            timestamp: Date.now(),
            size,
            accessCount: 0,
            lastAccessed: Date.now()
          });
        }
      }

      console.log(`Image cache initialized with ${this.cacheEntries.size} entries`);
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Handle image request
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = request.url;
    
    // Determine cache strategy based on URL patterns
    const strategy = this.getCacheStrategy(url);
    
    switch (strategy) {
      case 'cache-first':
        return this.cacheFirst(request);
      case 'network-first':
        return this.networkFirst(request);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(request);
      default:
        return fetch(request);
    }
  }

  /**
   * Determine cache strategy for URL
   */
  private getCacheStrategy(url: string): 'cache-first' | 'network-first' | 'stale-while-revalidate' {
    // Static assets from CDN
    if (url.includes('cloudinary.com') || url.includes('imgix.com') || url.includes('unsplash.com')) {
      return 'cache-first';
    }
    
    // User uploaded images
    if (url.includes('/uploads/') || url.includes('/user-content/')) {
      return 'stale-while-revalidate';
    }
    
    // Dynamic or frequently changing images
    if (url.includes('/api/') || url.includes('timestamp=')) {
      return 'network-first';
    }
    
    // Default to cache first for static images
    return 'cache-first';
  }

  /**
   * Cache First strategy
   */
  private async cacheFirst(request: Request): Promise<Response> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        this.updateAccessStats(request.url);
        return cachedResponse;
      }
      
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && this.isImageRequest(request)) {
        await this.cacheResponse(cache, request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      console.error('Cache first strategy failed:', error);
      return new Response('Image not available', { status: 404 });
    }
  }

  /**
   * Network First strategy
   */
  private async networkFirst(request: Request): Promise<Response> {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && this.isImageRequest(request)) {
        const cache = await caches.open(CACHE_NAME);
        await this.cacheResponse(cache, request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Fallback to cache
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        this.updateAccessStats(request.url);
        return cachedResponse;
      }
      
      return new Response('Image not available', { status: 404 });
    }
  }

  /**
   * Stale While Revalidate strategy
   */
  private async staleWhileRevalidate(request: Request): Promise<Response> {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Return cached response immediately if available
    if (cachedResponse) {
      this.updateAccessStats(request.url);
      
      // Revalidate in background
      this.revalidateInBackground(cache, request);
      
      return cachedResponse;
    }
    
    // No cache, fetch from network
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && this.isImageRequest(request)) {
        await this.cacheResponse(cache, request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      return new Response('Image not available', { status: 404 });
    }
  }

  /**
   * Revalidate resource in background
   */
  private async revalidateInBackground(cache: Cache, request: Request): Promise<void> {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && this.isImageRequest(request)) {
        await this.cacheResponse(cache, request, networkResponse);
      }
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }

  /**
   * Cache response with size management
   */
  private async cacheResponse(cache: Cache, request: Request, response: Response): Promise<void> {
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Check if we need to make space
    await this.ensureCacheSpace(size);
    
    // Cache the response
    await cache.put(request, response);
    
    // Update cache entries
    this.cacheEntries.set(request.url, {
      url: request.url,
      timestamp: Date.now(),
      size,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * Ensure enough cache space
   */
  private async ensureCacheSpace(newEntrySize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize + newEntrySize <= MAX_CACHE_SIZE) {
      return;
    }
    
    // Sort entries by priority (least recently used, least accessed)
    const sortedEntries = Array.from(this.cacheEntries.values()).sort((a, b) => {
      const scoreA = a.accessCount * (Date.now() - a.lastAccessed);
      const scoreB = b.accessCount * (Date.now() - b.lastAccessed);
      return scoreA - scoreB;
    });
    
    const cache = await caches.open(CACHE_NAME);
    let spaceFreed = 0;
    
    for (const entry of sortedEntries) {
      if (spaceFreed >= newEntrySize) break;
      
      await cache.delete(entry.url);
      this.cacheEntries.delete(entry.url);
      spaceFreed += entry.size;
    }
    
    console.log(`Freed ${spaceFreed} bytes from image cache`);
  }

  /**
   * Update access statistics
   */
  private updateAccessStats(url: string): void {
    const entry = this.cacheEntries.get(url);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
    }
  }

  /**
   * Check if request is for an image
   */
  private isImageRequest(request: Request): boolean {
    const url = request.url.toLowerCase();
    const accept = request.headers.get('accept') || '';
    
    return (
      accept.includes('image/') ||
      url.includes('.jpg') ||
      url.includes('.jpeg') ||
      url.includes('.png') ||
      url.includes('.webp') ||
      url.includes('.avif') ||
      url.includes('.gif') ||
      url.includes('.svg')
    );
  }

  /**
   * Get current cache size
   */
  private getCurrentCacheSize(): number {
    return Array.from(this.cacheEntries.values()).reduce(
      (total, entry) => total + entry.size,
      0
    );
  }

  /**
   * Clean expired entries
   */
  async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const cache = await caches.open(CACHE_NAME);
    const expiredUrls: string[] = [];
    
    for (const [url, entry] of this.cacheEntries) {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        expiredUrls.push(url);
      }
    }
    
    for (const url of expiredUrls) {
      await cache.delete(url);
      this.cacheEntries.delete(url);
    }
    
    if (expiredUrls.length > 0) {
      console.log(`Cleaned ${expiredUrls.length} expired image cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cacheEntries.values());
    const now = Date.now();
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
    
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccesses / entries.length;
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: entries.length,
      totalSize,
      hitRate,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}

// Service worker event listeners
if (typeof self !== 'undefined' && 'addEventListener' in self) {
  // Initialize cache manager
  const cacheManager = new ImageCacheManager();

  self.addEventListener('install', (event: any) => {
    console.log('Image cache worker installing...');
    event.waitUntil(cacheManager.init());
    if ('skipWaiting' in self) {
      (self as any).skipWaiting();
    }
  });

  self.addEventListener('activate', (event: any) => {
    console.log('Image cache worker activated');
    if ('clients' in self) {
      event.waitUntil((self as any).clients.claim());
    }
  });

  self.addEventListener('fetch', (event: any) => {
    const request = event.request;
    
    // Only handle image requests
    if (!(cacheManager as any).isImageRequest(request)) {
      return;
    }
    
    event.respondWith(cacheManager.handleRequest(request));
  });

  // Periodic cleanup
  self.addEventListener('message', (event: any) => {
    if (event.data?.type === 'CLEANUP_CACHE') {
      event.waitUntil(cacheManager.cleanExpiredEntries());
    }
    
    if (event.data?.type === 'GET_CACHE_STATS') {
      event.ports[0]?.postMessage(cacheManager.getCacheStats());
    }
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageCacheManager };
}