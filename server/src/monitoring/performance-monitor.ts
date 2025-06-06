/**
 * Performance Monitoring System
 * 
 * This module provides comprehensive monitoring for application performance,
 * including cache metrics, database performance, API response times, and security events.
 */

import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance metrics collection
 */
interface PerformanceMetrics {
  // Cache metrics
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalRequests: number;
    averageResponseTime: number;
  };
  
  // Database metrics
  database: {
    queryCount: number;
    slowQueries: number;
    averageQueryTime: number;
    connectionPoolSize: number;
    activeConnections: number;
  };
  
  // API metrics
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerMinute: number;
  };
  
  // Security metrics
  security: {
    rateLimitHits: number;
    suspiciousRequests: number;
    authenticationFailures: number;
    csrfAttempts: number;
  };
  
  // System metrics
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    activeUsers: number;
  };
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private startTime: number;
  private requestTimes: number[] = [];
  private queryTimes: number[] = [];
  private activeUsers = new Set<string>();

  private constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    
    // Start periodic metric collection
    this.startPeriodicCollection();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalRequests: 0,
        averageResponseTime: 0
      },
      database: {
        queryCount: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        connectionPoolSize: 0,
        activeConnections: 0
      },
      api: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        requestsPerMinute: 0
      },
      security: {
        rateLimitHits: 0,
        suspiciousRequests: 0,
        authenticationFailures: 0,
        csrfAttempts: 0
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
        activeUsers: 0
      }
    };
  }

  /**
   * Record cache hit
   */
  recordCacheHit(responseTime: number): void {
    this.metrics.cache.hits++;
    this.metrics.cache.totalRequests++;
    this.updateCacheMetrics(responseTime);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(responseTime: number): void {
    this.metrics.cache.misses++;
    this.metrics.cache.totalRequests++;
    this.updateCacheMetrics(responseTime);
  }

  private updateCacheMetrics(responseTime: number): void {
    this.metrics.cache.hitRate = this.metrics.cache.hits / this.metrics.cache.totalRequests;
    
    // Update average response time (simple moving average)
    const currentAvg = this.metrics.cache.averageResponseTime;
    const count = this.metrics.cache.totalRequests;
    this.metrics.cache.averageResponseTime = ((currentAvg * (count - 1)) + responseTime) / count;
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(queryTime: number, isSlowQuery: boolean = false): void {
    this.metrics.database.queryCount++;
    this.queryTimes.push(queryTime);
    
    if (isSlowQuery) {
      this.metrics.database.slowQueries++;
    }
    
    // Keep only last 1000 query times for average calculation
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
    
    this.metrics.database.averageQueryTime = 
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  /**
   * Record API request
   */
  recordApiRequest(responseTime: number, statusCode: number, userId?: string): void {
    this.metrics.api.totalRequests++;
    this.requestTimes.push(responseTime);
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.api.successfulRequests++;
    } else {
      this.metrics.api.failedRequests++;
    }
    
    // Track active users
    if (userId) {
      this.activeUsers.add(userId);
    }
    
    // Keep only last 1000 request times
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }
    
    this.metrics.api.averageResponseTime = 
      this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
  }

  /**
   * Record security event
   */
  recordSecurityEvent(eventType: 'rate_limit' | 'suspicious' | 'auth_failure' | 'csrf'): void {
    switch (eventType) {
      case 'rate_limit':
        this.metrics.security.rateLimitHits++;
        break;
      case 'suspicious':
        this.metrics.security.suspiciousRequests++;
        break;
      case 'auth_failure':
        this.metrics.security.authenticationFailures++;
        break;
      case 'csrf':
        this.metrics.security.csrfAttempts++;
        break;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  /**
   * Get metrics summary for dashboard
   */
  getMetricsSummary(): any {
    const metrics = this.getMetrics();
    
    return {
      performance: {
        cacheHitRate: `${(metrics.cache.hitRate * 100).toFixed(1)}%`,
        averageApiResponseTime: `${metrics.api.averageResponseTime.toFixed(0)}ms`,
        averageDbQueryTime: `${metrics.database.averageQueryTime.toFixed(0)}ms`,
        requestsPerMinute: metrics.api.requestsPerMinute
      },
      health: {
        successRate: `${((metrics.api.successfulRequests / metrics.api.totalRequests) * 100).toFixed(1)}%`,
        slowQueries: metrics.database.slowQueries,
        activeUsers: metrics.system.activeUsers,
        uptime: this.formatUptime(metrics.system.uptime)
      },
      security: {
        rateLimitHits: metrics.security.rateLimitHits,
        suspiciousRequests: metrics.security.suspiciousRequests,
        authFailures: metrics.security.authenticationFailures
      }
    };
  }

  /**
   * Check for performance alerts
   */
  checkAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts = [];
    const metrics = this.getMetrics();

    // Cache hit rate alert
    if (metrics.cache.hitRate < 0.7 && metrics.cache.totalRequests > 100) {
      alerts.push({
        type: 'cache_performance',
        message: `Low cache hit rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`,
        severity: 'medium' as const
      });
    }

    // Slow query alert
    if (metrics.database.averageQueryTime > 1000) {
      alerts.push({
        type: 'database_performance',
        message: `High average query time: ${metrics.database.averageQueryTime.toFixed(0)}ms`,
        severity: 'high' as const
      });
    }

    // API response time alert
    if (metrics.api.averageResponseTime > 2000) {
      alerts.push({
        type: 'api_performance',
        message: `High API response time: ${metrics.api.averageResponseTime.toFixed(0)}ms`,
        severity: 'high' as const
      });
    }

    // Error rate alert
    const errorRate = metrics.api.failedRequests / metrics.api.totalRequests;
    if (errorRate > 0.05 && metrics.api.totalRequests > 50) {
      alerts.push({
        type: 'error_rate',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        severity: 'high' as const
      });
    }

    // Security alerts
    if (metrics.security.suspiciousRequests > 10) {
      alerts.push({
        type: 'security',
        message: `High number of suspicious requests: ${metrics.security.suspiciousRequests}`,
        severity: 'medium' as const
      });
    }

    return alerts;
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.requestTimes = [];
    this.queryTimes = [];
    this.activeUsers.clear();
    logger.info('Performance metrics reset');
  }

  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
    this.metrics.system.uptime = Date.now() - this.startTime;
    this.metrics.system.activeUsers = this.activeUsers.size;
    
    // Calculate requests per minute
    const uptimeMinutes = this.metrics.system.uptime / (1000 * 60);
    this.metrics.api.requestsPerMinute = uptimeMinutes > 0 ? 
      this.metrics.api.totalRequests / uptimeMinutes : 0;
  }

  private formatUptime(uptime: number): string {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private startPeriodicCollection(): void {
    // Log metrics every 5 minutes
    setInterval(() => {
      const summary = this.getMetricsSummary();
      logger.info('Performance metrics summary', summary);
      
      // Check for alerts
      const alerts = this.checkAlerts();
      if (alerts.length > 0) {
        logger.warn('Performance alerts detected', { alerts });
      }
      
      // Clean up old active users (remove users inactive for 30 minutes)
      // In a real implementation, you'd track last activity time
      if (this.activeUsers.size > 1000) {
        this.activeUsers.clear();
      }
    }, 5 * 60 * 1000);

    // Reset daily metrics at midnight
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.resetMetrics();
      }
    }, 60 * 1000);
  }
}

/**
 * Express middleware for automatic performance monitoring
 */
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.getInstance();
  
  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function(this: Response, ...args: any[]) {
    const responseTime = Date.now() - startTime;
    const userId = req.user?.id;

    // Record API request metrics
    monitor.recordApiRequest(responseTime, res.statusCode, userId);

    // Check for cache headers to record cache metrics
    const cacheHeader = res.getHeader('X-Cache');
    if (cacheHeader === 'HIT') {
      monitor.recordCacheHit(responseTime);
    } else if (cacheHeader === 'MISS') {
      monitor.recordCacheMiss(responseTime);
    }

    // Call original end method
    return originalEnd(...args);
  };
  
  next();
}

export default PerformanceMonitor;
