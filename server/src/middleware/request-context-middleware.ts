/**
 * Request Context Middleware
 * 
 * This middleware attaches contextual information to each request,
 * making it available throughout the request lifecycle for logging,
 * debugging, and performance monitoring.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extend the Express Request type to include our context properties
 */
declare module 'express-serve-static-core' {
  interface Request {
    context: {
      requestId: string;
      startTime: number;
      ipAddress: string;
      userAgent: string;
      correlationId: string;
      transactionId: string;
      user?: Record<string, any>; // Will be populated by auth middleware
    }
  }
}

/**
 * Middleware that provides request context data
 * 
 * Attaches:
 * - requestId: A unique identifier for each request for tracing in logs
 * - startTime: The time when the request was received for performance monitoring
 * - ipAddress: The client's IP address
 * - userAgent: The client's browser/device information
 * - correlationId: An ID for tracking related requests across services
 * - transactionId: An ID for tracking a business transaction
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Record when the request started
  const startTime = Date.now();
  
  // Get the source IP address
  const ipAddress = 
    req.headers['x-forwarded-for'] as string ?? 
    req.socket.remoteAddress ?? 
    'unknown';
  
  // Add context data to the request object for use in other middleware and route handlers
  req.context = {
    requestId,
    startTime,
    ipAddress,
    userAgent: req.headers['user-agent'] ?? 'unknown',
    correlationId: req.headers['x-correlation-id'] as string ?? requestId,
    transactionId: uuidv4()
  };
  
  // Add the request ID as a response header for client-side debugging
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Correlation-Id', req.context.correlationId);
  
  // Continue to the next middleware
  next();
}

/**
 * Get the request ID from the current request context
 */
export function getRequestId(req: Request): string {
  return req.context?.requestId || 'unknown';
}

/**
 * Get the full request context object
 */
export function getRequestContext(req: Request): Record<string, any> {
  return req.context || {};
}

/**
 * Calculate the elapsed time since the request started
 */
export function getElapsedTime(req: Request): number {
  if (!req.context?.startTime) {
    return 0;
  }
  
  return Date.now() - req.context.startTime;
}

/**
 * Add custom data to the request context
 */
export function addToRequestContext(
  req: Request, 
  key: string, 
  value: any
): void {
  if (req.context) {
    (req.context as any)[key] = value;
  }
}

/**
 * Export all context-related functions
 */
export const requestContextUtils = {
  getRequestId,
  getRequestContext,
  getElapsedTime,
  addToRequestContext
};

/**
 * Export middleware function
 */
export default requestContext;
