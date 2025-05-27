/**
 * Error Type Definitions
 * 
 * This file defines the TypeScript interfaces for error handling,
 * ensuring consistent error management across the application.
 */

import { AxiosError } from 'axios';
import type { ApiResponse } from './api';

/**
 * Error types enumeration for categorizing errors
 */
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTH = 'AUTH_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  SERVER = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNKNOWN = 'APP_ERROR'
}

/**
 * Base application error class that all other error types extend
 */
export class AppError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code = 'APP_ERROR', status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Network error for API request failures
 */
export class NetworkError extends AppError {
  originalError?: AxiosError;
  
  constructor(message: string, originalError?: AxiosError) {
    super(message, 'NETWORK_ERROR', 503);
    this.originalError = originalError;
    
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  fieldErrors: Record<string, string[]>;
  details: Record<string, any>;
  
  constructor(
    message: string = 'Validation failed', 
    fieldErrors: Record<string, string[]> = {},
    details: Record<string, any> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fieldErrors = fieldErrors;
    this.details = details;
    
    // For backward compatibility
    if (Object.keys(this.details).length === 0 && Object.keys(fieldErrors).length > 0) {
      this.details = { fieldErrors };
    }
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error for resources that don't exist
 */
export class NotFoundError extends AppError {
  resourceType: string;
  resourceId?: string;
  
  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId 
      ? `${resourceType} with ID ${resourceId} not found`
      : `${resourceType} not found`;
    
    super(message, 'NOT_FOUND_ERROR', 404);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Permission error for unauthorized actions
 */
export class PermissionError extends AppError {
  action: string;
  resource: string;
  
  constructor(action: string, resource: string) {
    super(
      `You don't have permission to ${action} this ${resource}`,
      'PERMISSION_ERROR',
      403
    );
    this.action = action;
    this.resource = resource;
    
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Server error for internal server errors
 */
export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred') {
    super(message, 'SERVER_ERROR', 500);
    
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Timeout error for request timeouts
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR', 408);
    
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Classify an error based on HTTP status code
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
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Create an appropriate error instance based on error type
 */
export function createError(
  message: string, 
  type: ErrorType, 
  errors?: Record<string, string[]>
): AppError {
  switch (type) {
    case ErrorType.NETWORK:
      return new NetworkError(message);
    case ErrorType.AUTH:
      return new AuthError(message);
    case ErrorType.VALIDATION:
      return new ValidationError(message, errors ?? {});
    case ErrorType.NOT_FOUND:
      return new NotFoundError('Resource', message);
    case ErrorType.PERMISSION:
      return new PermissionError('access', 'resource');
    case ErrorType.SERVER:
      return new ServerError(message);
    case ErrorType.TIMEOUT:
      return new TimeoutError(message);
    default:
      return new AppError(message);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse<T = any>(error: any): ApiResponse<T> {
  if (isAppError(error)) {
    return {
      success: false,
      message: error.message,
      errors: error instanceof ValidationError ? 
        Object.values(error.fieldErrors).flat() : 
        [error.message],
      timestamp: new Date().toISOString()
    };
  }
  
  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  
  return {
    success: false,
    message,
    errors: [message],
    timestamp: new Date().toISOString()
  };
}

/**
 * Function to convert API errors to appropriate AppError subclasses
 */
export function handleApiError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const message = error.response?.data?.message ?? error.message;
    
    switch (status) {
      case 400:
        return new ValidationError(
          message,
          error.response?.data?.errors ?? {}
        );
      case 401:
      case 403:
        return new AuthError(message);
      case 404:
        return new NotFoundError(error.response?.data?.resourceType ?? 'Resource');
      default:
        return new NetworkError(message, error);
    }
  }
  
  return new AppError(
    error instanceof Error ? error.message : 'An unknown error occurred'
  );
}
