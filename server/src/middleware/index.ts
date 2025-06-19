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
import * as rateLimiterMiddlewareModule from './rate-limiter-middleware';
import * as requestContextMiddlewareModule from './request-context-middleware';
import * as securityMiddlewareModule from './security-middleware';
import * as uploadMiddlewareModule from './upload-middleware';
import * as zodValidationMiddlewareModule from './zod-validation-middleware';
// Error handling from utils (consolidated)
import * as auditLogMiddlewareModule from './audit-log-middleware';
import * as metricsMiddlewareModule from './metrics-middleware';
import * as performanceProfilerMiddlewareModule from './performance-profiler-middleware';

// Export standardized middleware with new naming convention
// Authentication & Security middleware
export { authMiddlewareModule as authMiddleware, securityMiddlewareModule as securityMiddleware };

// Request processing middleware
export { requestContextMiddlewareModule as requestContextMiddleware, uploadMiddlewareModule as uploadMiddleware, zodValidationMiddlewareModule as validationMiddleware };

// Rate limiting middleware
    export { rateLimiterMiddlewareModule as rateLimiterMiddleware };



// Performance monitoring
    export { auditLogMiddlewareModule as auditLogMiddleware, metricsMiddlewareModule as metricsMiddleware, performanceProfilerMiddlewareModule as performanceProfilerMiddleware };

// Error handling middleware (consolidated from utils)
    export { errorHandlerMiddleware as errorHandler } from '../utils/error-utils';

// Legacy exports for backward compatibility
// These will log deprecation warnings when used

// Re-export middleware with standardized naming
export * from './audit-log-middleware';
export * from './auth-middleware';
export * from './performance-profiler-middleware';
export * from './rate-limiter-middleware';
export * from './request-context-middleware';
export * from './security-middleware';
export * from './upload-middleware';
export * from './zod-validation-middleware';

// Export specific functions from middleware modules
// Error handling now comes from utils/error-utils

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


