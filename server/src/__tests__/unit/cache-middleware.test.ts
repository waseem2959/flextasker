/**
 * Unit Tests for Cache Middleware
 * 
 * These tests verify the functionality of the caching middleware
 * including cache hit/miss scenarios, TTL handling, and cache invalidation.
 */

import { NextFunction, Request, Response } from 'express';
import { cacheConfigs, cacheUtils, createCacheMiddleware } from '../../middleware/cache-middleware';

// Mock Redis cache
jest.mock('../../utils/redis-cache', () => ({
  redisCache: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn(),
    getStats: jest.fn().mockResolvedValue({ size: 0, maxSize: 1000, hits: 0, misses: 0, hitRate: 0 })
  }
}));

// Mock Express request/response objects
const createMockRequest = (method: string = 'GET', path: string = '/test', query: any = {}): Partial<Request> => ({
  method,
  path,
  query,
  user: { id: 'test-user-id' }
});

const createMockResponse = (): Partial<Response> => {
  const headers: Record<string, string> = {};
  const response = {
    statusCode: 200,
    headers,
    setHeader: jest.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    getHeader: jest.fn((key: string) => headers[key]),
    json: jest.fn(),
    locals: {}
  };
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

    it('should cache response data', () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      (res.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });

      // Call the overridden json method
      res.json!(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
    });

    it('should return cached data on subsequent requests', () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      const testData = { message: 'cached data' };

      // First request - cache miss
      const req1 = createMockRequest('GET', '/test');
      const res1 = createMockResponse();
      const next1 = createMockNext();

      middleware(req1 as Request, res1 as Response, next1);
      
      // Simulate caching the response
      (res1.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });
      res1.json!(testData);

      // Second request - should be cache hit
      const req2 = createMockRequest('GET', '/test');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      middleware(req2 as Request, res2 as Response, next2);

      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res2.json).toHaveBeenCalledWith(testData);
      expect(next2).not.toHaveBeenCalled(); // Should not call next for cache hits
    });

    it('should generate different cache keys for different requests', () => {
      const middleware = createCacheMiddleware({ ttl: 300 });

      // Request 1
      const req1 = createMockRequest('GET', '/test1');
      const res1 = createMockResponse();
      const next1 = createMockNext();

      middleware(req1 as Request, res1 as Response, next1);

      // Request 2 - different path
      const req2 = createMockRequest('GET', '/test2');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      middleware(req2 as Request, res2 as Response, next2);

      // Both should be cache misses
      expect(res1.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should generate different cache keys for different query parameters', () => {
      const middleware = createCacheMiddleware({ ttl: 300 });

      // Request 1
      const req1 = createMockRequest('GET', '/test', { page: 1 });
      const res1 = createMockResponse();
      const next1 = createMockNext();

      middleware(req1 as Request, res1 as Response, next1);

      // Request 2 - different query
      const req2 = createMockRequest('GET', '/test', { page: 2 });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      middleware(req2 as Request, res2 as Response, next2);

      // Both should be cache misses
      expect(res1.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should respect custom TTL values', () => {
      const customTTL = 600;
      const middleware = createCacheMiddleware({ ttl: customTTL });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      (res.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });
      res.json!(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', `public, max-age=${customTTL}`);
    });

    it('should use custom key generator when provided', () => {
      const customKeyGenerator = jest.fn(() => 'custom-key');
      const middleware = createCacheMiddleware({ 
        ttl: 300,
        keyGenerator: customKeyGenerator
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      expect(customKeyGenerator).toHaveBeenCalledWith(req);
    });

    it('should respect shouldCache function', () => {
      const shouldCache = jest.fn(() => false);
      const middleware = createCacheMiddleware({ 
        ttl: 300,
        shouldCache
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      (res.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });
      res.json!(testData);

      expect(shouldCache).toHaveBeenCalledWith(req, res);
    });

    it('should add Vary headers when specified', () => {
      const varyHeaders = ['Authorization', 'Accept-Language'];
      const middleware = createCacheMiddleware({ 
        ttl: 300,
        varyBy: varyHeaders
      });

      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);

      // Simulate response
      const testData = { message: 'test data' };
      (res.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });
      res.json!(testData);

      expect(res.setHeader).toHaveBeenCalledWith('Vary', varyHeaders.join(', '));
    });
  });

  describe('Predefined Cache Configurations', () => {
    it('should have short-term cache configuration', () => {
      expect(cacheConfigs.short).toBeDefined();
      
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      cacheConfigs.short(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should have medium-term cache configuration', () => {
      expect(cacheConfigs.medium).toBeDefined();
      
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      cacheConfigs.medium(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should have long-term cache configuration', () => {
      expect(cacheConfigs.long).toBeDefined();
      
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      cacheConfigs.long(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should have user-specific cache configuration', () => {
      expect(cacheConfigs.userSpecific).toBeDefined();
      
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      cacheConfigs.userSpecific(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should have public cache configuration', () => {
      expect(cacheConfigs.public).toBeDefined();
      
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      cacheConfigs.public(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache Utilities', () => {
    it('should provide cache statistics', () => {
      const stats = cacheUtils.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    it('should clear all cache', () => {
      // Add some cache entries first
      const middleware = createCacheMiddleware({ ttl: 300 });
      const req = createMockRequest('GET', '/test');
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as Request, res as Response, next);
      
      // Simulate caching
      (res.json as jest.Mock).mockImplementation(function(data) {
        return data;
      });
      res.json!({ test: 'data' });

      // Clear cache
      cacheUtils.clearAll();

      // Next request should be a miss
      const req2 = createMockRequest('GET', '/test');
      const res2 = createMockResponse();
      const next2 = createMockNext();

      middleware(req2 as Request, res2 as Response, next2);
      
      expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should perform cache cleanup', () => {
      expect(() => cacheUtils.cleanup()).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should handle cache size limits', () => {
      const middleware = createCacheMiddleware({ ttl: 300 });
      
      // Create many cache entries to test size limits
      for (let i = 0; i < 1100; i++) { // More than the default max size of 1000
        const req = createMockRequest('GET', `/test${i}`);
        const res = createMockResponse();
        const next = createMockNext();

        middleware(req as Request, res as Response, next);
        
        // Simulate caching
        (res.json as jest.Mock).mockImplementation(function(data) {
          return data;
        });
        res.json!({ test: `data${i}` });
      }

      const stats = cacheUtils.getStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
    });
  });
});
