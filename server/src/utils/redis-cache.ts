/**
 * Redis Cache Implementation
 * 
 * This module provides a Redis-based cache implementation that maintains
 * compatibility with the existing MemoryCache interface while adding
 * distributed caching capabilities.
 */

import { Redis, Cluster } from 'ioredis';
import { getRedisClient, redisManager } from './redis-client';
import { logger } from './logger';

/**
 * Cache entry interface for Redis storage
 */
interface RedisCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage?: number;
}

/**
 * Redis Cache Implementation
 * Maintains compatibility with MemoryCache interface
 */
export class RedisCache {
  private client: Redis | Cluster | null = null;
  private fallbackCache = new Map<string, RedisCacheEntry>();
  private maxFallbackSize = 100; // Smaller fallback cache
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.client = await getRedisClient();
      logger.info('Redis cache initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis cache, using fallback', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Set cache entry with TTL
   */
  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const entry: RedisCacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };

    try {
      if (this.client && redisManager.isRedisConnected()) {
        // Store in Redis with TTL
        await this.client.setex(
          this.formatKey(key),
          ttlSeconds,
          JSON.stringify(entry)
        );
        logger.debug('Cache entry stored in Redis', { key, ttl: ttlSeconds });
      } else {
        // Fallback to memory cache
        this.setInFallbackCache(key, entry);
        logger.debug('Cache entry stored in fallback cache', { key, ttl: ttlSeconds });
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Error storing cache entry', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Always fallback to memory cache on error
      this.setInFallbackCache(key, entry);
    }
  }

  /**
   * Get cache entry
   */
  async get(key: string): Promise<any | null> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        const result = await this.client.get(this.formatKey(key));
        
        if (result) {
          const entry: RedisCacheEntry = JSON.parse(result);
          
          // Check if entry has expired (double-check since Redis TTL should handle this)
          if (Date.now() - entry.timestamp <= entry.ttl) {
            this.stats.hits++;
            logger.debug('Cache hit from Redis', { key });
            return entry.data;
          } else {
            // Entry expired, remove it
            await this.delete(key);
            this.stats.misses++;
            return null;
          }
        } else {
          this.stats.misses++;
          return null;
        }
      } else {
        // Fallback to memory cache
        return this.getFromFallbackCache(key);
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Error retrieving cache entry', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Fallback to memory cache on error
      return this.getFromFallbackCache(key);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        await this.client.del(this.formatKey(key));
        logger.debug('Cache entry deleted from Redis', { key });
      }
      
      // Also remove from fallback cache
      this.fallbackCache.delete(key);
    } catch (error) {
      this.stats.errors++;
      logger.error('Error deleting cache entry', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Still try to remove from fallback
      this.fallbackCache.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        // Use pattern to clear only our keys
        const pattern = this.formatKey('*');
        const keys = await this.client.keys(pattern);
        
        if (keys.length > 0) {
          await this.client.del(...keys);
          logger.info('Redis cache cleared', { keysDeleted: keys.length });
        }
      }
      
      // Clear fallback cache
      this.fallbackCache.clear();
      logger.debug('Fallback cache cleared');
    } catch (error) {
      this.stats.errors++;
      logger.error('Error clearing cache', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Still clear fallback cache
      this.fallbackCache.clear();
    }
  }

  /**
   * Clean up expired entries (for fallback cache)
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.fallbackCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.fallbackCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Fallback cache cleanup completed', { cleanedCount });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    let size = this.fallbackCache.size;
    let memoryUsage = 0;

    try {
      if (this.client && redisManager.isRedisConnected()) {
        // Get Redis memory usage and key count
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        if (memoryMatch) {
          memoryUsage = parseInt(memoryMatch[1], 10);
        }

        // Count our keys
        const pattern = this.formatKey('*');
        const keys = await this.client.keys(pattern);
        size = keys.length;
      }
    } catch (error) {
      logger.error('Error getting cache stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      size,
      maxSize: -1, // Redis doesn't have a fixed max size
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      memoryUsage
    };
  }

  /**
   * Check if cache entry exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        const exists = await this.client.exists(this.formatKey(key));
        return exists === 1;
      } else {
        return this.fallbackCache.has(key);
      }
    } catch (error) {
      logger.error('Error checking cache entry existence', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return this.fallbackCache.has(key);
    }
  }

  /**
   * Get cache entry TTL
   */
  async getTTL(key: string): Promise<number> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        const ttl = await this.client.ttl(this.formatKey(key));
        return ttl;
      } else {
        const entry = this.fallbackCache.get(key);
        if (entry) {
          const remaining = entry.ttl - (Date.now() - entry.timestamp);
          return Math.max(0, Math.floor(remaining / 1000));
        }
        return -1;
      }
    } catch (error) {
      logger.error('Error getting cache entry TTL', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return -1;
    }
  }

  /**
   * Extend cache entry TTL
   */
  async extend(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (this.client && redisManager.isRedisConnected()) {
        const exists = await this.client.expire(this.formatKey(key), ttlSeconds);
        return exists === 1;
      } else {
        const entry = this.fallbackCache.get(key);
        if (entry) {
          entry.ttl = ttlSeconds * 1000;
          entry.timestamp = Date.now();
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Error extending cache entry TTL', { 
        key, 
        ttlSeconds,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Format cache key with prefix
   */
  private formatKey(key: string): string {
    const prefix = process.env.REDIS_KEY_PREFIX || 'flextasker:';
    return `${prefix}cache:${key}`;
  }

  /**
   * Set entry in fallback memory cache
   */
  private setInFallbackCache(key: string, entry: RedisCacheEntry): void {
    // Remove oldest entries if cache is full
    if (this.fallbackCache.size >= this.maxFallbackSize) {
      const oldestKey = this.fallbackCache.keys().next().value;
      this.fallbackCache.delete(oldestKey);
    }

    this.fallbackCache.set(key, entry);
  }

  /**
   * Get entry from fallback memory cache
   */
  private getFromFallbackCache(key: string): any | null {
    const entry = this.fallbackCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }
}

// Export singleton instance
export const redisCache = new RedisCache();

export default redisCache;
