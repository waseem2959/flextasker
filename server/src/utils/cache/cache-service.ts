/**
 * Cache Service
 * 
 * This service provides a simple interface for caching data in Redis
 * with typesafe get/set operations and automatic serialization/deserialization.
 */

import { redisClient } from './redis-client';
import { logger } from '@/utils/logger';

// Default cache durations
const DEFAULT_CACHE_DURATION = 60 * 15; // 15 minutes
const LONG_CACHE_DURATION = 60 * 60 * 24; // 24 hours

/**
 * Generic cache service for data storage and retrieval
 */
export class CacheService {
  /**
   * Store a value in cache
   * 
   * @param key - Cache key
   * @param data - Data to cache (will be JSON serialized)
   * @param expireSeconds - Cache duration in seconds
   */
  static async set<T>(key: string, data: T, expireSeconds: number = DEFAULT_CACHE_DURATION): Promise<void> {
    try {
      // Prefix key to avoid conflicts
      const prefixedKey = this.formatKey(key);
      
      // Store serialized data with expiration
      await redisClient.setEx(
        prefixedKey,
        expireSeconds,
        JSON.stringify(data)
      );
    } catch (error) {
      logger.warn('Failed to set cache', { key, error });
      // Don't throw - cache failures shouldn't break functionality
    }
  }

  /**
   * Retrieve a value from cache
   * 
   * @param key - Cache key
   * @returns The cached value or null if not found
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // Prefix key to avoid conflicts
      const prefixedKey = this.formatKey(key);
      
      // Get cached data
      const data = await redisClient.get(prefixedKey);
      
      if (!data) {
        return null;
      }
      
      // Parse and return cached data
      return JSON.parse(data) as T;
    } catch (error) {
      logger.warn('Failed to get from cache', { key, error });
      return null;
    }
  }

  /**
   * Get data from cache or fetch from source if not cached
   * 
   * @param key - Cache key
   * @param fetchFn - Function to call if data not in cache
   * @param expireSeconds - Cache duration in seconds
   */
  static async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expireSeconds: number = DEFAULT_CACHE_DURATION
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedData = await this.get<T>(key);
      
      if (cachedData !== null) {
        return cachedData;
      }
      
      // If not in cache, fetch fresh data
      const freshData = await fetchFn();
      
      // Store in cache for future requests
      await this.set(key, freshData, expireSeconds);
      
      return freshData;
    } catch (error) {
      // If cache fails, just fetch the data directly
      logger.warn('Cache service error in getOrFetch', { key, error });
      return fetchFn();
    }
  }

  /**
   * Remove a specific item from cache
   * 
   * @param key - Cache key to invalidate
   */
  static async invalidate(key: string): Promise<void> {
    try {
      await redisClient.del(this.formatKey(key));
    } catch (error) {
      logger.warn('Failed to invalidate cache', { key, error });
    }
  }

  /**
   * Remove multiple items matching a pattern
   * 
   * @param pattern - Pattern to match (e.g., "user:*")
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      // Find all keys matching the pattern
      const keys = await redisClient.keys(this.formatKey(pattern));
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Delete all matched keys
      await redisClient.del(keys);
      return keys.length;
    } catch (error) {
      logger.warn('Failed to invalidate cache pattern', { pattern, error });
      return 0;
    }
  }

  /**
   * Format a key with consistent prefix
   * 
   * @param key - Original key
   * @returns Prefixed key
   */
  private static formatKey(key: string): string {
    return `flextasker:cache:${key}`;
  }
}

// Export individual durations
export const CACHE_DURATION = {
  DEFAULT: DEFAULT_CACHE_DURATION,
  LONG: LONG_CACHE_DURATION,
  SHORT: 60 * 5, // 5 minutes
  VERY_SHORT: 60, // 1 minute
};
