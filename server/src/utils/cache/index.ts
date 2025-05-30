/**
 * Cache Module
 * 
 * This module provides a centralized cache system with Redis
 */

// Import and re-export cache service
import { CacheService, CACHE_DURATION } from './cache-service';

// Import and re-export cache middleware
import {
  cacheMiddleware,
  invalidateCache
} from './cache-middleware';

// Import and re-export Redis client
import { redisClient } from './redis-client';

// Create convenience methods that delegate to CacheService
const getCache = <T>(key: string): Promise<T | null> => CacheService.get<T>(key);
const setCache = <T>(key: string, data: T, expireSeconds?: number): Promise<void> => 
  CacheService.set<T>(key, data, expireSeconds);
const deleteCache = (key: string): Promise<void> => CacheService.invalidate(key);

// Extract constants for backward compatibility
const DEFAULT_CACHE_DURATION = CACHE_DURATION.DEFAULT;
const LONG_CACHE_DURATION = CACHE_DURATION.LONG;

export {
  // Cache service functions
  getCache,
  setCache,
  deleteCache,
  CacheService,
  CACHE_DURATION,
  
  // Cache middleware
  cacheMiddleware,
  invalidateCache,
  
  // Redis client
  redisClient,
  
  // Constants
  DEFAULT_CACHE_DURATION,
  LONG_CACHE_DURATION
};
