/**
 * Redis Cache Service
 * 
 * Advanced Redis caching service with intelligent invalidation,
 * cache warming, and performance monitoring.
 */

import { Redis } from 'ioredis';
import { z } from 'zod';

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: string;
  hitCount: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  invalidations: number;
  avgResponseTime: number;
  memoryUsage: number;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface CachePattern {
  pattern: string;
  ttl: number;
  tags: string[];
  compression: boolean;
  serialization: 'json' | 'msgpack';
}

class RedisCacheService {
  private redis: Redis | null = null;
  private fallbackCache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics;
  private patterns: Map<string, CachePattern> = new Map();
  private warmingQueue: Set<string> = new Set();
  private compressionThreshold = 1024; // Compress values larger than 1KB

  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      connectionStatus: 'disconnected'
    };

    this.initializeRedis();
    this.setupPatterns();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('⚠️ REDIS_URL not configured, using in-memory fallback');
        return;
      }

      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        commandTimeout: 5000
      });

      // Event handlers
      this.redis.on('connect', () => {
        console.log('✅ Redis connected');
        this.metrics.connectionStatus = 'connected';
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis error:', error);
        this.metrics.connectionStatus = 'error';
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.metrics.connectionStatus = 'disconnected';
      });

      // Test connection
      await this.redis.ping();
      
    } catch (error) {
      console.error('Redis initialization failed:', error);
      this.metrics.connectionStatus = 'error';
    }
  }

  /**
   * Setup caching patterns for different data types
   */
  private setupPatterns(): void {
    this.patterns.set('user:*', {
      pattern: 'user:*',
      ttl: 15 * 60, // 15 minutes
      tags: ['users'],
      compression: true,
      serialization: 'json'
    });

    this.patterns.set('task:*', {
      pattern: 'task:*',
      ttl: 10 * 60, // 10 minutes
      tags: ['tasks'],
      compression: true,
      serialization: 'json'
    });

    this.patterns.set('tasks:list:*', {
      pattern: 'tasks:list:*',
      ttl: 5 * 60, // 5 minutes
      tags: ['tasks', 'listings'],
      compression: true,
      serialization: 'json'
    });

    this.patterns.set('search:*', {
      pattern: 'search:*',
      ttl: 10 * 60, // 10 minutes
      tags: ['search'],
      compression: true,
      serialization: 'json'
    });

    this.patterns.set('analytics:*', {
      pattern: 'analytics:*',
      ttl: 60 * 60, // 1 hour
      tags: ['analytics'],
      compression: true,
      serialization: 'json'
    });

    this.patterns.set('session:*', {
      pattern: 'session:*',
      ttl: 24 * 60 * 60, // 24 hours
      tags: ['sessions'],
      compression: false,
      serialization: 'json'
    });
  }

  /**
   * Get value from cache with intelligent fallback
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      let result: CacheEntry<T> | null = null;

      // Try Redis first
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          result = this.deserialize(redisValue);
          
          // Update hit count
          if (result) {
            result.hitCount = (result.hitCount || 0) + 1;
            // Update hit count in Redis asynchronously
            this.redis.hset(`${key}:meta`, 'hitCount', result.hitCount);
          }
        }
      }

      // Fallback to in-memory cache
      if (!result && this.fallbackCache.has(key)) {
        result = this.fallbackCache.get(key) || null;
      }

      // Check expiration
      if (result && this.isExpired(result)) {
        await this.delete(key);
        result = null;
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(result ? 'hit' : 'miss', responseTime);

      return result?.value || null;

    } catch (error) {
      console.error('Cache get error:', error);
      this.updateMetrics('miss', Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in cache with intelligent patterns
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      tags?: string[];
      compression?: boolean;
      version?: string;
    } = {}
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Get pattern-based defaults
      const pattern = this.getPatternForKey(key);
      const ttl = options.ttl || pattern?.ttl || 300; // Default 5 minutes
      const tags = options.tags || pattern?.tags || [];
      const compression = options.compression ?? pattern?.compression ?? false;

      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        tags,
        version: options.version || '1.0',
        hitCount: 0
      };

      const serialized = this.serialize(entry, compression);

      // Store in Redis
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const pipeline = this.redis.pipeline();
        
        // Set the main value
        pipeline.setex(key, ttl, serialized);
        
        // Store metadata
        pipeline.hset(`${key}:meta`, {
          timestamp: entry.timestamp,
          ttl: entry.ttl,
          version: entry.version,
          tags: JSON.stringify(tags),
          hitCount: 0
        });

        // Add to tag sets for invalidation
        for (const tag of tags) {
          pipeline.sadd(`tag:${tag}`, key);
          pipeline.expire(`tag:${tag}`, ttl + 300); // Tags live slightly longer
        }

        await pipeline.exec();
      }

      // Store in fallback cache
      this.fallbackCache.set(key, entry);

      // Cleanup fallback cache if it gets too large
      if (this.fallbackCache.size > 1000) {
        this.cleanupFallbackCache();
      }

      // Update metrics
      this.updateMetrics('set', Date.now() - startTime);
      
      return true;

    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from Redis
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const pipeline = this.redis.pipeline();
        
        // Get tags before deletion for cleanup
        const meta = await this.redis.hgetall(`${key}:meta`);
        if (meta.tags) {
          const tags = JSON.parse(meta.tags);
          for (const tag of tags) {
            pipeline.srem(`tag:${tag}`, key);
          }
        }

        pipeline.del(key);
        pipeline.del(`${key}:meta`);
        
        const results = await pipeline.exec();
        deleted = results?.some(result => result[1] > 0) || false;
      }

      // Delete from fallback cache
      if (this.fallbackCache.has(key)) {
        this.fallbackCache.delete(key);
        deleted = true;
      }

      if (deleted) {
        this.updateMetrics('delete', 0);
      }

      return deleted;

    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      // Check Redis first
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const exists = await this.redis.exists(key);
        if (exists) return true;
      }

      // Check fallback cache
      if (this.fallbackCache.has(key)) {
        const entry = this.fallbackCache.get(key);
        if (entry && !this.isExpired(entry)) {
          return true;
        } else if (entry) {
          // Clean up expired entry
          this.fallbackCache.delete(key);
        }
      }

      return false;

    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;

    try {
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const pipeline = this.redis.pipeline();

        for (const tag of tags) {
          // Get all keys with this tag
          const keys = await this.redis.smembers(`tag:${tag}`);
          
          for (const key of keys) {
            pipeline.del(key);
            pipeline.del(`${key}:meta`);
            invalidatedCount++;
          }

          // Clear the tag set
          pipeline.del(`tag:${tag}`);
        }

        await pipeline.exec();
      }

      // Invalidate from fallback cache
      for (const [key, entry] of this.fallbackCache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          this.fallbackCache.delete(key);
          invalidatedCount++;
        }
      }

      this.metrics.invalidations += invalidatedCount;
      
      console.log(`🧹 Invalidated ${invalidatedCount} cache entries for tags: ${tags.join(', ')}`);
      
      return invalidatedCount;

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Warm cache with precomputed data
   */
  async warmCache(entries: Array<{
    key: string;
    value: any;
    ttl?: number;
    tags?: string[];
  }>): Promise<number> {
    let warmedCount = 0;

    try {
      const promises = entries.map(async entry => {
        if (!this.warmingQueue.has(entry.key)) {
          this.warmingQueue.add(entry.key);
          
          const success = await this.set(entry.key, entry.value, {
            ttl: entry.ttl,
            tags: entry.tags
          });

          this.warmingQueue.delete(entry.key);
          
          if (success) warmedCount++;
        }
      });

      await Promise.all(promises);
      
      console.log(`🔥 Warmed ${warmedCount} cache entries`);
      
      return warmedCount;

    } catch (error) {
      console.error('Cache warming error:', error);
      return warmedCount;
    }
  }

  /**
   * Get cache statistics and health
   */
  async getStats(): Promise<{
    metrics: CacheMetrics;
    memory: {
      used: number;
      peak: number;
      fragmentation: number;
    };
    connections: {
      redis: boolean;
      fallback: boolean;
    };
    performance: {
      hitRate: number;
      avgResponseTime: number;
      topKeys: Array<{key: string; hits: number}>;
    };
    patterns: Array<{pattern: string; usage: number}>;
  }> {
    try {
      // Get Redis memory info
      let memoryInfo = { used: 0, peak: 0, fragmentation: 1 };
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        const info = await this.redis.memory('usage-sample');
        memoryInfo = {
          used: info || 0,
          peak: 0, // Would need INFO memory command
          fragmentation: 1
        };
      }

      // Calculate hit rate
      const totalRequests = this.metrics.hits + this.metrics.misses;
      const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

      // Get top keys (from fallback cache for simplicity)
      const topKeys = Array.from(this.fallbackCache.entries())
        .map(([key, entry]) => ({ key, hits: entry.hitCount || 0 }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10);

      // Pattern usage analysis
      const patternUsage = Array.from(this.patterns.entries()).map(([pattern, config]) => ({
        pattern,
        usage: topKeys.filter(k => this.matchesPattern(k.key, pattern)).length
      }));

      return {
        metrics: { ...this.metrics },
        memory: memoryInfo,
        connections: {
          redis: this.metrics.connectionStatus === 'connected',
          fallback: true
        },
        performance: {
          hitRate,
          avgResponseTime: this.metrics.avgResponseTime,
          topKeys
        },
        patterns: patternUsage
      };

    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        metrics: this.metrics,
        memory: { used: 0, peak: 0, fragmentation: 1 },
        connections: { redis: false, fallback: true },
        performance: { hitRate: 0, avgResponseTime: 0, topKeys: [] },
        patterns: []
      };
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<boolean> {
    try {
      // Clear Redis
      if (this.redis && this.metrics.connectionStatus === 'connected') {
        await this.redis.flushdb();
      }

      // Clear fallback cache
      this.fallbackCache.clear();

      // Reset metrics
      this.metrics.hits = 0;
      this.metrics.misses = 0;
      this.metrics.sets = 0;
      this.metrics.deletes = 0;
      this.metrics.invalidations = 0;

      console.log('🧹 Cache cleared');
      return true;

    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Private helper methods

  private getPatternForKey(key: string): CachePattern | null {
    for (const [pattern, config] of this.patterns) {
      if (this.matchesPattern(key, pattern)) {
        return config;
      }
    }
    return null;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching (could be enhanced with regex)
    return pattern.endsWith('*') 
      ? key.startsWith(pattern.slice(0, -1))
      : key === pattern;
  }

  private serialize(entry: CacheEntry, compression: boolean): string {
    let serialized = JSON.stringify(entry);
    
    if (compression && serialized.length > this.compressionThreshold) {
      // In a real implementation, you'd use a compression library like zlib
      // For now, we'll just mark it as compressed
      return `compressed:${serialized}`;
    }
    
    return serialized;
  }

  private deserialize<T>(data: string): CacheEntry<T> | null {
    try {
      let decompressed = data;
      
      if (data.startsWith('compressed:')) {
        // In a real implementation, you'd decompress here
        decompressed = data.substring(11);
      }
      
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Cache deserialization error:', error);
      return null;
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateMetrics(operation: 'hit' | 'miss' | 'set' | 'delete', responseTime: number): void {
    switch (operation) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'set':
        this.metrics.sets++;
        break;
      case 'delete':
        this.metrics.deletes++;
        break;
    }

    // Update average response time
    const totalOps = this.metrics.hits + this.metrics.misses + this.metrics.sets + this.metrics.deletes;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (totalOps - 1) + responseTime) / totalOps;
  }

  private cleanupFallbackCache(): void {
    // Remove expired entries first
    for (const [key, entry] of this.fallbackCache.entries()) {
      if (this.isExpired(entry)) {
        this.fallbackCache.delete(key);
      }
    }

    // If still too large, remove least recently used entries
    if (this.fallbackCache.size > 1000) {
      const entries = Array.from(this.fallbackCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.fallbackCache.size - 800);
      toRemove.forEach(([key]) => this.fallbackCache.delete(key));
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      this.fallbackCache.clear();
      console.log('🔌 Redis cache service shutdown complete');
    } catch (error) {
      console.error('Error during cache shutdown:', error);
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCacheService();

// Export convenience functions
export const cacheGet = <T = any>(key: string) => redisCache.get<T>(key);
export const cacheSet = <T = any>(key: string, value: T, options?: any) => redisCache.set(key, value, options);
export const cacheDelete = (key: string) => redisCache.delete(key);
export const cacheHas = (key: string) => redisCache.has(key);
export const invalidateCache = (tags: string[]) => redisCache.invalidateByTags(tags);

export default redisCache;