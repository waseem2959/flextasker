/**
 * Performance Profiler Middleware
 * 
 * This middleware provides detailed performance profiling for API requests,
 * helping identify performance bottlenecks and optimization opportunities.
 * It tracks request performance metrics and provides timing information for
 * requests, database queries, and cache operations.
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from '@/utils/logger';

/**
 * Interface for performance entry
 */
interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  attributes?: Record<string, any>;
}

/**
 * Interface for request performance data
 */
interface RequestPerformanceData {
  requestId: string;
  path: string;
  method: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  segments: Record<string, PerformanceEntry>;
  dbQueries: PerformanceEntry[];
  cacheOperations: PerformanceEntry[];
}

// Map to store active request performance data
const activeRequests = new Map<string, RequestPerformanceData>();

// Configuration for profiling thresholds
const SLOW_REQUEST_THRESHOLD_MS = 500; // Requests taking longer than this will be logged
const VERY_SLOW_REQUEST_THRESHOLD_MS = 2000; // Requests taking longer than this will be logged with warning level

/**
 * Extend Express Request interface to include profiling properties
 */
declare global {
  namespace Express {
    interface Request {
      profiling: {
        requestId: string;
        startTime: number;
        checkpoints: Array<{
          name: string;
          time: number;
          sinceStart: number;
          sinceLastCheckpoint: number;
        }>;
        checkpoint: (name: string) => number;
      }
    }
  }
}

/**
 * Middleware that provides detailed performance profiling for requests
 * 
 * This middleware:
 * 1. Starts timing when a request begins
 * 2. Sets up response hooks to capture when the request ends
 * 3. Logs performance data based on configurable thresholds
 * 4. Provides methods for adding checkpoints during request processing
 */
export function performanceProfiler(req: Request, res: Response, next: NextFunction): void {
  // Skip profiling for static assets to reduce noise
  if (req.path.startsWith('/static') || req.path.startsWith('/assets')) {
    return next();
  }
  
  // Get or generate request ID
  const requestId = req.context?.requestId || req.headers['x-request-id'] as string || 'unknown';
  
  // Record start time
  const startTime = performance.now();
  
  // Initialize profiling data on request object
  req.profiling = {
    requestId,
    startTime,
    checkpoints: [],
    
    // Add a checkpoint method to the request object for easy profiling
    checkpoint: (name: string) => {
      const now = performance.now();
      const sinceStart = now - startTime;
      const lastCheckpoint = req.profiling.checkpoints[req.profiling.checkpoints.length - 1];
      const sinceLastCheckpoint = lastCheckpoint ? now - lastCheckpoint.time : sinceStart;
      
      const checkpoint = {
        name,
        time: now,
        sinceStart,
        sinceLastCheckpoint
      };
      
      req.profiling.checkpoints.push(checkpoint);
      
      // Log checkpoint if it took a significant amount of time
      if (sinceLastCheckpoint > SLOW_REQUEST_THRESHOLD_MS) {
        logger.debug(`Slow checkpoint [${name}]: ${Math.round(sinceLastCheckpoint)}ms`, {
          requestId,
          path: req.path,
          method: req.method,
          checkpoint: name,
          duration: Math.round(sinceLastCheckpoint)
        });
      }
      
      return sinceLastCheckpoint;
    }
  };
  
  // Initialize performance data for this request
  activeRequests.set(requestId, {
    requestId,
    path: req.path,
    method: req.method,
    startTime: Date.now(),
    segments: {},
    dbQueries: [],
    cacheOperations: []
  });
  
  // Add response finished listener to capture total request time
  res.on('finish', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update the performance data with end time and duration
    const perfData = activeRequests.get(requestId);
    if (perfData) {
      perfData.endTime = Date.now();
      perfData.totalDuration = duration;
      
      // Log slow requests
      if (duration > VERY_SLOW_REQUEST_THRESHOLD_MS) {
        logger.warn(`Very slow request: ${req.method} ${req.path} - ${Math.round(duration)}ms`, {
          requestId,
          path: req.path,
          method: req.method,
          duration: Math.round(duration),
          checkpoints: req.profiling.checkpoints
        });
      } else if (duration > SLOW_REQUEST_THRESHOLD_MS) {
        logger.info(`Slow request: ${req.method} ${req.path} - ${Math.round(duration)}ms`, {
          requestId,
          path: req.path,
          method: req.method,
          duration: Math.round(duration)
        });
      } else if (process.env.NODE_ENV !== 'production') {
        // In non-production, log all request times for debugging
        logger.debug(`Request completed: ${req.method} ${req.path} - ${Math.round(duration)}ms`, {
          requestId,
          path: req.path,
          method: req.method,
          duration: Math.round(duration)
        });
      }
      
      // Clean up after logging
      activeRequests.delete(requestId);
    }
  });
  
  // Continue to next middleware
  next();
}

/**
 * Measure a database query's performance
 * 
 * @param name Query name or identifier
 * @param fn Function to execute (the database query)
 * @returns Result of the function
 */
export async function measureDbQuery<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    
    // Log slow database queries
    if (duration > SLOW_REQUEST_THRESHOLD_MS) {
      logger.info(`Slow DB query [${name}]: ${Math.round(duration)}ms`, {
        queryName: name,
        duration: Math.round(duration)
      });
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
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    
    // Log slow cache operations
    if (duration > 100) { // Cache operations should be very fast
      logger.info(`Slow cache operation [${name}]: ${Math.round(duration)}ms`, {
        operationName: name,
        duration: Math.round(duration)
      });
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
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    
    // Log slow external API calls
    if (duration > SLOW_REQUEST_THRESHOLD_MS) {
      logger.info(`Slow external call [${name}]: ${Math.round(duration)}ms`, {
        apiName: name,
        duration: Math.round(duration)
      });
    }
  }
}

/**
 * Initialize performance monitoring system
 * This is a compatibility function for existing code
 */
export function initializePerformanceMonitoring(): void {
  logger.info('Performance monitoring initialized');
}

/**
 * Export functions as an object for backward compatibility with default import usage
 */
export default {
  performanceProfiler,
  measureDbQuery,
  measureCacheOperation,
  measureExternalCall,
  initializePerformanceMonitoring
};
