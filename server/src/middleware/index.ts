/**
 * Middleware Index
 * 
 * This file exports all middleware for easier imports in other files.
 * Consolidates various middleware modules for better organization.
 * 
 * All middleware now follows a standardized naming convention with hyphenated format:
 * *-middleware.ts
 */

// Import all middleware modules
import * as authMiddlewareModule from './auth-middleware';
import * as securityMiddlewareModule from './security-middleware';
import * as roleAuthMiddlewareModule from './role-auth-middleware';
import * as requestContextMiddlewareModule from './request-context-middleware';
import * as validationMiddlewareModule from './validation-middleware';
import * as uploadMiddlewareModule from './upload-middleware';
import * as rateLimiterMiddlewareModule from './rate-limiter-middleware';
import * as throttlingMiddlewareModule from './throttling-middleware';
import * as errorHandlerMiddlewareModule from './error-handler-middleware';
import * as performanceProfilerMiddlewareModule from './performance-profiler-middleware';
import * as metricsMiddlewareModule from './metrics-middleware';
import * as auditLogMiddlewareModule from './audit-log-middleware';
import * as loggingMiddlewareModule from './logging-middleware';

// Export standardized middleware with new naming convention
// Authentication & Security middleware
export { authMiddlewareModule as authMiddleware };
export { securityMiddlewareModule as securityMiddleware };
export { roleAuthMiddlewareModule as roleAuthMiddleware };

// Request processing middleware
export { requestContextMiddlewareModule as requestContextMiddleware };
export { validationMiddlewareModule as validationMiddleware };
export { uploadMiddlewareModule as uploadMiddleware };

// Rate limiting middleware
export { rateLimiterMiddlewareModule as rateLimiterMiddleware };
export { throttlingMiddlewareModule as throttlingMiddleware };

// Error handling middleware
export { errorHandlerMiddlewareModule as errorHandlerMiddleware };

// Performance monitoring
export { performanceProfilerMiddlewareModule as performanceProfilerMiddleware };
export { metricsMiddlewareModule as metricsMiddleware };
export { auditLogMiddlewareModule as auditLogMiddleware };
export { loggingMiddlewareModule as loggingMiddleware };

// Legacy exports for backward compatibility
// These will log deprecation warnings when used
export { errorHandler, asyncHandler } from './error-handler-middleware';

// Re-export middleware with standardized naming
export * from './auth-middleware';
export * from './security-middleware';
export * from './request-context-middleware';
export * from './validation-middleware';
export * from './upload-middleware';
export * from './rate-limiter-middleware';
export * from './performance-profiler-middleware';
export * from './audit-log-middleware';

// Export specific functions from middleware modules
export const {
  errorHandler: standardizedErrorHandler,
  asyncHandler: standardizedAsyncHandler 
} = errorHandlerMiddlewareModule;

export const { 
  rateLimiter, 
  authRateLimiter, 
  apiRateLimiter 
} = rateLimiterMiddlewareModule;

export const { 
  uploadAvatar, 
  uploadVerification, 
  uploadTaskAttachments 
} = uploadMiddlewareModule;

export const {
  requestLogger,
  auditLog,
  auditLogActions
} = loggingMiddlewareModule;
