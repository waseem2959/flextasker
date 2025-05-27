/**
 * Monitoring Utilities
 * 
 * This module provides functions for tracking application performance,
 * monitoring errors, and sending metrics to external monitoring services.
 */

import { logger } from './logger';

// Performance measurement
interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Store active performance measurements
const activeMetrics = new Map<string, PerformanceMetric>();

/**
 * Start measuring performance for an operation
 */
export function startMeasurement(name: string, metadata?: Record<string, any>): string {
  const id = `${name}:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
  
  activeMetrics.set(id, {
    name,
    startTime: performance.now(),
    metadata
  });
  
  return id;
}

/**
 * End performance measurement and log results
 */
export function endMeasurement(id: string, additionalMetadata?: Record<string, any>): void {
  const metric = activeMetrics.get(id);
  
  if (!metric) {
    logger.warn('Attempted to end measurement for unknown ID', { id });
    return;
  }
  
  const endTime = performance.now();
  const duration = endTime - metric.startTime;
  
  // Combine metadata
  const metadata = {
    ...metric.metadata,
    ...additionalMetadata
  };
  
  // Log performance metric
  logger.info('Performance measurement', {
    operation: metric.name,
    durationMs: Math.round(duration),
    ...metadata
  });
  
  // Remove from active metrics
  activeMetrics.delete(id);
  
  // Send to monitoring service if duration exceeds threshold
}

/**
 * Monitor an error and send to error tracking service
 * 
 * @param error Error object
 * @param context Additional context information
 */
export function monitorError(error: Error, context: Record<string, any> = {}): void {
  // Convert unknown errors to Error objects
  const err = error instanceof Error ? error : new Error(String(error));
  
  // In a real system, this would send to error tracking service like Sentry
  logger.error('Error occurred', { 
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }, 
    ...context 
  });
  
  // Additional context information we might want to capture
  const errorInfo = {
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    ...context
  };
  
  // Send to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToErrorMonitoringService(error, context);
  }
}

/**
 * Monitor a performance issue
 */
function monitorPerformanceIssue(operation: string, duration: number, metadata?: Record<string, any>): void {
  logger.warn('Performance issue detected', {
    operation,
    durationMs: Math.round(duration),
    ...metadata
  });
  
  // Send to performance monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToPerformanceMonitoringService(operation, duration, metadata);
  }
}

/**
 * Send error to external monitoring service (e.g., Sentry, Datadog)
 */
function sendToErrorMonitoringService(error: Error, context?: Record<string, any>): void {
  // Integration with your error monitoring service would go here
  // This is a placeholder implementation
  
  try {
    // Example: if using Sentry
    /*
    Sentry.captureException(error, {
      extra: context
    });
    */
    
    // For now, just log that we would send to the service
    if (process.env.DEBUG === 'true') {
      logger.debug('Would send to error monitoring service', {
        error: error.message,
        context
      });
    }
  } catch (err) {
    logger.error('Failed to send error to monitoring service', { error: err });
  }
}

/**
 * Send performance metric to external monitoring service
 */
function sendToPerformanceMonitoringService(
  operation: string, 
  duration: number,
  metadata?: Record<string, any>
): void {
  // Integration with your monitoring service would go here
  // This is a placeholder implementation
  
  try {
    // Example: if using Datadog or similar
    /*
    datadog.sendMetric('app.operation.duration', duration, {
      operation,
      ...metadata
    });
    */
    
    // For now, just log that we would send to the service
    if (process.env.DEBUG === 'true') {
      logger.debug('Would send to performance monitoring service', {
        operation,
        durationMs: Math.round(duration),
        metadata
      });
    }
  } catch (err) {
    logger.error('Failed to send metric to monitoring service', { error: err });
  }
}

/**
 * Track an application event for analytics
 */
export function trackEvent(
  eventName: string,
  userId?: string,
  properties?: Record<string, any>
): void {
  logger.info('Event tracked', {
    event: eventName,
    userId,
    ...properties
  });
  
  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: if using an analytics service
      /*
      analytics.track({
        event: eventName,
        userId,
        properties
      });
      */
      
      // For now, just log that we would send to the service
      if (process.env.DEBUG === 'true') {
        logger.debug('Would send to analytics service', {
          event: eventName,
          userId,
          properties
        });
      }
    } catch (err) {
      logger.error('Failed to track event in analytics service', { error: err });
    }
  }
}
