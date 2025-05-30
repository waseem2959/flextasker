/**
 * Unified Metrics Service
 * 
 * This module provides a centralized service for all metrics tracking in the application.
 * It eliminates duplication by consolidating tracking logic for HTTP, WebSocket, and other events.
 */

import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { logger } from '../logger';

// In-memory metrics store
interface MetricStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdated: number;
}

interface MetricsStore {
  httpRequests: Record<string, MetricStats>;
  wsEvents: Record<string, Omit<MetricStats, 'min' | 'max' | 'sum'>>;
  errors: Record<string, { count: number; lastError?: string }>;
}

export const inMemoryMetrics: MetricsStore = {
  httpRequests: {},
  wsEvents: {},
  errors: {}
};

// Constants for service names
export const SERVICES = {
  BID: 'bid',
  CHAT: 'chat',
  NOTIFICATION: 'notification',
  REVIEW: 'review',
  TASK: 'task',
  USER: 'user',
  SYSTEM: 'system'
};

// Counters for Prometheus (initialized lazily)
let httpRequestsCounter: any;
let wsEventsCounter: any;
let errorsCounter: any;
let responseTimeHistogram: any;

// Initialize Prometheus metrics (if available)
try {
  const prometheusClient = require('prom-client');
  if (prometheusClient) {
    httpRequestsCounter = new prometheusClient.Counter({
      name: 'flextasker_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service_type', 'service_name']
    });
    
    wsEventsCounter = new prometheusClient.Counter({
      name: 'flextasker_ws_events_total',
      help: 'Total number of WebSocket events',
      labelNames: ['event', 'service_type', 'service_name']
    });
    
    errorsCounter = new prometheusClient.Counter({
      name: 'flextasker_errors_total',
      help: 'Total number of errors',
      labelNames: ['service', 'error_type', 'service_type']
    });
    
    responseTimeHistogram = new prometheusClient.Histogram({
      name: 'flextasker_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: ['method', 'route', 'service_type', 'service_name'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });
  }
} catch (error) {
  logger.warn('Prometheus client not available, using in-memory metrics', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}

/**
 * Determine if a route is for a consolidated service
 */
export const isConsolidatedRoute = (route: string): boolean => {
  return route.includes('/consolidated') || route.includes('/api/v2');
};

/**
 * Extract service name from route
 */
export const extractServiceFromRoute = (route: string): string => {
  const parts = route.split('/');
  
  // Check for consolidated service pattern
  for (const part of parts) {
    if (part === 'bids' || part === 'bid') return SERVICES.BID;
    if (part === 'chat') return SERVICES.CHAT;
    if (part === 'notifications') return SERVICES.NOTIFICATION;
    if (part === 'reviews') return SERVICES.REVIEW;
    if (part === 'tasks') return SERVICES.TASK;
    if (part === 'users') return SERVICES.USER;
  }
  
  return 'unknown';
};

/**
 * Track HTTP API request
 */
export const trackHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  responseTime: number,
  serviceName: string = 'unknown'
): void => {
  const isConsolidated = isConsolidatedRoute(route);
  const serviceType = isConsolidated ? 'consolidated' : 'legacy';
  
  // Track in Prometheus if available
  if (httpRequestsCounter) {
    httpRequestsCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
      service_type: serviceType,
      service_name: serviceName
    });
  }

  if (responseTimeHistogram) {
    responseTimeHistogram.observe(
      {
        method,
        route,
        service_type: serviceType,
        service_name: serviceName
      },
      responseTime / 1000 // Convert to seconds
    );
  }
  
  // Track in memory
  const key = `${method}:${route}:${serviceType}`;
  const now = Date.now();
  
  if (!inMemoryMetrics.httpRequests[key]) {
    inMemoryMetrics.httpRequests[key] = {
      count: 0,
      sum: 0,
      min: responseTime,
      max: responseTime,
      lastUpdated: now
    };
  }
  
  const metric = inMemoryMetrics.httpRequests[key];
  metric.count++;
  metric.sum += responseTime;
  metric.min = Math.min(metric.min, responseTime);
  metric.max = Math.max(metric.max, responseTime);
  metric.lastUpdated = now;
  
  // Log in development for easier debugging
  if (process.env.NODE_ENV !== 'production' || process.env.DETAILED_LOGGING === 'true') {
    logger.debug('API request tracked', {
      method,
      route,
      statusCode,
      responseTime,
      serviceName,
      serviceType
    });
  }
};

/**
 * Track WebSocket event
 */
export const trackWebSocketEvent = (
  event: string,
  isConsolidated: boolean,
  serviceName: string = 'unknown',
  userId?: string
): void => {
  const serviceType = isConsolidated ? 'consolidated' : 'legacy';
  
  // Track in Prometheus if available
  if (wsEventsCounter) {
    wsEventsCounter.inc({
      event,
      service_type: serviceType,
      service_name: serviceName
    });
  }
  
  // Track in memory
  const key = `${serviceName}:${event}:${serviceType}`;
  const now = Date.now();
  
  if (!inMemoryMetrics.wsEvents[key]) {
    inMemoryMetrics.wsEvents[key] = {
      count: 0,
      lastUpdated: now
    };
  }
  
  const metric = inMemoryMetrics.wsEvents[key];
  metric.count++;
  metric.lastUpdated = now;
  
  // Log for real-time analysis if in development or detailed logging is enabled
  if (process.env.NODE_ENV !== 'production' || process.env.DETAILED_LOGGING === 'true') {
    logger.debug('WebSocket event tracked', {
      userId,
      event,
      serviceType,
      serviceName
    });
  }
};

/**
 * Track application error
 */
export const trackError = (
  service: string,
  errorType: string,
  isConsolidated: boolean,
  error?: unknown
): void => {
  const serviceType = isConsolidated ? 'consolidated' : 'legacy';
  const key = `${service}:${errorType}:${serviceType}`;
  /**
   * Extracts a meaningful error message from various error types
   */
  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
      return String(err.message);
    }
    return 'Unknown error';
  };

  const errorMessage = extractErrorMessage(error);
  
  // Track in Prometheus if available
  if (errorsCounter) {
    errorsCounter.inc({
      service,
      error_type: errorType,
      service_type: serviceType
    });
  }
  
  // Track in memory
  if (!inMemoryMetrics.errors[key]) {
    inMemoryMetrics.errors[key] = { count: 0 };
  }
  
  inMemoryMetrics.errors[key].count++;
  inMemoryMetrics.errors[key].lastError = errorMessage;
  
  // Log error for real-time analysis
  logger.error(`Error tracked: ${service} - ${errorType}`, { 
    service, 
    errorType, 
    serviceType,
    error: errorMessage
  });
};

/**
 * Express middleware for tracking HTTP requests
 */
export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Capture original end method to track response
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Extract route information
    const route = req.originalUrl || req.url;
    const method = req.method;
    const statusCode = res.statusCode;
    const serviceName = extractServiceFromRoute(route);
    
    // Track the request
    trackHttpRequest(method, route, statusCode, responseTime, serviceName);
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};

/**
 * Wrapper for socket event handlers with metrics tracking
 */
export const withSocketMetrics = <T extends any[]>(
  event: string,
  handler: (socket: Socket, ...args: T) => void,
  isConsolidated: boolean,
  serviceName: string
) => {
  return (socket: Socket, ...args: T) => {
    const startTime = Date.now();
    
    // Track the event
    try {
      trackWebSocketEvent(event, isConsolidated, serviceName, socket.data?.user?.id);
    } catch (error) {
      // Don't let tracking errors affect functionality
      logger.error('Error tracking WebSocket event', { error });
    }
    
    try {
      // Execute the original handler
      return handler(socket, ...args);
    } catch (error) {
      // Track errors
      trackError(serviceName, 'websocket', isConsolidated, error);
      throw error;
    } finally {
      // Track long-running handlers
      const duration = Date.now() - startTime;
      if (duration > 500) {
        logger.warn(`WebSocket event ${event} took ${duration}ms to process`, {
          serviceName,
          event,
          duration
        });
      }
    }
  };
};

/**
 * Helper to wrap socket emit calls with metrics tracking
 */
export const wrapSocketEmit = (socket: Socket): void => {
  const originalEmit = socket.emit;
  
  socket.emit = function(event: string, ...args: any[]) {
    // Only track non-system events (those not starting with socket.io)
    if (!event.startsWith('socket.io')) {
      try {
        const isConsolidated = event.includes(':') && 
          Object.values(SERVICES).some(service => event.startsWith(`${service}:`));
        
        const serviceName = event.split(':')[0] || 'unknown';
        
        trackWebSocketEvent(`emit:${event}`, isConsolidated, serviceName, socket.data?.user?.id);
      } catch (error) {
        // Don't let tracking errors affect emit functionality
        logger.error('Error tracking socket emit', { error });
      }
    }
    
    // Call the original emit
    return originalEmit.apply(this, [event, ...args]);
  };
};

// Export a unified metrics service
export default {
  SERVICES,
  trackHttpRequest,
  trackWebSocketEvent,
  trackError,
  httpMetricsMiddleware,
  withSocketMetrics,
  wrapSocketEmit,
  isConsolidatedRoute,
  extractServiceFromRoute
};
