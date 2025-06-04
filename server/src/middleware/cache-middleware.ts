/**
 * Cache Middleware
 * 
 * This module provides caching functionality for API responses to improve performance
 * and reduce database load for frequently accessed data.
 */

import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

// Cache entry interface (maintained for compatibility)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Hybrid Cache Implementation
 * Uses Redis for distributed caching with fallback to memory cache
 * Maintains compatibility with existing MemoryCache interface
 */
class HybridCache {
  private readonly fallbackCache = new Map<string, CacheEntry>();
  private readonly maxFallbackSize = 100; // Smaller fallback cache

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redisCache.set(key, data, ttlSeconds);
    } catch (error) {
      logger.warn('Redis cache set failed, using fallback', { key, error });
      this.setFallback(key, data, ttlSeconds);
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const result = await redisCache.get(key);
      if (result !== null) {
        return result;
      }
    } catch (error) {
      logger.warn('Redis cache get failed, using fallback', { key, error });
    }

    return this.getFallback(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await redisCache.delete(key);
    } catch (error) {
      logger.warn('Redis cache delete failed', { key, error });
    }

    this.fallbackCache.delete(key);
  }

  async clear(): Promise<void> {
    try {
      await redisCache.clear();
    } catch (error) {
      logger.warn('Redis cache clear failed', { error });
    }

    this.fallbackCache.clear();
  }

  cleanup(): void {
    redisCache.cleanup();

    // Clean up fallback cache
    const now = Date.now();
    for (const [key, entry] of this.fallbackCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.fallbackCache.delete(key);
      }
    }
  }

  async getStats(): Promise<{ size: number; maxSize: number; redis?: any }> {
    try {
      const redisStats = await redisCache.getStats();
      return {
        size: redisStats.size + this.fallbackCache.size,
        maxSize: redisStats.maxSize,
        redis: redisStats
      };
    } catch (error) {
      return {
        size: this.fallbackCache.size,
        maxSize: this.maxFallbackSize
      };
    }
  }

  private setFallback(key: string, data: any, ttlSeconds: number): void {
    if (this.fallbackCache.size >= this.maxFallbackSize) {
      const oldestKey = this.fallbackCache.keys().next().value;
      this.fallbackCache.delete(oldestKey);
    }

    this.fallbackCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  private getFallback(key: string): any | null {
    const entry = this.fallbackCache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      return null;
    }

    return entry.data;
  }
}

// Global hybrid cache instance (Redis + fallback)
const cache = new HybridCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request): string {
  const { method, path, query, user } = req;
  const userId = user?.id || 'anonymous';
  
  // Create a unique key based on method, path, query params, and user
  const keyData = {
    method,
    path,
    query,
    userId
  };
  
  return createHash('md5').update(JSON.stringify(keyData)).digest('hex');
}

/**
 * Cache middleware factory
 */
export function createCacheMiddleware(options: {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  varyBy?: string[]; // Headers to vary cache by
} = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = generateCacheKey,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200,
    varyBy = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey, path: req.path });

        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);

        return res.json(cachedData);
      }

      // Cache miss - intercept response
      logger.debug('Cache miss', { key: cacheKey, path: req.path });
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data: any) {
        // Check if we should cache this response
        if (shouldCache(req, res)) {
          // Cache asynchronously without blocking response
          cache.set(cacheKey, data, ttl).catch(error => {
            logger.error('Failed to cache response', { key: cacheKey, error });
          });
          logger.debug('Response cached', { key: cacheKey, path: req.path, ttl });
        }

        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);

        // Add vary headers
        if (varyBy.length > 0) {
          res.setHeader('Vary', varyBy.join(', '));
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { key: cacheKey, error });
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return (req: Request, res: Response, next: NextFunction) => {
    const patternsToInvalidate = typeof patterns === 'function' ? patterns(req) : patterns;
    
    // Store patterns for post-response invalidation
    res.locals.cacheInvalidationPatterns = patternsToInvalidate;
    
    next();
  };
}

/**
 * Post-response cache invalidation
 */
export function postResponseCacheInvalidation(req: Request, res: Response, next: NextFunction) {
  // Store original end method
  const originalEnd = res.end;

  res.end = function(...args: any[]) {
    // Invalidate cache patterns if response was successful
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const patterns = res.locals.cacheInvalidationPatterns;
      if (patterns && Array.isArray(patterns)) {
        patterns.forEach(pattern => {
          // Async cache invalidation without blocking response
          cache.clear().catch(error => {
            logger.error('Cache invalidation failed', { pattern, error });
          });
          logger.debug('Cache invalidated', { pattern, path: req.path });
        });
      }
    }

    // Call original end method
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short-term cache for frequently changing data
  short: createCacheMiddleware({ ttl: 60 }), // 1 minute
  
  // Medium-term cache for moderately changing data
  medium: createCacheMiddleware({ ttl: 300 }), // 5 minutes
  
  // Long-term cache for rarely changing data
  long: createCacheMiddleware({ ttl: 3600 }), // 1 hour
  
  // User-specific cache
  userSpecific: createCacheMiddleware({
    ttl: 300,
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return `user:${userId}:${req.path}:${JSON.stringify(req.query)}`;
    }
  }),
  
  // Public data cache (no user-specific data)
  public: createCacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => `public:${req.path}:${JSON.stringify(req.query)}`
  })
};

/**
 * Cache management utilities
 */
export const cacheUtils = {
  // Get cache statistics
  getStats: async () => {
    try {
      return await cache.getStats();
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return { size: 0, maxSize: 0 };
    }
  },

  // Clear all cache
  clearAll: async () => {
    try {
      await cache.clear();
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  },

  // Clear specific cache entry
  clear: async (key: string) => {
    try {
      await cache.delete(key);
      logger.debug('Cache entry cleared', { key });
    } catch (error) {
      logger.error('Failed to clear cache entry', { key, error });
    }
  },

  // Manual cache cleanup
  cleanup: () => {
    cache.cleanup();
    logger.debug('Cache cleanup completed');
  },

  // Check if Redis is available
  isRedisAvailable: async () => {
    try {
      await redisCache.get('health-check');
      return true;
    } catch (error) {
      return false;
    }
  }
};

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  // Warm up cache for specific endpoints
  warmUp: async (endpoints: Array<{ path: string; query?: any }>) => {
    logger.info('Starting cache warm-up', { endpoints: endpoints.length });
    
    for (const endpoint of endpoints) {
      try {
        // In a real implementation, you would make internal requests to warm the cache
        logger.debug('Warming cache for endpoint', endpoint);
      } catch (error) {
        logger.error('Cache warm-up failed for endpoint', { endpoint, error });
      }
    }
    
    logger.info('Cache warm-up completed');
  }
};

export default {
  createCacheMiddleware,
  invalidateCache,
  postResponseCacheInvalidation,
  cacheConfigs,
  cacheUtils,
  cacheWarming
};
