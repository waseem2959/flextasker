/**
 * Cache Service
 * 
 * This module provides a high-level API for caching operations.
 * It abstracts Redis operations and provides typed methods for common caching patterns.
 */

import { logger } from '../logger';
import { monitorError } from '../monitoring';
import redisClient, { isRedisConnected } from './redis-client';

// Default cache expiration time: 1 hour (in seconds)
const DEFAULT_CACHE_TTL = 60 * 60;

/**
 * Cache key prefixes to prevent collisions
 */
export enum CachePrefix {
  USER = 'user:',
  TASK = 'task:',
  BID = 'bid:',
  NOTIFICATION = 'notification:',
  CONVERSATION = 'conversation:',
  MESSAGE = 'message:',
  SEARCH = 'search:',
  LIST = 'list:',
  QUERY = 'query:'
}

/**
 * Cache service for Redis operations
 */
export class CacheService {
  private initialized = false;
  
  /**
   * Initialize the cache service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('Cache service already initialized');
      return;
    }
    
    logger.info('Initializing cache service');
    
    try {
      // Check Redis connection
      if (!isRedisConnected()) {
        logger.warn('Redis not connected during cache service initialization');
      } else {
        logger.info('Redis connection verified');
        
        // Clear any stale system keys (but not user data)
        await this.deletePattern('system:*');
        logger.debug('Cleared stale system cache keys');
      }
      
      this.initialized = true;
      logger.info('Cache service initialized successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize cache service', { error: err });
      // Continue without failing - application can work without cache
    }
  }
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Data to cache (will be JSON stringified)
   * @param ttl Time to live in seconds (defaults to 1 hour)
   */
  public async set<T>(key: string, value: T, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.set', key });
      logger.error('Failed to set cache value', { key, error: err });
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!isRedisConnected()) return null;

    try {
      const value = await redisClient.get(key);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.get', key });
      logger.error('Failed to get cache value', { key, error: err });
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  public async delete(key: string): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      await redisClient.del(key);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.delete', key });
      logger.error('Failed to delete cache value', { key, error: err });
    }
  }

  /**
   * Delete multiple values matching a pattern
   * @param pattern Key pattern to match (e.g., "user:*")
   */
  public async deletePattern(pattern: string): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Deleted ${keys.length} cached items matching ${pattern}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.deletePattern', pattern });
      logger.error('Failed to delete cache pattern', { pattern, error: err });
    }
  }

  /**
   * Set a hash field in the cache
   * @param key Cache key
   * @param field Hash field
   * @param value Value to cache
   * @param ttl Time to live in seconds (defaults to 1 hour)
   */
  public async hset<T>(key: string, field: string, value: T, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      const serializedValue = JSON.stringify(value);
      
      await redisClient.hset(key, field, serializedValue);
      await redisClient.expire(key, ttl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.hset', key, field });
      logger.error('Failed to set hash field', { key, field, error: err });
    }
  }

  /**
   * Get a hash field from the cache
   * @param key Cache key
   * @param field Hash field
   * @returns The cached value or null if not found
   */
  public async hget<T>(key: string, field: string): Promise<T | null> {
    if (!isRedisConnected()) return null;

    try {
      const value = await redisClient.hget(key, field);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.hget', key, field });
      logger.error('Failed to get hash field', { key, field, error: err });
      return null;
    }
  }

  /**
   * Get all hash fields from the cache
   * @param key Cache key
   * @returns Object with all hash fields or null if not found
   */
  public async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    if (!isRedisConnected()) return null;

    try {
      const hash = await redisClient.hgetall(key);
      
      if (!hash || Object.keys(hash).length === 0) return null;
      
      // Parse each value in the hash
      const result: Record<string, T> = {};
      for (const field in hash) {
        result[field] = JSON.parse(hash[field]) as T;
      }
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.hgetall', key });
      logger.error('Failed to get all hash fields', { key, error: err });
      return null;
    }
  }

  /**
   * Delete a hash field from the cache
   * @param key Cache key
   * @param field Hash field
   */
  public async hdel(key: string, field: string): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      await redisClient.hdel(key, field);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.hdel', key, field });
      logger.error('Failed to delete hash field', { key, field, error: err });
    }
  }

  /**
   * Increment a numeric value in the cache
   * @param key Cache key
   * @param increment Amount to increment by (defaults to 1)
   * @param ttl Time to live in seconds (defaults to 1 hour)
   * @returns The new value
   */
  public async increment(key: string, increment: number = 1, ttl: number = DEFAULT_CACHE_TTL): Promise<number> {
    if (!isRedisConnected()) return 0;

    try {
      const newValue = await redisClient.incrby(key, increment);
      await redisClient.expire(key, ttl);
      return newValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.increment', key });
      logger.error('Failed to increment cache value', { key, increment, error: err });
      return 0;
    }
  }

  /**
   * Add a member to a sorted set with a score
   * @param key Cache key
   * @param member Member to add
   * @param score Score for the member
   * @param ttl Time to live in seconds (defaults to 1 hour)
   */
  public async zadd(key: string, score: number, member: string, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
    if (!isRedisConnected()) return;

    try {
      await redisClient.zadd(key, score, member);
      await redisClient.expire(key, ttl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.zadd', key });
      logger.error('Failed to add member to sorted set', { key, member, score, error: err });
    }
  }

  /**
   * Get members from a sorted set by score range
   * @param key Cache key
   * @param min Minimum score (inclusive)
   * @param max Maximum score (inclusive)
   * @returns Array of members
   */
  public async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    if (!isRedisConnected()) return [];

    try {
      return await redisClient.zrangebyscore(key, min, max);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      monitorError(err, { component: 'CacheService.zrangebyscore', key });
      logger.error('Failed to get members from sorted set', { key, min, max, error: err });
      return [];
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

export default cacheService;
