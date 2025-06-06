import { AxiosError } from 'axios';
import type { ApiResponse } from './api-types';
// Import shared error types as the canonical source
import {
  ErrorResponse,
  ErrorType,
  HttpStatusCode,
  ValidationErrorDetail,
  ValidationErrorResponse,
  errorTypeToStatusCode,
  statusCodeToErrorType
} from '../../shared/types/errors';

// Re-export shared types for convenience
export {
  ErrorType,
  errorTypeToStatusCode,
  statusCodeToErrorType
};
export type {
  ErrorResponse,
  HttpStatusCode,
  ValidationErrorDetail, ValidationErrorResponse
};

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly code: string;
  public readonly status: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    details?: Record<string, any>,
    code = 'APP_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.code = code;
    this.status = statusCode ?? 500;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  public readonly originalError?: AxiosError;

  constructor(message = 'Network error occurred', originalError?: AxiosError, details?: Record<string, any>) {
    super(message, ErrorType.NETWORK, 503, details, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.originalError = originalError;

    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: Record<string, any>) {
    super(message, ErrorType.AUTHENTICATION, 401, details, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
    
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authentication error (alias for AuthenticationError)
 */
export class AuthError extends AppError {
  constructor(message = 'Authentication failed', details?: Record<string, any>) {
    super(message, ErrorType.AUTHENTICATION, 401, details, 'AUTH_ERROR');
    this.name = 'AuthError';
    
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Authorization failed', details?: Record<string, any>) {
    super(message, ErrorType.AUTHORIZATION, 403, details, 'PERMISSION_ERROR');
    this.name = 'AuthorizationError';

    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation errors with field-specific details
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = 'Validation failed',
    errors: Record<string, string[]> = {},
    details: Record<string, any> = {}
  ) {
    // If details is empty but we have errors, include fieldErrors in details
    const finalDetails = Object.keys(details).length === 0 && Object.keys(errors).length > 0
      ? { ...details, fieldErrors: errors }
      : details;
      
    super(message, ErrorType.VALIDATION, 400, finalDetails, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
    this.fieldErrors = errors;
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Add a field error
   */
  addFieldError(field: string, error: string): void {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(error);
    this.fieldErrors[field] = this.errors[field];
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] || [];
  }

  /**
   * Check if a field has errors
   */
  hasFieldErrors(field: string): boolean {
    return this.errors[field] && this.errors[field].length > 0;
  }

  /**
   * Get all error messages as a flat array
   */
  getAllErrorMessages(): string[] {
    return Object.values(this.errors).flat();
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string;
  public readonly resourceId?: string;

  constructor(resourceType = 'Resource', resourceId?: string, details?: Record<string, any>) {
    const message = resourceId 
      ? `${resourceType} with ID ${resourceId} not found`
      : `${resourceType} not found`;
    
    super(message, ErrorType.NOT_FOUND, 404, details, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Permission error for unauthorized actions
 */
export class PermissionError extends AppError {
  public readonly action: string;
  public readonly resource: string;

  constructor(action = 'access', resource = 'resource', details?: Record<string, any>) {
    super(
      `You don't have permission to ${action} this ${resource}`,
      ErrorType.AUTHORIZATION,
      403,
      details,
      'PERMISSION_ERROR'
    );
    this.name = 'PermissionError';
    this.action = action;
    this.resource = resource;
    
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: Record<string, any>) {
    super(message, ErrorType.CONFLICT, 409, details, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
    
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(message, ErrorType.RATE_LIMIT, 429, details, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server errors
 */
export class ServerError extends AppError {
  constructor(message = 'Internal server error', details?: Record<string, any>) {
    super(message, ErrorType.SERVER, 500, details, 'SERVER_ERROR');
    this.name = 'ServerError';

    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  public readonly timeout?: number;

  constructor(message = 'Request timed out', timeout?: number, details?: Record<string, any>) {
    super(message, ErrorType.TIMEOUT, 408, details, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    this.timeout = timeout;
    
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error factory to create appropriate error types based on HTTP status codes
 */
export class ErrorFactory {
  static createFromResponse(
    statusCode: number,
    message: string,
    details?: Record<string, any>
  ): AppError {
    switch (statusCode) {
      case 400:
        return new ValidationError(message, {}, details);
      case 401:
        return new AuthenticationError(message, details);
      case 403:
        return new AuthorizationError(message, details);
      case 404:
        return new NotFoundError('Resource', undefined, details);
      case 409:
        return new ConflictError(message, details);
      case 429:
        return new RateLimitError(message, undefined, details);
      case 408:
        return new TimeoutError(message, 30000, details);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message, details);
      default:
        return new AppError(message, ErrorType.UNKNOWN, statusCode, details);
    }
  }

  static createFromError(error: Error, type?: ErrorType): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      error.message,
      type ?? ErrorType.UNKNOWN,
      undefined,
      { originalError: error.name }
    );
  }
}

/**
 * Classify an error based on HTTP status code
 * Uses the shared statusCodeToErrorType function for consistency
 */
export function classifyError(statusCode: number): ErrorType {
  return statusCodeToErrorType(statusCode);
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
    case ErrorType.AUTHENTICATION:
      return new AuthenticationError(message);
    case ErrorType.AUTHORIZATION:
      return new AuthorizationError(message);
    case ErrorType.VALIDATION:
      return new ValidationError(message, errors);
    case ErrorType.NOT_FOUND:
      return new NotFoundError('Resource');
    case ErrorType.CONFLICT:
      return new ConflictError(message);
    case ErrorType.RATE_LIMIT:
      return new RateLimitError(message);
    case ErrorType.SERVER:
      return new ServerError(message);
    case ErrorType.TIMEOUT:
      return new TimeoutError(message);
    default:
      return new AppError(message, type);
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse<T = undefined>(error: any): ApiResponse<T> {
  // Create appropriate error object
  let appError: AppError;
  
  if (isAppError(error)) {
    appError = error;
  } else {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    appError = new AppError(errorMessage);
  }
  
  return {
    success: false,
    message: appError.message,
    errors: appError instanceof ValidationError 
      ? Object.values(appError.errors).flat() 
      : [appError.message],
    timestamp: new Date().toISOString()
  };
}

/**
 * Function to convert API errors to appropriate AppError subclasses
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Handle axios errors
    if ('isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status ?? 500;
      const message = axiosError.response?.data?.message 
        ?? axiosError.message 
        ?? 'Network request failed';
      
      const errorType = classifyError(status);
      
      if (errorType === ErrorType.VALIDATION && axiosError.response?.data?.errors) {
        return new ValidationError(
          message,
          axiosError.response.data.errors
        );
      }
      
      return createError(message, errorType);
    }
    
    return new AppError(error.message);
  }
  
  return new AppError('Unknown error occurred');
}

/**
 * Type guards for error checking
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error context for better debugging
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  timestamp: string;
  stack?: string;
}

/**
 * Structured error for logging and monitoring
 */
export interface StructuredError {
  id: string;
  type: ErrorType;
  message: string;
  severity: ErrorSeverity;
  statusCode?: number;
  details?: Record<string, any>;
  context: ErrorContext;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}
