/**
 * Unit Tests for Redis Cache Implementation
 * 
 * These tests verify the functionality of the Redis cache system
 * including fallback mechanisms, error handling, and performance monitoring.
 */

import { RedisCache } from '../../utils/redis-cache';
import { redisManager } from '../../utils/redis-client';

// Mock Redis client
const mockRedisClient = {
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  expire: jest.fn(),
  info: jest.fn(),
  ping: jest.fn()
};

// Mock Redis manager
jest.mock('../../utils/redis-client', () => ({
  redisManager: {
    isRedisConnected: jest.fn(),
    getClient: jest.fn()
  },
  getRedisClient: jest.fn()
}));

describe('Redis Cache Unit Tests', () => {
  let redisCache: RedisCache;

  beforeEach(() => {
    redisCache = new RedisCache();
    jest.clearAllMocks();
    
    // Default mock implementations
    (redisManager.isRedisConnected as jest.Mock).mockReturnValue(true);
    (redisManager.getClient as jest.Mock).mockReturnValue(mockRedisClient);
  });

  describe('Cache Operations', () => {
    it('should set cache entry in Redis', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };
      const ttl = 300;

      mockRedisClient.setex.mockResolvedValue('OK');

      await redisCache.set(key, data, ttl);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'flextasker:cache:test-key',
        ttl,
        JSON.stringify({
          data,
          timestamp: expect.any(Number),
          ttl: ttl * 1000
        })
      );
    });

    it('should get cache entry from Redis', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: 300000
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cacheEntry));

      const result = await redisCache.get(key);

      expect(result).toEqual(data);
      expect(mockRedisClient.get).toHaveBeenCalledWith('flextasker:cache:test-key');
    });

    it('should return null for non-existent cache entry', async () => {
      const key = 'non-existent-key';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisCache.get(key);

      expect(result).toBeNull();
    });

    it('should delete cache entry from Redis', async () => {
      const key = 'test-key';

      mockRedisClient.del.mockResolvedValue(1);

      await redisCache.delete(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith('flextasker:cache:test-key');
    });

    it('should clear all cache entries', async () => {
      const keys = ['flextasker:cache:key1', 'flextasker:cache:key2'];

      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      await redisCache.clear();

      expect(mockRedisClient.keys).toHaveBeenCalledWith('flextasker:cache:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(...keys);
    });

    it('should handle expired cache entries', async () => {
      const key = 'expired-key';
      const expiredEntry = {
        data: { message: 'expired data' },
        timestamp: Date.now() - 400000, // 400 seconds ago
        ttl: 300000 // 300 seconds TTL
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(expiredEntry));
      mockRedisClient.del.mockResolvedValue(1);

      const result = await redisCache.get(key);

      expect(result).toBeNull();
      expect(mockRedisClient.del).toHaveBeenCalledWith('flextasker:cache:expired-key');
    });
  });

  describe('Fallback Mechanism', () => {
    it('should fallback to memory cache when Redis is unavailable', async () => {
      (redisManager.isRedisConnected as jest.Mock).mockReturnValue(false);

      const key = 'fallback-key';
      const data = { message: 'fallback data' };

      await redisCache.set(key, data, 300);
      const result = await redisCache.get(key);

      expect(result).toEqual(data);
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should fallback to memory cache on Redis error', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Redis connection failed'));
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const key = 'error-key';
      const data = { message: 'error data' };

      await redisCache.set(key, data, 300);
      const result = await redisCache.get(key);

      expect(result).toEqual(data);
    });

    it('should handle fallback cache size limits', async () => {
      (redisManager.isRedisConnected as jest.Mock).mockReturnValue(false);

      // Fill up the fallback cache beyond its limit
      for (let i = 0; i < 150; i++) {
        await redisCache.set(`key-${i}`, { data: i }, 300);
      }

      // First key should be evicted
      const firstResult = await redisCache.get('key-0');
      const lastResult = await redisCache.get('key-149');

      expect(firstResult).toBeNull();
      expect(lastResult).toEqual({ data: 149 });
    });
  });

  describe('Cache Statistics', () => {
    it('should return Redis statistics when connected', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory:1048576\r\n');
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);

      const stats = await redisCache.getStats();

      expect(stats).toEqual({
        size: 3,
        maxSize: -1,
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.any(Number),
        memoryUsage: 1048576
      });
    });

    it('should return fallback statistics when Redis unavailable', async () => {
      (redisManager.isRedisConnected as jest.Mock).mockReturnValue(false);

      await redisCache.set('test-key', { data: 'test' }, 300);
      const stats = await redisCache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(-1);
    });

    it('should track hit and miss statistics', async () => {
      // Cache miss
      mockRedisClient.get.mockResolvedValue(null);
      await redisCache.get('miss-key');

      // Cache hit
      const cacheEntry = {
        data: { message: 'hit data' },
        timestamp: Date.now(),
        ttl: 300000
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cacheEntry));
      await redisCache.get('hit-key');

      const stats = await redisCache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('Advanced Cache Operations', () => {
    it('should check if cache entry exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const exists = await redisCache.exists('existing-key');

      expect(exists).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('flextasker:cache:existing-key');
    });

    it('should get cache entry TTL', async () => {
      mockRedisClient.ttl.mockResolvedValue(150);

      const ttl = await redisCache.getTTL('test-key');

      expect(ttl).toBe(150);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith('flextasker:cache:test-key');
    });

    it('should extend cache entry TTL', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await redisCache.extend('test-key', 600);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('flextasker:cache:test-key', 600);
    });

    it('should handle TTL operations with fallback cache', async () => {
      (redisManager.isRedisConnected as jest.Mock).mockReturnValue(false);

      await redisCache.set('fallback-key', { data: 'test' }, 300);
      
      const exists = await redisCache.exists('fallback-key');
      const ttl = await redisCache.getTTL('fallback-key');
      const extended = await redisCache.extend('fallback-key', 600);

      expect(exists).toBe(true);
      expect(ttl).toBeGreaterThan(0);
      expect(extended).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Connection timeout'));
      mockRedisClient.get.mockRejectedValue(new Error('Connection timeout'));

      const key = 'error-key';
      const data = { message: 'error test' };

      // Should not throw errors
      await expect(redisCache.set(key, data, 300)).resolves.not.toThrow();
      await expect(redisCache.get(key)).resolves.not.toThrow();
    });

    it('should handle malformed cache data', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json');

      const result = await redisCache.get('malformed-key');

      expect(result).toBeNull();
    });

    it('should handle Redis command failures', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Command failed'));
      mockRedisClient.keys.mockRejectedValue(new Error('Command failed'));

      // Should not throw errors
      await expect(redisCache.delete('test-key')).resolves.not.toThrow();
      await expect(redisCache.clear()).resolves.not.toThrow();
    });
  });

  describe('Cache Key Formatting', () => {
    it('should format cache keys with proper prefix', async () => {
      const key = 'user:123:profile';
      
      mockRedisClient.setex.mockResolvedValue('OK');
      await redisCache.set(key, { data: 'test' }, 300);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'flextasker:cache:user:123:profile',
        300,
        expect.any(String)
      );
    });

    it('should handle special characters in cache keys', async () => {
      const key = 'special:key@#$%^&*()';
      
      mockRedisClient.get.mockResolvedValue(null);
      await redisCache.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        'flextasker:cache:special:key@#$%^&*()'
      );
    });
  });

  describe('Memory Management', () => {
    it('should cleanup expired entries in fallback cache', () => {
      (redisManager.isRedisConnected as jest.Mock).mockReturnValue(false);

      // Add entries to fallback cache
      redisCache.set('key1', { data: 'test1' }, 1); // 1 second TTL
      redisCache.set('key2', { data: 'test2' }, 300); // 5 minutes TTL

      // Wait for first entry to expire
      setTimeout(() => {
        redisCache.cleanup();
        
        // Only the non-expired entry should remain
        expect(redisCache.get('key1')).resolves.toBeNull();
        expect(redisCache.get('key2')).resolves.toEqual({ data: 'test2' });
      }, 1100);
    });
  });
});
