/**
 * Logging Middleware
 * 
 * This middleware provides request logging and audit trail functionality
 * for tracking and monitoring API usage.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extend the Express Request type to include logging properties
 */
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Sensitive headers that should be redacted in logs
 */
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key'
];

/**
 * Fields that should be redacted in request bodies
 */
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
 * 
 * This logs the request details at the start of processing
 * and the response details when the request completes.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Assign a unique request ID if not already present
  req.id = req.id ?? uuidv4();
  
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
  
  // Create a safe copy of the request body
  let safeBody = null;
  
  if (req.body) {
    safeBody = { ...req.body };
    
    // Redact sensitive fields
    for (const field of SENSITIVE_BODY_FIELDS) {
      if (safeBody[field]) {
        safeBody[field] = '[REDACTED]';
      }
    }
  }
  
  // Log the request
  logger.info(`Request started: ${req.method} ${req.path}`, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    body: safeBody,
    headers: safeHeaders,
    ip: req.ip
  });
  
  // Log response when completed
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    
    logger.info(`Request completed: ${req.method} ${req.path}`, {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
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
  return (req: Request, _res: Response, next: NextFunction) => {
    // Continue processing the request
    next();
    
    // Extract user ID if authenticated
    const userId = req.user?.id;
    
    // Skip audit logging for anonymous users
    if (!userId) {
      return;
    }
    
    try {
      // Get resource information
      const { resourceType, resourceId } = getResourceInfo(req);
      
      // Create audit log asynchronously (don't block response)
      setImmediate(async () => {
        try {
          // Log the action
          logger.info(`Audit: ${action} ${resourceType}`, {
            userId,
            action,
            resourceType,
            resourceId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          // Store in database if needed
          // This would typically call a service to persist the audit log
          // Example: await auditLogService.create({ userId, action, resourceType, resourceId });
        } catch (error) {
          // Don't fail the request if audit logging fails
          logger.error('Failed to create audit log', { error });
        }
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      logger.error('Error in audit log middleware', { error });
    }
  };
}

/**
 * Predefined audit log middleware for common actions
 */
export const auditLogActions = {
  create: (getResourceInfo: (req: Request) => { resourceType: string; resourceId: string }) => 
    auditLog('create', getResourceInfo),
  update: (getResourceInfo: (req: Request) => { resourceType: string; resourceId: string }) => 
    auditLog('update', getResourceInfo),
  delete: (getResourceInfo: (req: Request) => { resourceType: string; resourceId: string }) => 
    auditLog('delete', getResourceInfo),
  view: (getResourceInfo: (req: Request) => { resourceType: string; resourceId: string }) => 
    auditLog('view', getResourceInfo)
};
