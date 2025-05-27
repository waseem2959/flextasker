/**
 * Request Context Middleware
 * 
 * This middleware adds request tracing capabilities to the application.
 * It enables tracking of request context across asynchronous boundaries
 * and provides correlation IDs for observability.
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Define the request context shape
export interface RequestContext {
  requestId: string;
  userId?: string;
  startTime: number;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

// Create AsyncLocalStorage instance to store request context
export const requestStorage = new AsyncLocalStorage<RequestContext>();

// Context utility to safely access the current request context
export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore();
}

/**
 * Middleware to establish request context for each request
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate a unique request ID or use an existing one from headers
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Set the request ID header for the response
  res.setHeader('X-Request-ID', requestId);
  
  // Create the request context
  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip
  };
  
  // Add user ID to context if authenticated
  if (req.user && req.user.id) {
    context.userId = req.user.id;
  }
  
  // Add useful metadata for API routes
  if (req.query && Object.keys(req.query).length > 0) {
    context.query = req.query;
  }
  
  // Run the request handler within the context
  requestStorage.run(context, () => {
    // Log request start
    logger.info(`${req.method} ${req.path} - Request started`, {
      requestId,
      userId: context.userId,
      userAgent: context.userAgent,
      ip: context.ip
    });
    
    // Add response finished listener
    res.on('finish', () => {
      const context = getRequestContext();
      if (!context) return;
      
      const duration = Date.now() - context.startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      // Log request completion with duration and status
      logger[level](`${req.method} ${req.path} - Request completed`, {
        requestId: context.requestId,
        userId: context.userId,
        statusCode: res.statusCode,
        durationMs: duration
      });
      
      // Track slow requests
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          requestId: context.requestId,
          path: req.path,
          method: req.method,
          durationMs: duration
        });
      }
    });
    
    next();
  });
}

/**
 * Get the current request ID from context
 */
export function getRequestId(): string | undefined {
  const context = getRequestContext();
  return context?.requestId;
}

/**
 * Extend the current request context with additional data
 */
export function extendRequestContext(data: Record<string, any>): void {
  const context = getRequestContext();
  if (!context) {
    logger.warn('Attempted to extend request context outside of a request');
    return;
  }
  
  // Add data to context
  Object.assign(context, data);
}

/**
 * Create a logger that includes request context information
 */
export function createContextLogger() {
  return {
    debug: (message: string, meta: Record<string, any> = {}) => {
      const context = getRequestContext();
      logger.debug(message, { ...meta, requestId: context?.requestId, userId: context?.userId });
    },
    info: (message: string, meta: Record<string, any> = {}) => {
      const context = getRequestContext();
      logger.info(message, { ...meta, requestId: context?.requestId, userId: context?.userId });
    },
    warn: (message: string, meta: Record<string, any> = {}) => {
      const context = getRequestContext();
      logger.warn(message, { ...meta, requestId: context?.requestId, userId: context?.userId });
    },
    error: (message: string, meta: Record<string, any> = {}) => {
      const context = getRequestContext();
      logger.error(message, { ...meta, requestId: context?.requestId, userId: context?.userId });
    }
  };
}

// Export a pre-configured context logger
export const contextLogger = createContextLogger();
