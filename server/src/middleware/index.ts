/**
 * Middleware Index
 * 
 * This file serves as the central export point for all middleware.
 * It aggregates middleware from various modules, making them easier to import.
 */

// Re-export all authentication middleware
export * from './auth';

// Re-export all validation middleware
export * from './validation';

// Re-export all logging middleware
export * from './logging';

// Export enhanced error handler middleware
import { errorHandler } from './errorHandler';
export { errorHandler };

// Export rate limiter middleware
import { rateLimiter } from './rateLimiter';
export { rateLimiter };

// Export file upload middleware
import { uploadMiddleware } from './upload';
export { uploadMiddleware };
