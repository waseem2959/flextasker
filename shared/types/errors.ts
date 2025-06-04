/**
 * Shared Error Type Definitions
 * 
 * This file defines error types and interfaces shared between frontend and backend.
 * Using shared types ensures consistency in error handling across the application.
 */

/**
 * Standardized error types used throughout the application
 */
export enum ErrorType {
  // Authentication/Authorization errors
  AUTHENTICATION = 'AUTHENTICATION_ERROR', // 401 - Not authenticated
  AUTHORIZATION = 'AUTHORIZATION_ERROR',   // 403 - Not authorized
  
  // Data/Input errors
  VALIDATION = 'VALIDATION_ERROR',         // 400 - Invalid input data
  NOT_FOUND = 'NOT_FOUND_ERROR',           // 404 - Resource not found
  CONFLICT = 'CONFLICT_ERROR',             // 409 - Resource conflict
  
  // System errors
  SERVER = 'SERVER_ERROR',                 // 500 - Internal server error
  DATABASE = 'DATABASE_ERROR',             // 503 - Database error
  
  // Network errors
  NETWORK = 'NETWORK_ERROR',               // Network connectivity issue
  TIMEOUT = 'TIMEOUT_ERROR',               // 408 - Request timeout
  RATE_LIMIT = 'RATE_LIMIT_ERROR',         // 429 - Too many requests
  
  // Generic error
  UNKNOWN = 'UNKNOWN_ERROR'                // Unclassified error
}

/**
 * HTTP status codes mapped to their semantic meanings
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Base error response interface
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[] | ValidationErrorDetail[];
  code?: string;
  timestamp: string;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationErrorDetail[];
}

/**
 * Maps error types to HTTP status codes
 */
export const errorTypeToStatusCode: Record<ErrorType, HttpStatusCode> = {
  [ErrorType.AUTHENTICATION]: HttpStatusCode.UNAUTHORIZED,
  [ErrorType.AUTHORIZATION]: HttpStatusCode.FORBIDDEN,
  [ErrorType.VALIDATION]: HttpStatusCode.BAD_REQUEST,
  [ErrorType.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ErrorType.CONFLICT]: HttpStatusCode.CONFLICT,
  [ErrorType.SERVER]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorType.DATABASE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ErrorType.NETWORK]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ErrorType.TIMEOUT]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ErrorType.RATE_LIMIT]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ErrorType.UNKNOWN]: HttpStatusCode.INTERNAL_SERVER_ERROR
};

/**
 * Maps HTTP status codes to error types
 */
export function statusCodeToErrorType(statusCode: number): ErrorType {
  switch (statusCode) {
    case HttpStatusCode.BAD_REQUEST:
      return ErrorType.VALIDATION;
    case HttpStatusCode.UNAUTHORIZED:
      return ErrorType.AUTHENTICATION;
    case HttpStatusCode.FORBIDDEN:
      return ErrorType.AUTHORIZATION;
    case HttpStatusCode.NOT_FOUND:
      return ErrorType.NOT_FOUND;
    case HttpStatusCode.CONFLICT:
      return ErrorType.CONFLICT;
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return ErrorType.RATE_LIMIT;
    case HttpStatusCode.INTERNAL_SERVER_ERROR:
      return ErrorType.SERVER;
    case HttpStatusCode.SERVICE_UNAVAILABLE:
      return ErrorType.DATABASE;
    default:
      return ErrorType.UNKNOWN;
  }
}
