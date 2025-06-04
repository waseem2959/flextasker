/**
 * Error Service
 * 
 * This service provides error handling functionality including:
 * - API error handling and transformation
 * - Error classification and formatting
 * - Error notification integration
 */

import { toast } from '@/hooks/use-toast';
import { notificationService } from '../ui/notification-service';

/**
 * API Response type definition
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[];
  timestamp?: string;
}

/**
 * Error types for different categories of errors
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Base application error class
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message = 'Network error occurred') {
    super(message, ErrorType.NETWORK);
    this.name = 'NetworkError';
  }
}

/**
 * Authentication error class
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, ErrorType.AUTH, 401);
    this.name = 'AuthError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  errors: Record<string, string[]>;
  
  constructor(message = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, ErrorType.VALIDATION, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, ErrorType.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission error class
 */
export class PermissionError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, ErrorType.PERMISSION, 403);
    this.name = 'PermissionError';
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(message = 'Server error occurred') {
    super(message, ErrorType.SERVER, 500);
    this.name = 'ServerError';
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends AppError {
  constructor(message = 'Request timed out') {
    super(message, ErrorType.TIMEOUT, 408);
    this.name = 'TimeoutError';
  }
}

/**
 * Check if an error is an AppError
 * 
 * @param error - Error to check
 * @returns True if the error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Classify an error based on its HTTP status code
 * 
 * @param statusCode - HTTP status code
 * @returns ErrorType based on the status code
 */
export function classifyError(statusCode: number): ErrorType {
  switch (statusCode) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTH;
    case 403:
      return ErrorType.PERMISSION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 408:
      return ErrorType.TIMEOUT;
    case 500:
    case 501:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Create an error from a status code and message
 * 
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @returns Appropriate error instance based on status code
 */
export function createError(statusCode: number, message: string): AppError {
  const type = classifyError(statusCode);
  
  switch (type) {
    case ErrorType.VALIDATION:
      return new ValidationError(message);
    case ErrorType.AUTH:
      return new AuthError(message);
    case ErrorType.PERMISSION:
      return new PermissionError(message);
    case ErrorType.NOT_FOUND:
      return new NotFoundError(message);
    case ErrorType.SERVER:
      return new ServerError(message);
    case ErrorType.TIMEOUT:
      return new TimeoutError(message);
    default:
      return new AppError(message, type, statusCode);
  }
}

/**
 * Create an error response for API failures
 * 
 * @param error - Error object
 * @returns Formatted API response with error details
 */
export function createErrorResponse<T = any>(error: unknown): ApiResponse<T> {
  let message = 'An unexpected error occurred';
  let errors: string[] = [];
  
  if (isAppError(error)) {
    message = error.message;
    
    if (error instanceof ValidationError && Object.keys(error.errors).length > 0) {
      errors = Object.values(error.errors).flat();
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  return {
    success: false,
    message,
    errors: errors.length ? errors : [message],
    timestamp: new Date().toISOString(),
    data: null as T
  };
}

/**
 * Handle an API error and transform it to an ApiResponse
 * 
 * @param error - Error object
 * @returns Formatted API response
 */
export function handleApiError<T = any>(error: unknown): ApiResponse<T> {
  return createErrorResponse<T>(error);
}

/**
 * Get a user-friendly title based on error type
 * 
 * @param errorType - Error type or error object
 * @returns User-friendly error title
 */
export function getErrorTitle(errorType: ErrorType | Error | string): string {
  let type: ErrorType;
  
  if (typeof errorType === 'string' && Object.values(ErrorType).includes(errorType as ErrorType)) {
    type = errorType as ErrorType;
  } else if (isAppError(errorType)) {
    type = errorType.type;
  } else {
    type = ErrorType.UNKNOWN;
  }
  
  switch (type) {
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.AUTH:
      return 'Authentication Error';
    case ErrorType.PERMISSION:
      return 'Permission Error';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.NETWORK:
      return 'Network Error';
    case ErrorType.TIMEOUT:
      return 'Request Timeout';
    default:
      return 'Error';
  }
}

/**
 * Handle an error and show appropriate UI notification
 * 
 * @param error - Error object
 * @param title - Optional custom title
 */
export function handleError(error: unknown, title?: string): void {
  let message = 'An unexpected error occurred';
  
  if (isAppError(error)) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  const errorTitle = title ?? getErrorTitle(isAppError(error) ? error : ErrorType.UNKNOWN);
  notificationService.error(message, errorTitle);
}

/**
 * Create a specialized error handler for a specific context
 * 
 * @param context - Context name to prepend to error titles
 * @returns Object with error handling methods for the context
 */
export function createErrorHandler(context: string) {
  return {
    /**
     * Handle an error in the given context
     */
    handleError: (error: unknown, title?: string) => {
      let contextTitle: string;
      if (title) {
        contextTitle = `${context}: ${title}`;
      } else {
        const errorType = isAppError(error) ? error : ErrorType.UNKNOWN;
        contextTitle = `${context}: ${getErrorTitle(errorType)}`;
      }
      handleError(error, contextTitle);
    },
    
    /**
     * Create an error response in the given context
     */
    createErrorResponse: <T = any>(error: unknown): ApiResponse<T> => {
      return createErrorResponse<T>(error);
    },
    
    /**
     * Handle an API error in the given context
     */
    handleApiError: <T = any>(error: unknown): ApiResponse<T> => {
      return handleApiError<T>(error);
    }
  };
}

/**
 * Show a success notification
 * 
 * @param message - Notification message
 * @param title - Optional notification title
 */
export function showSuccessNotification(message: string, title = 'Success'): void {
  notificationService.success(message, title);
}

/**
 * Show an error notification
 * 
 * @param message - Notification message
 * @param title - Optional notification title
 */
export function showErrorNotification(message: string, title = 'Error'): void {
  notificationService.error(message, title);
}

/**
 * Show an information notification
 * 
 * @param message - Notification message
 * @param title - Optional notification title
 */
export function showInfoNotification(message: string, title = 'Information'): void {
  notificationService.info(message, title);
}

/**
 * Show a warning notification
 * 
 * @param message - Notification message
 * @param title - Optional notification title
 */
export function showWarningNotification(message: string, title = 'Warning'): void {
  notificationService.warning(message, title);
}

// Export service object with all functions
export const errorService = {
  handleError,
  createErrorResponse,
  handleApiError,
  getErrorTitle,
  createError,
  classifyError,
  isAppError,
  createErrorHandler,
  
  // Notification functions
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification,
  toast,
  
  // Error classes
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  
  // Error types
  ErrorType
};

// Default export for convenience
export default errorService;
