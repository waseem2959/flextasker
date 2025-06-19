/**
 * Metrics Middleware
 * 
 * This middleware collects performance metrics for each request,
 * allowing for monitoring and analysis of API performance.
 * Uses the centralized metrics service for consistent tracking.
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import metricsService from '../utils/monitoring/metrics-service';

// Extend the Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      metricsStartTime?: number;
    }
  }
}

/**
 * Middleware that tracks request performance metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip metrics for health checks and metrics endpoints
  if (req.path === '/health' || req.path === '/metrics') {
    return next();
  }

  // Record start time
  const startTime = performance.now();
  const requestPath = req.path;
  const method = req.method;
  
  // Store start time on request for use in response handling
  req.metricsStartTime = startTime;
  
  // Track response size
  let responseSize = 0;
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  // Override write to track response size
  res.write = function(chunk: any): boolean {
    responseSize += chunk?.length ?? 0;
    return originalWrite.apply(res, arguments as any);
  };
  
  // Override end to track response size and finalize metrics
  res.end = function(chunk?: any): Response {
    if (chunk) {
      responseSize += chunk?.length ?? 0;
    }
    
    // Get response result when request completes
    res.on('finish', () => {
      // Calculate duration in milliseconds
      const duration = performance.now() - startTime;
      
      // Track HTTP request using metrics service
      metricsService.trackHttpRequest(
        method,
        requestPath,
        res.statusCode,
        duration
      );
    });
    
    return originalEnd.apply(res, arguments as any);
  };
  
  next();
}

/**
 * Get a middleware that tracks metrics for a specific endpoint
 * Useful for tracking named operations
 * 
 * @param endpointName - The name to use for this endpoint in metrics
 * @returns Middleware function
 */
export function getEndpointMetricsMiddleware(endpointName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip metrics for health checks and metrics endpoints
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }

    // Record start time
    const startTime = performance.now();
    
    // Track response size
    let responseSize = 0;
    const originalWrite = res.write;
    const originalEnd = res.end;
    
    // Override write to track response size
    res.write = function(chunk: any): boolean {
      responseSize += chunk?.length ?? 0;
      return originalWrite.apply(res, arguments as any);
    };
    
    // Override end to track response size and finalize metrics
    res.end = function(chunk?: any): Response {
      if (chunk) {
        responseSize += chunk?.length ?? 0;
      }
      
      // Get response result when request completes
      res.on('finish', () => {
        // Calculate duration in milliseconds
        const duration = performance.now() - startTime;
        
        // Track HTTP request using metrics service with custom endpoint name
        metricsService.trackHttpRequest(
          req.method,
          endpointName,
          res.statusCode,
          duration
        );
      });
      
      return originalEnd.apply(res, arguments as any);
    };
    
    next();
  };
}
