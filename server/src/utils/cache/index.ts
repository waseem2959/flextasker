/**
 * Cache Module Index
 * 
 * This module exports all cache-related functionality for easy access.
 */

// Import and re-export cache service
import cacheService, { CachePrefix } from './cache-service';

// Import and re-export cache middleware
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
  invalidateTaskCache,
  invalidateUserCache,
  invalidateBidCache,
  invalidateNotificationCache
} from './cache-middleware';

// Import and re-export Redis client
import redisClient, {
  getRedisClient, 
  isRedisConnected, 
  closeRedisConnection 
} from './redis-client';

// Import and re-export constants
import { 
  DEFAULT_CACHE_TTL, 
  DEFAULT_CACHE_OPTIONS, 
  MAX_CACHE_LIST_SIZE 
} from './constants';

// Export everything
export {
  cacheService,
  cacheMiddleware,
  invalidateCacheMiddleware,
  invalidateTaskCache,
  invalidateUserCache,
  invalidateBidCache,
  invalidateNotificationCache,
  redisClient,
  getRedisClient,
  isRedisConnected,
  closeRedisConnection,
  CachePrefix,
  DEFAULT_CACHE_TTL,
  DEFAULT_CACHE_OPTIONS,
  MAX_CACHE_LIST_SIZE
};
