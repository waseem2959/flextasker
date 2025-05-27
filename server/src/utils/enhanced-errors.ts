/**
 * Enhanced Error Handling System
 * 
 * This module implements a standardized error handling system that aligns with
 * the frontend error handling. It uses shared error types to ensure consistency
 * across the application.
 */

import { ErrorType, HttpStatusCode, ValidationErrorDetail } from '../../../shared/types/errors';

/**
 * Base application error class that all specific error types extend
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: ErrorType;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    
    // Set the prototype explicitly to maintain proper inheritance
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.type = type;
    this.statusCode = statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to a JSON object safe for API responses
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      type: this.type,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error - for invalid input data
 */
export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(message: string = 'Validation failed', errors: ValidationErrorDetail[] = []) {
    super(message, ErrorType.VALIDATION, HttpStatusCode.BAD_REQUEST);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.errors = errors;
  }

  /**
   * Creates a validation error from field-specific errors
   */
  static fromFieldErrors(errors: ValidationErrorDetail[]): ValidationError {
    return new ValidationError('Validation failed', errors);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors
    };
  }
}

/**
 * Authentication Error - when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorType.AUTHENTICATION, HttpStatusCode.UNAUTHORIZED);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error - when user lacks permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, ErrorType.AUTHORIZATION, HttpStatusCode.FORBIDDEN);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error - when resource doesn't exist
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string;
  public readonly resourceId?: string;

  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId 
      ? `${resourceType} with ID ${resourceId} not found`
      : `${resourceType} not found`;
      
    super(message, ErrorType.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    Object.setPrototypeOf(this, NotFoundError.prototype);
    
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId
    };
  }
}

/**
 * Conflict Error - when there's a resource conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, ErrorType.CONFLICT, HttpStatusCode.CONFLICT);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Server Error - for internal server errors
 */
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, ErrorType.SERVER, HttpStatusCode.INTERNAL_SERVER_ERROR, false);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Database Error - for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error occurred') {
    super(message, ErrorType.DATABASE, HttpStatusCode.SERVICE_UNAVAILABLE, false);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Rate Limit Error - when requests exceed the rate limit
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, ErrorType.RATE_LIMIT, HttpStatusCode.TOO_MANY_REQUESTS);
    Object.setPrototypeOf(this, RateLimitError.prototype);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.retryAfter && { retryAfter: this.retryAfter })
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Creates a standardized error response for API endpoints
 */
export function createErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      success: false,
      message: error.message,
      ...(error instanceof ValidationError && { errors: error.errors }),
      type: error.type,
      timestamp: error.timestamp
    };
  }
  
  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  
  return {
    success: false,
    message,
    type: ErrorType.UNKNOWN,
    timestamp: new Date().toISOString()
  };
}
