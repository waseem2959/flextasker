/**
 * Shared Error Type Definitions
 * 
 * This file defines the error-related types that are shared between
 * the frontend and backend to ensure consistency across the codebase.
 */

import { ErrorType, HttpStatusCode } from './enums';

/**
 * Base application error class
 */
export class AppError extends Error {
  type: ErrorType;
  code: string;
  status: HttpStatusCode;
  details?: Record<string, any>;
  path?: string;
  timestamp: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code: string = 'ERR_UNKNOWN',
    status: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: Record<string, any>,
    path?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code;
    this.status = status;
    this.details = details;
    this.path = path;
    this.timestamp = new Date().toISOString();

    // Ensures the correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert the error to a plain object suitable for API responses
   */
  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      path: this.path,
      timestamp: this.timestamp
    };
  }

  /**
   * Create an error from a plain object (useful for deserializing API errors)
   */
  static fromJSON(json: Record<string, any>): AppError {
    const error = new AppError(
      json.message,
      json.type,
      json.code,
      json.status,
      json.details,
      json.path
    );
    error.timestamp = json.timestamp ?? error.timestamp;
    return error;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  validationErrors: { field: string; message: string; rule?: string; value?: any }[];

  constructor(
    message: string = 'Validation failed',
    validationErrors: { field: string; message: string; rule?: string; value?: any }[] = [],
    path?: string
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'ERR_VALIDATION',
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      { errors: validationErrors },
      path
    );
    this.validationErrors = validationErrors;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Add a validation error
   */
  addError(field: string, message: string, rule?: string, value?: any): this {
    this.validationErrors.push({ field, message, rule, value });
    this.details = { errors: this.validationErrors };
    return this;
  }

  /**
   * Create a validation error from a plain object
   */
  static fromJSON(json: Record<string, any>): ValidationError {
    const validationErrors = json.details?.errors ?? [];
    const error = new ValidationError(json.message, validationErrors, json.path);
    error.timestamp = json.timestamp ?? error.timestamp;
    error.status = json.status ?? HttpStatusCode.UNPROCESSABLE_ENTITY;
    return error;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: string = 'ERR_AUTHENTICATION',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.AUTHENTICATION,
      code,
      HttpStatusCode.UNAUTHORIZED,
      details,
      path
    );

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    code: string = 'ERR_AUTHORIZATION',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.AUTHORIZATION,
      code,
      HttpStatusCode.FORBIDDEN,
      details,
      path
    );

    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    code: string = 'ERR_NOT_FOUND',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.NOT_FOUND,
      code,
      HttpStatusCode.NOT_FOUND,
      details,
      path
    );

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    code: string = 'ERR_CONFLICT',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.CONFLICT,
      code,
      HttpStatusCode.CONFLICT,
      details,
      path
    );

    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.RATE_LIMIT,
      'ERR_RATE_LIMIT',
      HttpStatusCode.TOO_MANY_REQUESTS,
      details,
      path
    );
    this.retryAfter = retryAfter;

    if (retryAfter) {
      this.details = { ...this.details, retryAfter };
    }

    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(
    message: string = 'Internal server error',
    code: string = 'ERR_SERVER',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.SERVER_ERROR,
      code,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      details,
      path
    );

    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(
    message: string = 'Network error occurred',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.NETWORK_ERROR,
      'ERR_NETWORK',
      HttpStatusCode.SERVICE_UNAVAILABLE,
      details,
      path
    );

    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends AppError {
  constructor(
    message: string = 'Request timed out',
    details?: Record<string, any>,
    path?: string
  ) {
    super(
      message,
      ErrorType.TIMEOUT,
      'ERR_TIMEOUT',
      HttpStatusCode.SERVICE_UNAVAILABLE,
      details,
      path
    );

    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Create appropriate error type from error data
 */
export function createErrorFromType(
  type: ErrorType,
  message: string,
  code?: string,
  details?: Record<string, any>,
  path?: string
): AppError {
  switch (type) {
    case ErrorType.VALIDATION:
      return new ValidationError(message, details?.errors, path);
    case ErrorType.AUTHENTICATION:
      return new AuthenticationError(message, code, details, path);
    case ErrorType.AUTHORIZATION:
      return new AuthorizationError(message, code, details, path);
    case ErrorType.NOT_FOUND:
      return new NotFoundError(message, code, details, path);
    case ErrorType.CONFLICT:
      return new ConflictError(message, code, details, path);
    case ErrorType.RATE_LIMIT:
      return new RateLimitError(message, details?.retryAfter, details, path);
    case ErrorType.SERVER_ERROR:
      return new ServerError(message, code, details, path);
    case ErrorType.NETWORK_ERROR:
      return new NetworkError(message, details, path);
    case ErrorType.TIMEOUT:
      return new TimeoutError(message, details, path);
    default:
      return new AppError(message, type, code, HttpStatusCode.INTERNAL_SERVER_ERROR, details, path);
  }
}
