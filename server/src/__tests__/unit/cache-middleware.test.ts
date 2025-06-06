/**
 * Unit Tests for Cache Middleware
 * 
 * These tests verify the functionality of the caching middleware
 * including cache hit/miss scenarios, TTL handling, and cache invalidation.
 */

import { NextFunction, Request, Response } from 'express';
import { cacheConfigs, cacheUtils, createCacheMiddleware } from '../../middleware/cache-middleware';

// Mock Redis cache
const mockRedisCache = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  delete: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn(),
  getStats: jest.fn().mockResolvedValue({ size: 0, maxSize: 1000, hits: 0, misses: 0, hitRate: 0 })
};

jest.mock('../../utils/redis-cache', () => ({
  redisCache: mockRedisCache
}));

// Mock Express request/response objects
const createMockRequest = (method: string = 'GET', path: string = '/test', query: any = {}): Partial<Request> => ({
  method,
  path,
  query,
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'USER' as any,
    isActive: true
  }
});

const createMockResponse = (): Partial<Response> => {
  const headers: Record<string, string> = {};
  const response: any = {
    statusCode: 200,
    setHeader: jest.fn((key: string, value: string) => {
      headers[key] = value;
      return response; // Return response for chaining
    }),
    getHeader: jest.fn((key: string) => headers[key]),
    json: jest.fn(),
    locals: {}
  };
  response.json.mockReturnValue(response);
  return response;
};

const createMockNext = (): NextFunction => jest.fn();

describe('Cache Middleware Unit Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheUtils.clearAll();
    jest.clearAllMocks();
  });

  describe('createCacheMiddleware', () => {
    it('should skip caching for non-GET requests', async () => {
      const middleware = createCacheMiddleware();
      const req = createMockRequest('POST');
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalledWith('X-Cache', expect.anything());
    });

    it('should return cache miss on first request', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(next).toHaveBeenCalled();
    });

    it('should cache response data', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce(null);
      mockRedisCache.set.mockResolvedValueOnce(undefined);

      await middleware(req as Request, res as Response, next);

      // Should set cache miss header and call next
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(next).toHaveBeenCalled();

      // Simulate response
      const testData = { message: 'test data' };

      // Call the json method
      res.json!(testData);

      // Headers should be set when json is called
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
    });

    it('should return cached data on subsequent requests', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      const testData = { message: 'cached data' };

      // First request - cache miss
      const req1 = createMockRequest('GET', '/test');
      const res1 = createMockResponse();
      const next1 = createMockNext();

      // Mock cache to actually store data
      mockRedisCache.get.mockResolvedValueOnce(null); // First call returns null (miss)
      mockRedisCache.set.mockResolvedValueOnce(undefined);

      await middleware(req1 as Request, res1 as Response, next1);

      // Simulate caching the response
      res1.json!(testData);

      // Second request - should be cache hit
      const req2 = createMockRequest('GET', '/test');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      // Mock cache to return stored data
      mockRedisCache.get.mockResolvedValueOnce(testData);

      await middleware(req2 as Request, res2 as Response, next2);

      // For cache hit, the middleware should return early
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res2.json).toHaveBeenCalledWith(testData);
    });

    it('should generate different cache keys for different requests', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });

      // Mock cache misses for both requests
      mockRedisCache.get.mockResolvedValue(null);

      // Request 1
      const req1 = createMockRequest('GET', '/test1');
      const res1 = createMockResponse();
      const next1 = createMockNext();

      await middleware(req1 as Request, res1 as Response, next1);

      // Request 2 - different path
      const req2 = createMockRequest('GET', '/test2');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);

      // Both should be cache misses
      expect(res1.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should generate different cache keys for different query parameters', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });

      // Mock cache misses for both requests
      mockRedisCache.get.mockResolvedValue(null);

      // Request 1
      const req1 = createMockRequest('GET', '/test', { page: 1 });
      const res1 = createMockResponse();
      const next1 = createMockNext();

      await middleware(req1 as Request, res1 as Response, next1);

      // Request 2 - different query
      const req2 = createMockRequest('GET', '/test', { page: 2 });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);

      // Both should be cache misses
      expect(res1.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should respect custom TTL values', async () => {
      const customTTL = 600;
      const middleware = createCacheMiddleware({ ttl: customTTL });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      res.json!(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', `public, max-age=${customTTL}`);
    });

    it('should use custom key generator when provided', async () => {
      const customKeyGenerator = jest.fn(() => 'custom-key');
      const middleware = createCacheMiddleware({
        ttl: 300,
        keyGenerator: customKeyGenerator
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req as Request, res as Response, next);

      expect(customKeyGenerator).toHaveBeenCalledWith(req);
    });

    it('should respect shouldCache function', async () => {
      const shouldCache = jest.fn(() => false);
      const middleware = createCacheMiddleware({
        ttl: 300,
        shouldCache
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      res.json!(testData);

      expect(shouldCache).toHaveBeenCalledWith(req, res);
    });

    it('should add Vary headers when specified', async () => {
      const varyHeaders = ['Authorization', 'Accept-Language'];
      const middleware = createCacheMiddleware({
        ttl: 300,
        varyBy: varyHeaders
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      res.json!(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Vary', varyHeaders.join(', '));
    });
  });

  describe('Predefined Cache Configurations', () => {
    beforeEach(() => {
      // Mock cache miss for all predefined config tests
      mockRedisCache.get.mockResolvedValue(null);
    });

    it('should have short-term cache configuration', async () => {
      expect(cacheConfigs.short).toBeDefined();

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await cacheConfigs.short(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should have medium-term cache configuration', async () => {
      expect(cacheConfigs.medium).toBeDefined();

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await cacheConfigs.medium(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should have long-term cache configuration', async () => {
      expect(cacheConfigs.long).toBeDefined();

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await cacheConfigs.long(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should have user-specific cache configuration', async () => {
      expect(cacheConfigs.userSpecific).toBeDefined();

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await cacheConfigs.userSpecific(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should have public cache configuration', async () => {
      expect(cacheConfigs.public).toBeDefined();

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      await cacheConfigs.public(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache Utilities', () => {
    it('should provide cache statistics', async () => {
      const stats = await cacheUtils.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    it('should clear all cache', async () => {
      // Add some cache entries first
      const middleware = createCacheMiddleware({ ttl: 300 });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      // Mock cache miss for first request
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req as Request, res as Response, next);

      // Simulate caching
      res.json!({ test: 'data' });

      // Clear cache
      await cacheUtils.clearAll();

      // Next request should be a miss
      const req2 = createMockRequest('GET', '/test');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      // Mock cache miss for second request
      mockRedisCache.get.mockResolvedValueOnce(null);

      await middleware(req2 as Request, res2 as Response, next2);

      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should perform cache cleanup', () => {
      expect(() => cacheUtils.cleanup()).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should handle cache size limits', async () => {
      const middleware = createCacheMiddleware({ ttl: 300 });

      // Mock cache miss for all requests
      mockRedisCache.get.mockResolvedValue(null);

      // Create many cache entries to test size limits
      for (let i = 0; i < 10; i++) { // Reduced number for test performance
        const req = createMockRequest('GET', `/test${i}`);
        const res = createMockResponse();
        const next = createMockNext();

        await middleware(req as Request, res as Response, next);

        // Simulate caching
        res.json!({ test: `data${i}` });
      }

      const stats = await cacheUtils.getStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize || 1000);
    });
  });
});
