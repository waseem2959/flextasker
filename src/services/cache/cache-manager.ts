/**
 * Advanced Cache Manager
 * 
 * Comprehensive caching system with multiple storage layers, intelligent
 * invalidation, cache warming, and performance optimization strategies.
 */

import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../monitoring/error-tracking';

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in MB
  enableCompression: boolean;
  enableEncryption: boolean;
  persistToDisk: boolean;
  strategies: {
    memory: boolean;
    localStorage: boolean;
    indexedDB: boolean;
    serviceWorker: boolean;
  };
}

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  version: string;
  compressed?: boolean;
  encrypted?: boolean;
}

interface CacheStatistics {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  storageUsage: {
    memory: number;
    localStorage: number;
    indexedDB: number;
    serviceWorker: number;
  };
}

interface CacheLayer {
  name: string;
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<string[]>;
}

class MemoryCacheLayer implements CacheLayer {
  name = 'memory';
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 50 * 1024 * 1024) { // 50MB default
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
    }
    return entry || null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Check if we need to evict entries
    await this.evictIfNeeded(entry.size);
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  private async evictIfNeeded(newEntrySize: number): Promise<void> {
    const currentSize = await this.size();
    
    if (currentSize + newEntrySize > this.maxSize) {
      // LRU eviction - remove least recently used entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      let freedSize = 0;
      for (const [key, entry] of entries) {
        this.cache.delete(key);
        freedSize += entry.size;
        
        if (currentSize - freedSize + newEntrySize <= this.maxSize) {
          break;
        }
      }
    }
  }
}

class LocalStorageCacheLayer implements CacheLayer {
  name = 'localStorage';
  private prefix = 'cache_';

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<T>;
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        await this.set(key, entry); // Update access info
        return entry;
      }
    } catch (error) {
      console.warn('LocalStorage cache read error:', error);
    }
    return null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        await this.evictOldestEntries();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('LocalStorage cache write failed after eviction:', retryError);
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async size(): Promise<number> {
    let total = 0;
    const keys = await this.keys();
    
    for (const key of keys) {
      const stored = localStorage.getItem(this.prefix + key);
      if (stored) {
        total += new Blob([stored]).size;
      }
    }
    
    return total;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }

  private async evictOldestEntries(): Promise<void> {
    const keys = await this.keys();
    const entries: Array<[string, CacheEntry]> = [];
    
    for (const key of keys) {
      const entry = await this.get(key);
      if (entry) {
        entries.push([key, entry]);
      }
    }
    
    // Sort by last accessed and remove oldest 25%
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      await this.delete(entries[i][0]);
    }
  }
}

class IndexedDBCacheLayer implements CacheLayer {
  name = 'indexedDB';
  private dbName = 'FlextaskerCache';
  private storeName = 'entries';
  private version = 1;
  private db: IDBDatabase | null = null;

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T>;
        if (entry) {
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          
          // Update access info
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = () => resolve(entry);
          updateRequest.onerror = () => resolve(entry); // Still return entry even if update fails
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(_key: string, entry: CacheEntry<T>): Promise<void> { // key parameter renamed to indicate it's not used
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async size(): Promise<number> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries = request.result as CacheEntry[];
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        resolve(totalSize);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccessed', 'lastAccessed');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    });
  }
}

class CacheManagerService {
  private config: CacheConfig;
  private layers: CacheLayer[] = [];
  private stats: CacheStatistics;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100 * 1024 * 1024, // 100MB
      enableCompression: true,
      enableEncryption: false,
      persistToDisk: true,
      strategies: {
        memory: true,
        localStorage: true,
        indexedDB: true,
        serviceWorker: false
      },
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      memoryUsage: 0,
      storageUsage: {
        memory: 0,
        localStorage: 0,
        indexedDB: 0,
        serviceWorker: 0
      }
    };

    this.initializeLayers();
    this.startCleanupTimer();
  }

  /**
   * Initialize cache layers based on configuration
   */
  private initializeLayers(): void {
    if (this.config.strategies.memory) {
      this.layers.push(new MemoryCacheLayer(this.config.maxSize * 0.3)); // 30% for memory
    }

    if (this.config.strategies.localStorage && this.isLocalStorageAvailable()) {
      this.layers.push(new LocalStorageCacheLayer());
    }

    if (this.config.strategies.indexedDB && this.isIndexedDBAvailable()) {
      this.layers.push(new IndexedDBCacheLayer());
    }

    console.log(`Cache manager initialized with ${this.layers.length} layers:`, 
      this.layers.map(l => l.name));
  }

  /**
   * Get cached data with intelligent layer traversal
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Try each layer in order (fastest to slowest)
      for (let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i];
        const entry = await layer.get<T>(key);
        
        if (entry && !this.isExpired(entry)) {
          this.hitCount++;
          
          // Promote to faster layers (cache warming)
          await this.promoteToFasterLayers(key, entry, i);
          
          // Track performance
          const endTime = performance.now();
          performanceMonitor.recordMetric({
            name: 'cache.hit',
            value: endTime - startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'custom',
            tags: {
              layer: layer.name,
              key: this.sanitizeKey(key)
            }
          });
          
          return this.deserializeData(entry.data);
        }
      }
      
      // Cache miss
      this.missCount++;
      
      const endTime = performance.now();
      performanceMonitor.recordMetric({
        name: 'cache.miss',
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          key: this.sanitizeKey(key)
        }
      });
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-get',
          key: this.sanitizeKey(key)
        }
      });
      return null;
    }
  }

  /**
   * Check if a key exists in cache (without accessing it)
   */
  async has(key: string): Promise<boolean> {
    try {
      for (const layer of this.layers) {
        const entry = await layer.get(key);
        if (entry && !this.isExpired(entry)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Set cached data across all layers
   */
  async set<T>(key: string, data: T, options?: {
    ttl?: number;
    tags?: string[];
    priority?: 'low' | 'normal' | 'high';
  }): Promise<void> {
    const startTime = performance.now();
    
    try {
      const serializedData = await this.serializeData(data);
      const size = this.calculateSize(serializedData);
      
      const entry: CacheEntry<T> = {
        key,
        data: serializedData,
        timestamp: Date.now(),
        ttl: options?.ttl || this.config.defaultTTL,
        size,
        accessCount: 1,
        lastAccessed: Date.now(),
        tags: options?.tags || [],
        version: '1.0.0',
        compressed: this.config.enableCompression,
        encrypted: this.config.enableEncryption
      };

      // Determine which layers to use based on priority
      const targetLayers = this.selectLayersForPriority(options?.priority || 'normal');
      
      // Set in all target layers
      await Promise.all(
        targetLayers.map(layer => layer.set(key, entry))
      );
      
      // Update statistics
      await this.updateStatistics();
      
      const endTime = performance.now();
      performanceMonitor.recordMetric({
        name: 'cache.set',
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          key: this.sanitizeKey(key),
          size: String(size),
          layers: String(targetLayers.length)
        }
      });
      
    } catch (error) {
      console.error('Cache set error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-set',
          key: this.sanitizeKey(key)
        }
      });
    }
  }

  /**
   * Delete cached data from all layers
   */
  async delete(key: string): Promise<void> {
    try {
      await Promise.all(
        this.layers.map(layer => layer.delete(key))
      );
      
      await this.updateStatistics();
    } catch (error) {
      console.error('Cache delete error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-delete',
          key: this.sanitizeKey(key)
        }
      });
    }
  }

  /**
   * Clear cache entries by tags
   */
  async deleteByTags(tags: string[]): Promise<void> {
    try {
      for (const layer of this.layers) {
        const keys = await layer.keys();
        
        for (const key of keys) {
          const entry = await layer.get(key);
          if (entry && entry.tags.some(tag => tags.includes(tag))) {
            await layer.delete(key);
          }
        }
      }
      
      await this.updateStatistics();
    } catch (error) {
      console.error('Cache delete by tags error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-delete-by-tags',
          tags: tags.join(',')
        }
      });
    }
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    try {
      await Promise.all(
        this.layers.map(layer => layer.clear())
      );
      
      this.hitCount = 0;
      this.missCount = 0;
      this.evictionCount = 0;
      
      await this.updateStatistics();
    } catch (error) {
      console.error('Cache clear error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-clear'
        }
      });
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(dataProvider: () => Promise<Array<{ key: string; data: any; tags?: string[] }>>): Promise<void> {
    try {
      console.log('Starting cache warming...');
      const startTime = performance.now();
      
      const warmData = await dataProvider();
      
      await Promise.all(
        warmData.map(item => 
          this.set(item.key, item.data, { 
            tags: item.tags,
            priority: 'high'
          })
        )
      );
      
      const endTime = performance.now();
      console.log(`Cache warming completed in ${(endTime - startTime).toFixed(2)}ms. Warmed ${warmData.length} entries.`);
      
      performanceMonitor.recordMetric({
        name: 'cache.warm',
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          entries: String(warmData.length)
        }
      });
      
    } catch (error) {
      console.error('Cache warming error:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          operation: 'cache-warm'
        }
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getStatistics(): Promise<CacheStatistics> {
    await this.updateStatistics();
    return { ...this.stats };
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Not in cache, create new data
    try {
      const data = await factory();
      
      // Cache the result
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      console.error('Factory function error in getOrSet:', error);
      throw error;
    }
  }

  /**
   * Batch operations for efficiency
   */
  async mget<T>(keys: string[]): Promise<Array<{ key: string; data: T | null }>> {
    const results = await Promise.all(
      keys.map(async (key) => ({
        key,
        data: await this.get<T>(key)
      }))
    );
    
    return results;
  }

  async mset<T>(items: Array<{ key: string; data: T; options?: any }>): Promise<void> {
    await Promise.all(
      items.map(item => this.set(item.key, item.data, item.options))
    );
  }

  /**
   * Private helper methods
   */
  private async promoteToFasterLayers<T>(key: string, entry: CacheEntry<T>, currentLayerIndex: number): Promise<void> {
    // Promote to all faster layers
    for (let i = 0; i < currentLayerIndex; i++) {
      try {
        await this.layers[i].set(key, entry);
      } catch (error) {
        console.warn(`Failed to promote cache entry to layer ${this.layers[i].name}:`, error);
      }
    }
  }

  private selectLayersForPriority(priority: 'low' | 'normal' | 'high'): CacheLayer[] {
    switch (priority) {
      case 'high':
        return this.layers; // Use all layers
      case 'normal':
        return this.layers.slice(0, Math.min(2, this.layers.length)); // Use fastest 2 layers
      case 'low':
        return this.layers.slice(0, 1); // Use only memory layer for low priority
      default:
        return this.layers.slice(0, Math.min(2, this.layers.length));
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async serializeData<T>(data: T): Promise<any> {
    let serialized = data;
    
    if (this.config.enableCompression) {
      // Simple JSON compression (in real app, use proper compression library)
      serialized = JSON.parse(JSON.stringify(data));
    }
    
    if (this.config.enableEncryption) {
      // Simple encryption placeholder (in real app, use proper encryption)
      serialized = btoa(JSON.stringify(serialized)) as T;
    }
    
    return serialized;
  }

  private deserializeData<T>(data: any): T {
    let deserialized = data;
    
    if (this.config.enableEncryption) {
      deserialized = JSON.parse(atob(data));
    }
    
    return deserialized;
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private sanitizeKey(key: string): string {
    return key.length > 50 ? key.substring(0, 50) + '...' : key;
  }

  private async updateStatistics(): Promise<void> {
    try {
      let totalEntries = 0;
      const storageUsage = {
        memory: 0,
        localStorage: 0,
        indexedDB: 0,
        serviceWorker: 0
      };

      for (const layer of this.layers) {
        const keys = await layer.keys();
        const size = await layer.size();
        
        totalEntries += keys.length;
        (storageUsage as any)[layer.name] = size;
      }

      const totalRequests = this.hitCount + this.missCount;
      
      this.stats = {
        totalEntries,
        totalSize: Object.values(storageUsage).reduce((sum, size) => sum + size, 0),
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
        missRate: totalRequests > 0 ? (this.missCount / totalRequests) * 100 : 0,
        evictionCount: this.evictionCount,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        storageUsage
      };
    } catch (error) {
      console.warn('Failed to update cache statistics:', error);
    }
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private isIndexedDBAvailable(): boolean {
    return 'indexedDB' in window;
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private async cleanupExpiredEntries(): Promise<void> {
    try {
      for (const layer of this.layers) {
        const keys = await layer.keys();
        
        for (const key of keys) {
          const entry = await layer.get(key);
          if (entry && this.isExpired(entry)) {
            await layer.delete(key);
            this.evictionCount++;
          }
        }
      }
      
      await this.updateStatistics();
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Export cache for debugging
   */
  async exportCache(): Promise<any> {
    const export_data: any = {};
    
    for (const layer of this.layers) {
      const keys = await layer.keys();
      export_data[layer.name] = {};
      
      for (const key of keys) {
        const entry = await layer.get(key);
        if (entry) {
          export_data[layer.name][key] = {
            ...entry,
            data: typeof entry.data === 'string' ? entry.data.substring(0, 100) + '...' : entry.data
          };
        }
      }
    }
    
    return {
      statistics: this.stats,
      layers: export_data,
      config: this.config
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManagerService();

// React hook for cache operations
export function useCache() {
  return {
    get: <T>(key: string) => cacheManager.get<T>(key),
    set: <T>(key: string, data: T, options?: any) => cacheManager.set(key, data, options),
    has: (key: string) => cacheManager.has(key),
    delete: (key: string) => cacheManager.delete(key),
    clear: () => cacheManager.clear(),
    getOrSet: <T>(key: string, factory: () => Promise<T>, options?: any) => 
      cacheManager.getOrSet(key, factory, options),
    getStatistics: () => cacheManager.getStatistics(),
    warmCache: (dataProvider: () => Promise<Array<{ key: string; data: any; tags?: string[] }>>) => 
      cacheManager.warmCache(dataProvider)
  };
}

export type { CacheConfig, CacheEntry, CacheStatistics };
export default cacheManager;