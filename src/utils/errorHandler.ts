/**
 * Error Handling Utilities
 * 
 * This file re-exports error handling utilities from the consolidated error handler
 * for backward compatibility with code that imports from the utils directory.
 */

import { 
  formatErrorMessage, 
  handleError, 
  createErrorHandler, 
  AppError,
  NetworkError,
  AuthError,
  NotFoundError,
  ValidationError,
  PermissionError,
  ServerError,
  TimeoutError,
  ErrorType
} from '@/services/error/errorHandler';

// Re-export all error handling utilities
export {
  formatErrorMessage,
  handleError,
  createErrorHandler,
  AppError,
  NetworkError,
  AuthError,
  NotFoundError,
  ValidationError,
  PermissionError,
  ServerError,
  TimeoutError,
  ErrorType
};
