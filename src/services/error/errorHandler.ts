/**
 * Error Handler
 * 
 * This module provides error handling functionality including:
 * - API error handling and transformation
 * - Error classification and formatting
 * - Error notification integration
 */

import { ApiResponse } from '@/types/api';
import { toast } from '@/hooks/useToast';

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
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Classify an error based on its HTTP status code
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
 */
export function createErrorResponse<T = any>(error: unknown): ApiResponse<T> {
  let message = 'An unexpected error occurred';
  let errors: string[] = [];
  let statusCode = 500;
  
  if (isAppError(error)) {
    message = error.message;
    statusCode = error.statusCode || 500;
    
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
 * Format an error message to a user-friendly string
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isAppError(error)) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Handle an API error and transform it to an ApiResponse
 */
export function handleApiError<T = any>(error: unknown): ApiResponse<T> {
  console.error('API Error:', error);
  return createErrorResponse<T>(error);
}

/**
 * Handle an error and show appropriate UI notification
 */
export function handleError(error: unknown, title?: string): void {
  const message = formatErrorMessage(error);
  const errorType = isAppError(error) ? error.type : ErrorType.UNKNOWN;
  const errorTitle = title || getErrorTitle(errorType);
  
  showErrorNotification(message, errorTitle);
}

/**
 * Get a user-friendly title based on error type
 */
export function getErrorTitle(errorType: ErrorType | unknown): string {
  if (typeof errorType !== 'string') {
    return 'Error';
  }
  
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.AUTH:
      return 'Authentication Error';
    case ErrorType.PERMISSION:
      return 'Permission Denied';
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
 * Show a success notification
 */
export function showSuccessNotification(message: string, title = 'Success'): void {
  toast({
    title,
    description: message,
    variant: 'success',
    duration: 5000
  });
}

/**
 * Show an error notification
 */
export function showErrorNotification(message: string, title = 'Error'): void {
  toast({
    title,
    description: message,
    variant: 'destructive',
    duration: 7000
  });
}

/**
 * Show an information notification
 */
export function showInfoNotification(message: string, title = 'Information'): void {
  toast({
    title,
    description: message,
    variant: 'info',
    duration: 5000
  });
}

/**
 * Show a warning notification
 */
export function showWarningNotification(message: string, title = 'Warning'): void {
  toast({
    title,
    description: message,
    variant: 'warning',
    duration: 6000
  });
}

/**
 * Create a specialized error handler for a specific context
 */
export function createErrorHandler(context: string) {
  return {
    handleError: (error: unknown, title?: string) => {
      const contextualizedError = isAppError(error)
        ? error
        : new AppError(
            `${formatErrorMessage(error)} (${context})`,
            isAppError(error) ? error.type : ErrorType.UNKNOWN
          );
      
      handleError(contextualizedError, title);
    },
    showSuccess: (message: string, title?: string) => {
      showSuccessNotification(message, title || `${context} Success`);
    },
    showInfo: (message: string, title?: string) => {
      showInfoNotification(message, title || `${context} Information`);
    },
    showWarning: (message: string, title?: string) => {
      showWarningNotification(message, title || `${context} Warning`);
    },
    createErrorResponse: <T = any>(error: unknown): ApiResponse<T> => {
      return createErrorResponse<T>(error);
    }
  };
}
