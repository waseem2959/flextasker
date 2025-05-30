/**
 * Cache Middleware
 * 
 * This middleware provides API response caching with Redis.
 * It improves performance by caching responses for GET requests.
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient } from './redis-client';
import { logger } from '../logger';

// Default cache duration in seconds
const DEFAULT_CACHE_DURATION = 60 * 5; // 5 minutes

// Skip caching for these paths
const CACHE_EXCLUDED_PATHS = [
  '/api/auth',
  '/api/users/me',
  '/api/admin'
];

/**
 * Check if a request should be cached
 */
function shouldCacheRequest(req: Request): boolean {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return false;
  }
  
  // Don't cache excluded paths
  for (const excludedPath of CACHE_EXCLUDED_PATHS) {
    if (req.path.startsWith(excludedPath)) {
      return false;
    }
  }
  
  // Don't cache requests with authorization headers (user-specific data)
  // unless the request explicitly allows it with a cache-control header
  const cacheControl = req.headers['cache-control'];
  if (req.headers.authorization && 
      !cacheControl?.includes('public')) {
    return false;
  }
  
  return true;
}

/**
 * Get cache key for a request
 */
function getCacheKey(req: Request): string {
  // Create a cache key from the request path and query parameters
  const queryString = JSON.stringify(req.query || {});
  return `api:cache:${req.path}:${queryString}`;
}

/**
 * Function to handle errors in cache operations
 */
function handleCacheError(err: unknown): void {
  logger.error('Cache middleware error', { error: err });
}

/**
 * Get cached response from Redis
 */
interface CachedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
}

async function getCachedResponse(req: Request): Promise<CachedResponse | null> {
  const cacheKey = getCacheKey(req);
  try {
    const cachedResponse = await redisClient.get(cacheKey);
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }
  } catch (err) {
    handleCacheError(err);
  }
  return null;
}

/**
 * Middleware for caching API responses
 * 
 * @param duration - Cache duration in seconds (default: 5 minutes)
 */
export function cacheMiddleware(duration: number = DEFAULT_CACHE_DURATION) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for invalid requests
    if (!shouldCacheRequest(req)) {
      next();
      return;
    }
    
    // Check if we have a cached response
    const cached = await getCachedResponse(req);
    if (cached) {
      res.status(200).json(cached);
      return;
    }
    
    // Cache miss - continue to the actual endpoint
    res.setHeader('X-Cache', 'MISS');
    
    // Capture the original res.send to intercept the response
    const originalSend = res.send;
    res.send = function (body: any) {
      // Restore original send
      res.send = originalSend;
      
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Prepare headers to cache (filter out non-cacheable headers)
        const headersToCache = { 
          'content-type': res.getHeader('content-type')
        };
        
        // Cache the response
        const responseToCache = {
          statusCode: res.statusCode,
          body,
          headers: headersToCache,
          timestamp: Date.now()
        };
        
        // Store in Redis
        redisClient.setEx(getCacheKey(req), duration, JSON.stringify(responseToCache))
          .catch((err: unknown) => handleCacheError(err));
      }
      
      // Continue with the original send
      return originalSend.call(this, body);
    };
    
    return next();
  };
}

/**
 * Helper function to invalidate caches by pattern
 */
async function invalidateCacheByPattern(pattern: string): Promise<number> {
  // Scan Redis for keys matching pattern
  let cursor = '0';
  const keys: string[] = [];
  
  do {
    // Using the Redis SCAN command with proper type handling
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });
    
    // The Redis client returns an object with cursor and keys
    cursor = result.cursor;
    if (result.keys && result.keys.length > 0) {
      keys.push(...result.keys);
    }
    
    // Continue until we've scanned all keys (cursor is '0' when done)
  } while (cursor !== '0');
  
  // Delete all found keys
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  
  return keys.length;
}

/**
 * Middleware to invalidate cache for specific paths
 * 
 * @param patterns - Array of path patterns to invalidate
 */
export interface InvalidateCacheOptions {
  [key: string]: unknown;  // Use unknown instead of any for better type safety
}

export function invalidateCache(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Continue with the request first
      next();
      
      // After the response has been sent, invalidate matching caches
      res.on('finish', async () => {
        // Only invalidate cache on successful mutations
        if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            // Invalidate caches for each pattern
            const invalidationCounts = await Promise.all(patterns.map(pattern => invalidateCacheByPattern(`api:cache:${pattern}*`)));
            
            // Log cache invalidation
            logger.debug('Cache invalidated', { 
              count: invalidationCounts.reduce((a, b) => a + b, 0), 
              patterns, 
              path: req.path 
            });
          } catch (err) {
            logger.error('Failed to invalidate cache', { error: err, path: req.path });
          }
        }
      });
    } catch (error) {
      // Log error but don't fail the request
      logger.error('Cache invalidation error', { error, path: req.path });
      next();
    }
  };
}
