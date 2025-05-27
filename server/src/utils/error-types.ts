/**
 * Error Type Definitions
 * 
 * This module defines standardized error types for consistent error handling.
 */

/**
 * Enum for error types
 */
export enum ErrorType {
  // Client errors (4xx)
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  BAD_REQUEST = 'bad_request',
  RATE_LIMIT = 'rate_limit',
  
  // Server errors (5xx)
  SERVER_ERROR = 'server_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_SERVICE = 'external_service_error',
  CONFIGURATION = 'configuration_error',
  
  // Special cases
  DEPRECATED = 'deprecated',
  MAINTENANCE = 'maintenance'
}

/**
 * Base error class
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;
  
  constructor(message: string, type: ErrorType, statusCode: number, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        details: this.details
      }
    };
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.VALIDATION, 400, details);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.AUTHENTICATION, 401, details);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.AUTHORIZATION, 403, details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.NOT_FOUND, 404, details);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.CONFLICT, 409, details);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.RATE_LIMIT, 429, details);
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.SERVER_ERROR, 500, details);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.DATABASE_ERROR, 500, details);
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorType.EXTERNAL_SERVICE, 502, details);
  }
}

export default {
  ErrorType,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  DatabaseError,
  ExternalServiceError
};
