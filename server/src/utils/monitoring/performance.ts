/**
 * Performance Monitoring Utility
 * 
 * This module provides performance monitoring capabilities for the application,
 * tracking response times, database queries, and resource usage.
 */

import { logger } from '../logger';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

// Store performance metrics
interface PerformanceMetrics {
  responseTime: Record<string, number[]>;
  databaseQueries: Record<string, number[]>;
  memoryUsage: Record<string, number[]>;
  requestCount: Record<string, number>;
  errorCount: Record<string, number>;
}

// Initialize metrics storage
const metrics: PerformanceMetrics = {
  responseTime: {},
  databaseQueries: {},
  memoryUsage: {},
  requestCount: {},
  errorCount: {}
};

// Current time window for metrics aggregation (5-minute intervals)
const METRICS_WINDOW_MS = 5 * 60 * 1000;
let currentWindow = Math.floor(Date.now() / METRICS_WINDOW_MS);

/**
 * Records response time for an API endpoint
 * @param path The API endpoint path
 * @param duration Time in milliseconds
 */
export function recordResponseTime(path: string, duration: number): void {
  const window = Math.floor(Date.now() / METRICS_WINDOW_MS);
  
  // Reset metrics if we've moved to a new time window
  if (window !== currentWindow) {
    resetMetrics();
    currentWindow = window;
  }
  
  if (!metrics.responseTime[path]) {
    metrics.responseTime[path] = [];
  }
  
  metrics.responseTime[path].push(duration);
  
  // Log slow responses (over 1000ms)
  if (duration > 1000) {
    logger.warn('Slow API response detected', {
      path,
      duration,
      threshold: 1000
    });
  }
}

/**
 * Records database query execution time
 * @param operation The database operation (e.g., 'findMany', 'create')
 * @param duration Time in milliseconds
 */
export function recordDatabaseQuery(operation: string, duration: number): void {
  if (!metrics.databaseQueries[operation]) {
    metrics.databaseQueries[operation] = [];
  }
  
  metrics.databaseQueries[operation].push(duration);
  
  // Log slow queries (over 500ms)
  if (duration > 500) {
    logger.warn('Slow database query detected', {
      operation,
      duration,
      threshold: 500
    });
  }
}

/**
 * Records memory usage at a specific point
 * @param label Label for the memory measurement
 */
export function recordMemoryUsage(label: string = 'general'): void {
  const memoryUsage = process.memoryUsage();
  
  if (!metrics.memoryUsage[label]) {
    metrics.memoryUsage[label] = [];
  }
  
  // Record heap used in MB
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
  metrics.memoryUsage[label].push(heapUsedMB);
  
  // Log high memory usage (over 500MB)
  if (heapUsedMB > 500) {
    logger.warn('High memory usage detected', {
      label,
      heapUsedMB,
      threshold: 500
    });
  }
}

/**
 * Records a request to an endpoint
 * @param path The API endpoint path
 */
export function recordRequest(path: string): void {
  metrics.requestCount[path] = (metrics.requestCount[path] || 0) + 1;
}

/**
 * Records an error for an endpoint
 * @param path The API endpoint path
 */
export function recordError(path: string): void {
  metrics.errorCount[path] = (metrics.errorCount[path] || 0) + 1;
}

/**
 * Resets all metrics
 */
function resetMetrics(): void {
  // Log a snapshot of the current metrics before resetting
  logMetricsSnapshot();
  
  // Reset metrics
  Object.keys(metrics).forEach((key) => {
    metrics[key as keyof PerformanceMetrics] = {} as any;
  });
}

/**
 * Logs a snapshot of the current metrics
 */
function logMetricsSnapshot(): void {
  // Calculate averages for time-based metrics
  const responseTimeAverages: Record<string, number> = {};
  Object.entries(metrics.responseTime).forEach(([path, times]) => {
    if (times.length > 0) {
      responseTimeAverages[path] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  });
  
  const databaseQueryAverages: Record<string, number> = {};
  Object.entries(metrics.databaseQueries).forEach(([operation, times]) => {
    if (times.length > 0) {
      databaseQueryAverages[operation] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  });
  
  const memoryUsageAverages: Record<string, number> = {};
  Object.entries(metrics.memoryUsage).forEach(([label, usages]) => {
    if (usages.length > 0) {
      memoryUsageAverages[label] = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;
    }
  });
  
  // Log the metrics snapshot
  logger.info('Performance metrics snapshot', {
    timeWindow: new Date(currentWindow * METRICS_WINDOW_MS).toISOString(),
    responseTimeAverages,
    databaseQueryAverages,
    memoryUsageAverages,
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    errorRate: calculateErrorRates()
  });
}

/**
 * Calculates error rates for each endpoint
 */
function calculateErrorRates(): Record<string, number> {
  const errorRates: Record<string, number> = {};
  
  Object.entries(metrics.requestCount).forEach(([path, count]) => {
    const errors = metrics.errorCount[path] || 0;
    errorRates[path] = count > 0 ? (errors / count) * 100 : 0;
  });
  
  return errorRates;
}

/**
 * Express middleware to track request performance
 */
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Record the start time
  const startTime = performance.now();
  
  // Record the request
  const path = req.originalUrl.split('?')[0]; // Remove query parameters
  recordRequest(path);
  
  // Record memory at the start of the request
  recordMemoryUsage(`request:${path}`);
  
  // Handle response
  const originalEnd = res.end.bind(res);
  
  // Override the end method to track response time
  res.end = ((...args: any[]) => {
    // Calculate response time
    const duration = performance.now() - startTime;
    
    // Record response time
    recordResponseTime(path, duration);
    
    // Record error if status code is 4xx or 5xx
    if (res.statusCode >= 400) {
      recordError(path);
    }
    
    // Record memory at the end of the request
    recordMemoryUsage(`response:${path}`);
    
    // Add X-Response-Time header
    res.setHeader('X-Response-Time', `${Math.round(duration)}ms`);
    
    // Call original end function
    return originalEnd(...args);
  }) as typeof res.end;
  
  next();
}

// Periodically log metrics (every 5 minutes)
setInterval(() => {
  logMetricsSnapshot();
}, METRICS_WINDOW_MS);
