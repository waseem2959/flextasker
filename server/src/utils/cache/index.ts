/**
 * Cache Module
 *
 * This module provides a centralized cache system with Redis
 * Consolidated from cache-service.ts and redis-cache.ts
 */

// Import and re-export Redis cache (consolidated implementation)
import { getRedisCache, redisCache } from '../redis-cache';

// Import and re-export cache middleware from main middleware directory
import {
    invalidateCache
} from '../../middleware/cache-middleware';

// Import Redis client from main utils
import { getRedisClient } from '../redis-client';

// Create convenience methods that delegate to RedisCache
const getCache = async <T>(key: string): Promise<T | null> => {
  const cache = await getRedisCache();
  return cache.get(key) as Promise<T | null>;
};

const setCache = async <T>(key: string, data: T, expireSeconds: number = 900): Promise<void> => {
  const cache = await getRedisCache();
  return cache.set(key, data, expireSeconds);
};

const deleteCache = async (key: string): Promise<void> => {
  const cache = await getRedisCache();
  return cache.delete(key);
};

// Cache duration constants for backward compatibility
const CACHE_DURATION = {
  DEFAULT: 900, // 15 minutes
  LONG: 86400, // 24 hours
  SHORT: 300, // 5 minutes
  VERY_SHORT: 60, // 1 minute
};

const DEFAULT_CACHE_DURATION = CACHE_DURATION.DEFAULT;
const LONG_CACHE_DURATION = CACHE_DURATION.LONG;

export {
    CACHE_DURATION,
    // Constants
    DEFAULT_CACHE_DURATION, deleteCache,
    // Cache service functions
    getCache, getRedisCache,
    // Redis client
    getRedisClient,
    // Cache middleware
    invalidateCache, LONG_CACHE_DURATION,
    // Redis cache instances
    redisCache, setCache
};

