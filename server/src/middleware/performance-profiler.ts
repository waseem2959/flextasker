/**
 * Performance Profiling Middleware
 * 
 * This middleware tracks request performance metrics and provides
 * timing information for requests, database queries, and other operations.
 */

import { Request, Response, NextFunction } from 'express';
import { performance, PerformanceObserver } from 'perf_hooks';
import { getRequestContext } from './request-context';
import { logger } from '../utils/logger';

// Interface for performance entry
interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  attributes?: Record<string, any>;
}

// Interface for request performance data
interface RequestPerformance {
  requestId: string;
  path: string;
  method: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  segments: Record<string, PerformanceEntry>;
  dbQueries: PerformanceEntry[];
  cacheOperations: PerformanceEntry[];
  externalCalls: PerformanceEntry[];
}

// Map to store active request performance data
const activeRequests = new Map<string, RequestPerformance>();

// Store performance metrics
const metrics = new Map<string, { count: number, totalDuration: number, maxDuration: number }>();

/**
 * Initialize performance monitoring system
 */
export function initializePerformanceMonitoring(): void {
  logger.info('Performance monitoring initialized');
  
  // Reset counters and metrics
  metrics.clear();
  activeRequests.clear();
  
  // Start periodic reporting if in development mode
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const currentMetrics = getMetricsSummary();
      if (Object.keys(currentMetrics).length > 0) {
        logger.debug('Performance metrics', { metrics: currentMetrics });
      }
    }, 60000); // Log every minute
  }
}

/**
 * Get a summary of current performance metrics
 */
function getMetricsSummary(): Record<string, { count: number, avgDuration: number, maxDuration: number }> {
  const summary: Record<string, { count: number, avgDuration: number, maxDuration: number }> = {};
  
  metrics.forEach((data, key) => {
    summary[key] = {
      count: data.count,
      avgDuration: data.totalDuration / data.count,
      maxDuration: data.maxDuration
    };
  });
  
  return summary;
}

// Set up performance observer
const obs = new PerformanceObserver((items) => {
  const entries = items.getEntries();
  
  for (const entry of entries) {
    const context = getRequestContext();
    
    if (!context?.requestId) continue;
    
    const requestData = activeRequests.get(context.requestId);
    if (!requestData) continue;
    
    if (entry.name.startsWith('db:')) {
      requestData.dbQueries.push({
        name: entry.name.substring(3),
        startTime: entry.startTime,
        duration: entry.duration
      });
    } else if (entry.name.startsWith('cache:')) {
      requestData.cacheOperations.push({
        name: entry.name.substring(6),
        startTime: entry.startTime,
        duration: entry.duration
      });
    } else if (entry.name.startsWith('external:')) {
      requestData.externalCalls.push({
        name: entry.name.substring(9),
        startTime: entry.startTime,
        duration: entry.duration
      });
    } else if (entry.name.startsWith('segment:')) {
      const segmentName = entry.name.substring(8);
      requestData.segments[segmentName] = {
        name: segmentName,
        startTime: entry.startTime,
        duration: entry.duration
      };
    }
  }
});

// Start observing performance entries
obs.observe({ entryTypes: ['measure'] });

/**
 * Create a performance profiler middleware
 */
export function performanceProfiler(options: {
  slowRequestThreshold?: number; // in milliseconds
  logAllRequests?: boolean;
  excludePaths?: string[];
} = {}) {
  const {
    slowRequestThreshold = 500,
    logAllRequests = false,
    excludePaths = ['/health', '/metrics', '/api/health', '/api/docs']
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    const context = getRequestContext();
    if (!context?.requestId) {
      return next();
    }
    
    // Initialize performance tracking for this request
    const requestId = context.requestId;
    const startTime = performance.now();
    
    // Create request performance entry
    const requestPerf: RequestPerformance = {
      requestId,
      path: req.path,
      method: req.method,
      startTime,
      segments: {},
      dbQueries: [],
      cacheOperations: [],
      externalCalls: []
    };
    
    activeRequests.set(requestId, requestPerf);
    
    // Add response hook to finalize timing
    res.on('finish', () => {
      const endTime = performance.now();
      const requestData = activeRequests.get(requestId);
      
      if (requestData) {
        requestData.endTime = endTime;
        requestData.totalDuration = endTime - requestData.startTime;
        
        // Log slow requests or all requests if enabled
        const isSlow = requestData.totalDuration > slowRequestThreshold;
        
        if (isSlow || logAllRequests) {
          const level = isSlow ? 'warn' : 'info';
          
          logger[level]('Request performance', {
            requestId,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration: Math.round(requestData.totalDuration),
            dbQueries: requestData.dbQueries.length,
            dbTime: Math.round(
              requestData.dbQueries.reduce((sum, query) => sum + query.duration, 0)
            ),
            cacheOperations: requestData.cacheOperations.length,
            cacheTime: Math.round(
              requestData.cacheOperations.reduce((sum, op) => sum + op.duration, 0)
            ),
            externalCalls: requestData.externalCalls.length,
            externalTime: Math.round(
              requestData.externalCalls.reduce((sum, call) => sum + call.duration, 0)
            ),
            segments: Object.keys(requestData.segments).map(key => ({
              name: key,
              duration: Math.round(requestData.segments[key].duration)
            }))
          });
        }
        
        // Clean up
        activeRequests.delete(requestId);
      }
    });
    
    next();
  };
}

/**
 * Start measuring a performance segment
 * 
 * @param name Segment name
 */
export function startSegment(name: string): void {
  performance.mark(`segment:${name}:start`);
}

/**
 * End measuring a performance segment
 * 
 * @param name Segment name
 */
export function endSegment(name: string): void {
  const markName = `segment:${name}:start`;
  const measureName = `segment:${name}`;
  
  if (performance.nodeTiming) {
    performance.mark(`segment:${name}:end`);
    performance.measure(measureName, markName, `segment:${name}:end`);
  }
}

/**
 * Measure a database query's performance
 * 
 * @param name Query name or identifier
 * @param fn Function to execute (the database query)
 * @returns Result of the function
 */
export async function measureDbQuery<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const markName = `db:${name}:start`;
  const measureName = `db:${name}`;
  
  performance.mark(markName);
  
  try {
    const result = await fn();
    return result;
  } finally {
    if (performance.nodeTiming) {
      performance.mark(`db:${name}:end`);
      performance.measure(measureName, markName, `db:${name}:end`);
    }
  }
}

/**
 * Measure a cache operation's performance
 * 
 * @param name Operation name
 * @param fn Function to execute (the cache operation)
 * @returns Result of the function
 */
export async function measureCacheOperation<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const markName = `cache:${name}:start`;
  const measureName = `cache:${name}`;
  
  performance.mark(markName);
  
  try {
    const result = await fn();
    return result;
  } finally {
    if (performance.nodeTiming) {
      performance.mark(`cache:${name}:end`);
      performance.measure(measureName, markName, `cache:${name}:end`);
    }
  }
}

/**
 * Measure an external API call's performance
 * 
 * @param name External API name
 * @param fn Function to execute (the external call)
 * @returns Result of the function
 */
export async function measureExternalCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const markName = `external:${name}:start`;
  const measureName = `external:${name}`;
  
  performance.mark(markName);
  
  try {
    const result = await fn();
    return result;
  } finally {
    if (performance.nodeTiming) {
      performance.mark(`external:${name}:end`);
      performance.measure(measureName, markName, `external:${name}:end`);
    }
  }
}

export default {
  performanceProfiler,
  startSegment,
  endSegment,
  measureDbQuery,
  measureCacheOperation,
  measureExternalCall,
  initializePerformanceMonitoring
};
