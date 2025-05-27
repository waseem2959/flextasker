/**
 * Cache Middleware
 * 
 * This middleware provides automatic caching for API responses.
 * It caches GET requests and manages cache invalidation for mutation requests.
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService, CachePrefix } from './cache-service';
import { logger } from '../logger';

interface CacheOptions {
  ttl?: number;
  prefix?: CachePrefix;
  customKey?: (req: Request) => string;
}

/**
 * Generate a cache key from the request
 */
function generateCacheKey(req: Request, options?: CacheOptions): string {
  if (options?.customKey) {
    return options.customKey(req);
  }

  // Default key generation based on URL and query params
  const prefix = options?.prefix || CachePrefix.QUERY;
  const baseUrl = req.baseUrl + req.path;
  const queryString = Object.keys(req.query).length 
    ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}`
    : '';
  
  return `${prefix}${baseUrl}${queryString}`;
}

/**
 * Middleware to cache API responses
 */
export function cacheMiddleware(options?: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching if header is present
    if (req.headers['x-bypass-cache']) {
      return next();
    }

    const cacheKey = generateCacheKey(req, options);
    
    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { path: req.path, key: cacheKey });
        return res.status(200).json(cachedData);
      }

      // Cache miss, continue to controller
      logger.debug('Cache miss', { path: req.path, key: cacheKey });
      
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to cache response
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(body);
          cacheService.set(cacheKey, data, options?.ttl);
          logger.debug('Cached response', { path: req.path, key: cacheKey });
        }
        
        // Call original send method
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      // Don't block the request if caching fails
      logger.error('Cache middleware error', { error, path: req.path });
      next();
    }
  };
}

/**
 * Middleware to invalidate cache for specific patterns
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate for mutation requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to invalidate cache after successful response
      res.send = function(body) {
        // Only invalidate for successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Invalidate each pattern asynchronously, don't wait for completion
          patterns.forEach(pattern => {
            cacheService.deletePattern(pattern)
              .catch(error => logger.error('Cache invalidation error', { error, pattern }));
          });
          
          logger.debug('Invalidated cache patterns', { patterns, method: req.method, path: req.path });
        }
        
        // Call original send method
        return originalSend.call(this, body);
      };
    }
    
    next();
  };
}

/**
 * Create a middleware that invalidates task-related cache
 */
export function invalidateTaskCache() {
  return invalidateCacheMiddleware([
    `${CachePrefix.TASK}*`,
    `${CachePrefix.LIST}tasks*`,
    `${CachePrefix.QUERY}/api/tasks*`
  ]);
}

/**
 * Create a middleware that invalidates user-related cache
 */
export function invalidateUserCache() {
  return invalidateCacheMiddleware([
    `${CachePrefix.USER}*`,
    `${CachePrefix.LIST}users*`,
    `${CachePrefix.QUERY}/api/users*`
  ]);
}

/**
 * Create a middleware that invalidates bid-related cache
 */
export function invalidateBidCache() {
  return invalidateCacheMiddleware([
    `${CachePrefix.BID}*`,
    `${CachePrefix.TASK}*`, // Bids affect tasks
    `${CachePrefix.QUERY}/api/bids*`,
    `${CachePrefix.QUERY}/api/tasks*`
  ]);
}

/**
 * Create a middleware that invalidates notification-related cache
 */
export function invalidateNotificationCache() {
  return invalidateCacheMiddleware([
    `${CachePrefix.NOTIFICATION}*`,
    `${CachePrefix.QUERY}/api/notifications*`
  ]);
}
