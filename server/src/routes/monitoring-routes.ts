/**
 * Monitoring Routes
 *
 * These routes provide access to application monitoring data including
 * performance metrics, health checks, and system status information.
 */

import { Request, Response, Router } from 'express';
import { query } from 'express-validator';
import { UserRole } from '../../../shared/types/enums';
import { authenticateToken, requireRoles } from '../middleware/auth-middleware';
import { cacheUtils } from '../middleware/cache-middleware';
import { validate } from '../middleware/validation-middleware';
import PerformanceMonitor from '../monitoring/performance-monitor';
import { QueryPerformanceMonitor } from '../utils/database-optimization';
import { logger } from '../utils/logger';
import { checkRedisHealth } from '../utils/redis-client';

const router = Router();

/**
 * Health Check Endpoint
 * GET /api/v1/monitoring/health
 * Public endpoint for basic health checking
 */
router.get('/health', (_req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json({
    success: true,
    data: healthStatus
  });
});

/**
 * Detailed Health Check
 * GET /api/v1/monitoring/health/detailed
 * Admin-only endpoint for comprehensive health information
 */
router.get('/health/detailed',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  async (_req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const alerts = monitor.checkAlerts();

    // Check Redis health
    const redisHealth = await checkRedisHealth();

    // Check cache availability
    const cacheAvailable = await cacheUtils.isRedisAvailable();

    const detailedHealth = {
      status: alerts.some(alert => alert.severity === 'high') ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      alerts: alerts,
      services: {
        database: 'healthy', // In production, check actual DB connection
        cache: cacheAvailable ? 'healthy' : 'degraded',
        redis: redisHealth.healthy ? 'healthy' : 'unhealthy',
        websockets: 'healthy'
      },
      redis: {
        connected: redisHealth.healthy,
        latency: redisHealth.latency,
        error: redisHealth.error
      }
    };

    res.status(200).json({
      success: true,
      data: detailedHealth
    });
  }
);

/**
 * Performance Metrics Dashboard
 * GET /api/v1/monitoring/metrics
 * Admin-only endpoint for performance metrics
 */
router.get('/metrics',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  validate([
    query('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period')
  ]),
  async (req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const period = req.query.period as string || '1h';

    const metrics = monitor.getMetrics();
    const summary = monitor.getMetricsSummary();
    const alerts = monitor.checkAlerts();

    // Get cache statistics
    const cacheStats = await cacheUtils.getStats();

    // Get database query statistics
    const queryMonitor = QueryPerformanceMonitor.getInstance();
    const queryStats = queryMonitor.getStats();

    const response = {
      period,
      timestamp: new Date().toISOString(),
      summary,
      detailed: {
        ...metrics,
        cache: {
          ...metrics.cache,
          stats: cacheStats
        },
        database: {
          ...metrics.database,
          queryStats
        }
      },
      alerts
    };

    logger.info('Metrics dashboard accessed', {
      adminId: req.user?.id,
      period,
      alertCount: alerts.length
    });

    res.status(200).json({
      success: true,
      data: response
    });
  }
);

/**
 * Performance Alerts
 * GET /api/v1/monitoring/alerts
 * Admin-only endpoint for current alerts
 */
router.get('/alerts',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  validate([
    query('severity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid severity level')
  ]),
  (req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const severityFilter = req.query.severity as string;

    let alerts = monitor.checkAlerts();

    if (severityFilter) {
      alerts = alerts.filter(alert => alert.severity === severityFilter);
    }

    res.status(200).json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * Cache Statistics
 * GET /api/v1/monitoring/cache
 * Admin-only endpoint for cache performance data
 */
router.get('/cache',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  async (_req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const cacheStats = await cacheUtils.getStats();
    const cacheMetrics = monitor.getMetrics().cache;

    const response = {
      statistics: cacheStats,
      performance: cacheMetrics,
      recommendations: [] as Array<{
        type: string;
        message: string;
        priority: string;
      }>
    };

    // Add recommendations based on cache performance
    if (cacheMetrics.hitRate < 0.7 && cacheMetrics.totalRequests > 100) {
      response.recommendations.push({
        type: 'hit_rate',
        message: 'Consider increasing cache TTL or reviewing cache strategy',
        priority: 'medium'
      });
    }

    if (cacheMetrics.averageResponseTime > 100) {
      response.recommendations.push({
        type: 'response_time',
        message: 'Cache response time is high, consider optimizing cache storage',
        priority: 'low'
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  }
);

/**
 * Database Performance
 * GET /api/v1/monitoring/database
 * Admin-only endpoint for database performance data
 */
router.get('/database',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  async (_req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const queryMonitor = QueryPerformanceMonitor.getInstance();

    const dbMetrics = monitor.getMetrics().database;
    const queryStats = queryMonitor.getStats();

    // Get enhanced database health stats (if available)
    let enhancedStats = null;
    try {
      // Import dynamically to avoid circular dependencies
      // Enhanced database service not available
    } catch (error) {
      logger.debug('Enhanced database service not available', { error });
    }

    // Identify slow queries
    const slowQueries = Object.entries(queryStats)
      .filter(([_, stats]) => stats.avgTime > 1000)
      .map(([queryName, stats]) => ({
        queryName,
        averageTime: Math.round(stats.avgTime),
        count: stats.count,
        totalTime: Math.round(stats.totalTime)
      }))
      .sort((a, b) => b.averageTime - a.averageTime);

    const response = {
      metrics: dbMetrics,
      queryStatistics: queryStats,
      slowQueries,
      enhanced: enhancedStats,
      recommendations: [] as Array<{
        type: string;
        message: string;
        priority: string;
        queries?: any[];
      }>
    };

    // Add recommendations
    if (slowQueries.length > 0) {
      response.recommendations.push({
        type: 'slow_queries',
        message: `${slowQueries.length} slow queries detected. Consider optimization.`,
        priority: 'high',
        queries: slowQueries.slice(0, 5) // Top 5 slowest
      });
    }

    if (dbMetrics.averageQueryTime > 500) {
      response.recommendations.push({
        type: 'average_time',
        message: 'Overall query performance is below optimal. Review indexing strategy.',
        priority: 'medium'
      });
    }

    // Add read replica recommendations
    if ((enhancedStats as any)?.connections?.stats) {
      const readQueries = (enhancedStats as any).connections.stats.queries.read;
      const writeQueries = (enhancedStats as any).connections.stats.queries.write;
      const readWriteRatio = readQueries / (writeQueries || 1);

      if (readWriteRatio < 2) {
        response.recommendations.push({
          type: 'read_replicas',
          message: 'Consider implementing read replicas to improve performance',
          priority: 'medium'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: response
    });
  }
);

/**
 * Connection Pool Monitoring
 * GET /api/v1/monitoring/connection-pool
 * Admin-only endpoint for database connection pool metrics
 */
router.get('/connection-pool',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  async (_req: Request, res: Response) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { connectionPoolMonitor } = await import('../utils/connection-pool-monitor');

      const currentMetrics = connectionPoolMonitor.getCurrentMetrics();
      const performanceStats = connectionPoolMonitor.getPerformanceStats();
      const poolHealth = connectionPoolMonitor.checkPoolHealth();
      const pgBouncerConfig = connectionPoolMonitor.getPgBouncerConfig();

      const response = {
        current: currentMetrics,
        performance: performanceStats,
        health: poolHealth,
        configuration: {
          recommended: pgBouncerConfig,
          pgBouncerConfig: connectionPoolMonitor.generatePgBouncerConfig()
        },
        recommendations: performanceStats.recommendations
      };

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Failed to get connection pool metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve connection pool metrics'
      });
    }
  }
);

/**
 * Security Metrics
 * GET /api/v1/monitoring/security
 * Admin-only endpoint for security-related metrics
 */
router.get('/security',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  (_req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const securityMetrics = monitor.getMetrics().security;

    const response = {
      metrics: securityMetrics,
      riskLevel: 'low', // Default
      recommendations: [] as Array<{
        type: string;
        message: string;
        priority: string;
      }>
    };

    // Assess risk level
    const totalSecurityEvents = Object.values(securityMetrics).reduce((sum, count) => sum + count, 0);
    if (totalSecurityEvents > 100) {
      response.riskLevel = 'high';
      response.recommendations.push({
        type: 'high_security_events',
        message: 'High number of security events detected. Review security logs.',
        priority: 'high'
      });
    } else if (totalSecurityEvents > 50) {
      response.riskLevel = 'medium';
    }

    // Specific recommendations
    if (securityMetrics.authenticationFailures > 20) {
      response.recommendations.push({
        type: 'auth_failures',
        message: 'High number of authentication failures. Consider implementing account lockout.',
        priority: 'medium'
      });
    }

    if (securityMetrics.suspiciousRequests > 10) {
      response.recommendations.push({
        type: 'suspicious_activity',
        message: 'Suspicious request patterns detected. Review access logs.',
        priority: 'medium'
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  }
);

/**
 * Reset Metrics (for testing/maintenance)
 * POST /api/v1/monitoring/reset
 * Admin-only endpoint to reset performance metrics
 */
router.post('/reset',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const monitor = PerformanceMonitor.getInstance();
    const queryMonitor = QueryPerformanceMonitor.getInstance();

    monitor.resetMetrics();
    queryMonitor.resetStats();
    await cacheUtils.clearAll();

    logger.info('Monitoring metrics reset', { adminId: req.user?.id });

    res.status(200).json({
      success: true,
      message: 'All monitoring metrics have been reset'
    });
  }
);

export default router;
