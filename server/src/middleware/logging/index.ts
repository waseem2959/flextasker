/**
 * Logging Middleware Module
 * 
 * This module provides middleware for request logging and audit trails.
 * It centralizes logging logic for consistent request tracking.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Sensitive headers that should be redacted in logs
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key'
];

// Fields that should be redacted in request bodies
const SENSITIVE_BODY_FIELDS = [
  'password',
  'passwordConfirmation',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'creditCard',
  'cvv'
];

/**
 * Middleware that logs all incoming requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Assign a unique request ID if not already present
  req.id = req.id || uuidv4();
  
  // Set request start time
  req.startTime = Date.now();
  
  // Create a safe copy of headers without sensitive information
  const safeHeaders = { ...req.headers };
  
  // Redact sensitive headers
  for (const header of SENSITIVE_HEADERS) {
    if (safeHeaders[header]) {
      safeHeaders[header] = '[REDACTED]';
    }
  }
  
  // Log the request
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    headers: safeHeaders,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log request completion and timing
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - req.startTime;
    
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id
    });
    
    return originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Middleware that creates an audit log entry for specific actions
 * 
 * @param action - The action being performed
 * @param getResourceInfo - Function to extract resource information from the request
 */
export function auditLog(
  action: string,
  getResourceInfo: (req: Request) => { resourceType: string; resourceId: string }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only proceed if we have an authenticated user
    if (!req.user?.id) {
      return next();
    }
    
    // Extract resource information
    const { resourceType, resourceId } = getResourceInfo(req);
    
    // Create a safe copy of the request body
    let safeBody = null;
    
    if (req.body && typeof req.body === 'object') {
      safeBody = { ...req.body };
      
      // Redact sensitive fields in the body
      for (const field of SENSITIVE_BODY_FIELDS) {
        if (safeBody[field]) {
          safeBody[field] = '[REDACTED]';
        }
      }
    }
    
    // Log the audit entry
    logger.info('Audit log', {
      action,
      userId: req.user.id,
      userRole: req.user.role,
      resourceType,
      resourceId,
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      body: safeBody,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    
    next();
  };
}
