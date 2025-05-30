/**
 * Error Service
 * 
 * This module provides comprehensive error handling functionality for the application.
 * It includes error classification, formatting, notification integration, and utilities
 * for handling API errors consistently.
 */

// Export all functionality from the main error handler implementation
export {
  // Error types
  ErrorType,
  
  // Error classes
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  
  // Error handling functions
  isAppError,
  classifyError,
  createError,
  createErrorResponse,
  handleApiError,
  
  // Notification functions
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification,
} from './errorHandler';

// Export the error handler factory as the default export
import { createErrorHandler } from './errorHandler';
export { createErrorHandler };
export default createErrorHandler;

// Import toast from our hooks
import { toast } from '@/hooks/use-toast';

// Export toast for convenience
export { toast };
