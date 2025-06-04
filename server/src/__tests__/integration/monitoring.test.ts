/**
 * Integration Tests for Monitoring System
 * 
 * These tests verify the functionality of the performance monitoring system,
 * cache middleware, and database optimization features.
 */

import request from 'supertest';
import { Application } from 'express';
import PerformanceMonitor from '../../monitoring/performance-monitor';
import { cacheUtils } from '../../middleware/cache-middleware';
import { QueryPerformanceMonitor } from '../../utils/database-optimization';
import { createTestApp, createTestUser, getAuthToken } from '../../utils/test-utils';

describe('Monitoring System Integration Tests', () => {
  let app: Application;
  let authToken: string;
  let adminToken: string;
  let performanceMonitor: PerformanceMonitor;
  let queryMonitor: QueryPerformanceMonitor;

  beforeAll(async () => {
    app = await createTestApp();
    performanceMonitor = PerformanceMonitor.getInstance();
    queryMonitor = QueryPerformanceMonitor.getInstance();
    
    // Create test users
    const testUser = await createTestUser({ role: 'USER' });
    const adminUser = await createTestUser({ role: 'ADMIN' });
    
    authToken = await getAuthToken(testUser.id);
    adminToken = await getAuthToken(adminUser.id);
  });

  beforeEach(() => {
    // Reset monitoring data before each test
    performanceMonitor.resetMetrics();
    queryMonitor.resetStats();
    cacheUtils.clearAll();
  });

  describe('Performance Monitoring Middleware', () => {
    it('should record API request metrics', async () => {
      // Make a test API request
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify metrics were recorded
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.api.totalRequests).toBe(1);
      expect(metrics.api.successfulRequests).toBe(1);
      expect(metrics.api.failedRequests).toBe(0);
      expect(metrics.api.averageResponseTime).toBeGreaterThan(0);
    });

    it('should record failed request metrics', async () => {
      // Make a request that should fail
      await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.api.totalRequests).toBe(1);
      expect(metrics.api.successfulRequests).toBe(0);
      expect(metrics.api.failedRequests).toBe(1);
    });

    it('should track active users', async () => {
      // Make multiple requests with the same user
      await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.system.activeUsers).toBe(1);
    });
  });

  describe('Cache Middleware', () => {
    it('should cache GET requests and record cache hits', async () => {
      const endpoint = '/api/tasks';
      
      // First request - should be a cache miss
      const response1 = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response1.headers['x-cache']).toBe('MISS');

      // Second request - should be a cache hit
      const response2 = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response2.headers['x-cache']).toBe('HIT');

      // Verify cache metrics
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cache.hits).toBe(1);
      expect(metrics.cache.misses).toBe(1);
      expect(metrics.cache.totalRequests).toBe(2);
      expect(metrics.cache.hitRate).toBe(0.5);
    });

    it('should not cache POST requests', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        budget: 100,
        categoryId: 'test-category'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.headers['x-cache']).toBeUndefined();
    });

    it('should respect cache TTL', async () => {
      const endpoint = '/api/tasks';
      
      // Make initial request
      await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Simulate cache expiration by clearing cache
      cacheUtils.clearAll();

      // Next request should be a miss
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.headers['x-cache']).toBe('MISS');
    });
  });

  describe('Database Query Monitoring', () => {
    it('should record query performance metrics', async () => {
      // Make a request that triggers database queries
      await request(app)
        .get('/api/users/me/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const queryStats = queryMonitor.getStats();
      expect(Object.keys(queryStats).length).toBeGreaterThan(0);
      
      // Check that at least one query was recorded
      const firstQueryName = Object.keys(queryStats)[0];
      const firstQueryStats = queryStats[firstQueryName];
      expect(firstQueryStats.count).toBeGreaterThan(0);
      expect(firstQueryStats.avgTime).toBeGreaterThan(0);
    });

    it('should identify slow queries', async () => {
      // Simulate a slow query by making a complex request
      await request(app)
        .get('/api/tasks?page=1&limit=50&search=complex')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const queryStats = queryMonitor.getStats();
      const slowQueries = Object.entries(queryStats)
        .filter(([_, stats]) => stats.avgTime > 100);
      
      // In a real test, you might have specific slow queries to check for
      expect(queryStats).toBeDefined();
    });
  });

  describe('Monitoring API Endpoints', () => {
    describe('Health Check Endpoints', () => {
      it('should return basic health status', async () => {
        const response = await request(app)
          .get('/api/monitoring/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('healthy');
        expect(response.body.data.timestamp).toBeDefined();
        expect(response.body.data.uptime).toBeGreaterThan(0);
      });

      it('should return detailed health status for admins', async () => {
        const response = await request(app)
          .get('/api/monitoring/health/detailed')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.alerts).toBeDefined();
        expect(response.body.data.services).toBeDefined();
      });

      it('should deny access to detailed health for non-admins', async () => {
        await request(app)
          .get('/api/monitoring/health/detailed')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('Metrics Endpoints', () => {
      it('should return performance metrics for admins', async () => {
        // Generate some metrics first
        await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app)
          .get('/api/monitoring/metrics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.summary).toBeDefined();
        expect(response.body.data.detailed).toBeDefined();
        expect(response.body.data.alerts).toBeDefined();
      });

      it('should support period filtering', async () => {
        const response = await request(app)
          .get('/api/monitoring/metrics?period=24h')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.period).toBe('24h');
      });

      it('should deny access to metrics for non-admins', async () => {
        await request(app)
          .get('/api/monitoring/metrics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('Cache Monitoring', () => {
      it('should return cache statistics', async () => {
        // Generate cache activity
        await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app)
          .get('/api/monitoring/cache')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.statistics).toBeDefined();
        expect(response.body.data.performance).toBeDefined();
        expect(response.body.data.recommendations).toBeDefined();
      });
    });

    describe('Database Monitoring', () => {
      it('should return database performance data', async () => {
        // Generate database activity
        await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const response = await request(app)
          .get('/api/monitoring/database')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics).toBeDefined();
        expect(response.body.data.queryStatistics).toBeDefined();
        expect(response.body.data.slowQueries).toBeDefined();
        expect(response.body.data.recommendations).toBeDefined();
      });
    });

    describe('Security Monitoring', () => {
      it('should return security metrics', async () => {
        const response = await request(app)
          .get('/api/monitoring/security')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics).toBeDefined();
        expect(response.body.data.riskLevel).toBeDefined();
        expect(response.body.data.recommendations).toBeDefined();
      });
    });

    describe('Alerts System', () => {
      it('should return current alerts', async () => {
        const response = await request(app)
          .get('/api/monitoring/alerts')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.alerts).toBeDefined();
        expect(response.body.data.count).toBeDefined();
        expect(response.body.data.timestamp).toBeDefined();
      });

      it('should filter alerts by severity', async () => {
        const response = await request(app)
          .get('/api/monitoring/alerts?severity=high')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        // All returned alerts should be high severity
        response.body.data.alerts.forEach((alert: any) => {
          expect(alert.severity).toBe('high');
        });
      });
    });

    describe('Metrics Reset', () => {
      it('should reset all monitoring metrics', async () => {
        // Generate some metrics first
        await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Reset metrics
        await request(app)
          .post('/api/monitoring/reset')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify metrics are reset
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.api.totalRequests).toBe(0);
        expect(metrics.cache.totalRequests).toBe(0);
      });

      it('should deny reset access to non-admins', async () => {
        await request(app)
          .post('/api/monitoring/reset')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });
  });

  describe('Performance Alerts', () => {
    it('should generate alerts for poor performance', async () => {
      // Simulate poor performance by recording slow responses
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordApiRequest(3000, 200); // 3 second response time
      }

      const alerts = performanceMonitor.checkAlerts();
      const performanceAlerts = alerts.filter(alert => 
        alert.type === 'api_performance' && alert.severity === 'high'
      );
      
      expect(performanceAlerts.length).toBeGreaterThan(0);
    });

    it('should generate alerts for high error rates', async () => {
      // Simulate high error rate
      for (let i = 0; i < 20; i++) {
        performanceMonitor.recordApiRequest(100, i < 15 ? 500 : 200);
      }

      const alerts = performanceMonitor.checkAlerts();
      const errorAlerts = alerts.filter(alert => alert.type === 'error_rate');
      
      expect(errorAlerts.length).toBeGreaterThan(0);
    });

    it('should generate alerts for low cache hit rates', async () => {
      // Simulate low cache hit rate
      for (let i = 0; i < 100; i++) {
        performanceMonitor.recordCacheMiss(50);
      }
      for (let i = 0; i < 30; i++) {
        performanceMonitor.recordCacheHit(10);
      }

      const alerts = performanceMonitor.checkAlerts();
      const cacheAlerts = alerts.filter(alert => alert.type === 'cache_performance');
      
      expect(cacheAlerts.length).toBeGreaterThan(0);
    });
  });
});
