/**
 * Monitoring Module
 * 
 * This module exports all monitoring-related utilities for the application.
 */

// Re-export all monitoring components
export * from '../health-monitor';
export * from './performance';

// Import types
import type { NextFunction, Request, Response } from 'express';
import type { HealthStatus } from '../health-monitor';
import { logger } from '../logger';

// Re-export HealthStatus for consumers
export type { HealthStatus };

/**
 * Initialize all monitoring systems
 * @param app Express application instance
 */
export function initializeMonitoring(app: any): void {
  // Import the monitoring utilities
  const {
    healthCheckHandler,
    readinessProbeHandler,
    livenessProbeHandler
  } = require('../health-monitor');

  // Set up health check endpoints
  app.get('/health', healthCheckHandler);
  app.get('/health/liveness', livenessProbeHandler);
  app.get('/health/readiness', readinessProbeHandler);

  logger.info('Monitoring systems initialized');
}

/**
 * Security monitoring middleware to detect suspicious activities
 */
export function securityMonitoringMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Log suspicious headers or query parameters
  const suspiciousPatterns = [
    /select.*from/i,
    /union.*select/i,
    /<script>/i,
    /javascript:/i,
    /eval\(/i,
    /document\.cookie/i
  ];
  
  // Check request parameters
  const checkForSuspiciousPatterns = (obj: any) => {
    if (!obj) return false;
    
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            return { key, value, pattern: pattern.toString() };
          }
        }
      }
    }
    
    return false;
  };
  
  // Check headers, query, and body for suspicious patterns
  const suspiciousHeader = checkForSuspiciousPatterns(req.headers);
  const suspiciousQuery = checkForSuspiciousPatterns(req.query);
  const suspiciousBody = checkForSuspiciousPatterns(req.body);
  
  if (suspiciousHeader || suspiciousQuery || suspiciousBody) {
    // Log the suspicious activity
    logger.warn('Suspicious request detected', {
      path: req.path,
      ip: req.ip,
      suspiciousHeader,
      suspiciousQuery,
      suspiciousBody,
      user: (req.user as any)?.id
    });
  }
  
  // Check for excessive requests from the same IP
  // This would typically be handled by a rate limiter middleware
  
  next();
}

/**
 * Error monitoring to track application errors
 * @param error The error object
 * @param metadata Additional metadata to log
 */
export function monitorError(error: Error, metadata: Record<string, any> = {}): void {
  // Log the error with metadata
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...metadata
  });
  
  // In a production system, this would also send the error to an error tracking service
  // like Sentry, New Relic, or Datadog
}
