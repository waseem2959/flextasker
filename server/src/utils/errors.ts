/**
 * Custom error classes for FlexTasker platform
 * 
 * This error system provides type-safe error handling while maintaining flexibility
 * for different types of error details. Instead of using generic 'any' types,
 * we define specific interfaces for different error scenarios.
 * 
 * Think of this as creating a comprehensive incident report system where each
 * type of incident has its own specific form with relevant fields.
 */

// Define specific types for different kinds of error details
// This approach gives us flexibility while maintaining type safety

/**
 * Base interface for all error details
 * This ensures every error detail object has some common structure
 */
interface BaseErrorDetails {
  timestamp?: string;
  requestId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Validation error details - used when user input fails validation
 * Like having a specific form for reporting input validation issues
 */
interface ValidationErrorDetails extends BaseErrorDetails {
  field?: string;
  value?: unknown; // The actual invalid value (using 'unknown' for safety)
  expectedType?: string;
  validationRule?: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Database error details - used when database operations fail
 * Like having a specific form for reporting database issues
 */
interface DatabaseErrorDetails extends BaseErrorDetails {
  query?: string;
  table?: string;
  operation?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  constraint?: string;
  connectionPool?: {
    active: number;
    idle: number;
    waiting: number;
  };
}

/**
 * Authentication error details - used when auth operations fail
 * Like having a specific form for reporting security incidents
 */
interface AuthErrorDetails extends BaseErrorDetails {
  authMethod?: 'JWT' | 'SESSION' | 'API_KEY' | 'OAUTH';
  tokenExpired?: boolean;
  ipAddress?: string;
  userAgent?: string;
  attemptCount?: number;
}

/**
 * Business logic error details - used for domain-specific errors
 * Like having a specific form for FlexTasker business rule violations
 */
interface BusinessErrorDetails extends BaseErrorDetails {
  businessRule?: string;
  entityType?: 'USER' | 'TASK' | 'BID' | 'PAYMENT' | 'REVIEW';
  entityId?: string;
  currentState?: string;
  expectedState?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rate limiting error details - used when users exceed request limits
 * Like having a specific form for reporting usage limit violations
 */
interface RateLimitErrorDetails extends BaseErrorDetails {
  limit?: number;
  current?: number;
  windowMs?: number;
  retryAfter?: number;
  endpoint?: string;
}

/**
 * Union type for all possible error details
 * This gives us type safety while maintaining flexibility
 */
type ErrorDetails = 
  | ValidationErrorDetails 
  | DatabaseErrorDetails 
  | AuthErrorDetails 
  | BusinessErrorDetails 
  | RateLimitErrorDetails 
  | BaseErrorDetails;

/**
 * Generic AppError class that can handle different types of details
 * 
 * This is like having a master incident report template that can accommodate
 * different types of specific incident details while maintaining consistency.
 */
export class AppError<TDetails extends ErrorDetails = ErrorDetails> extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: TDetails;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: TDetails
  ) {
    super(message);
    
    // Set the prototype explicitly to maintain proper inheritance
    // This ensures instanceof checks work correctly
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown
    // This is crucial for debugging in production
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error for logging or API responses
   * This method ensures we only expose safe information
   */
  public toJSON() {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Creates a sanitized version for API responses
   * This removes sensitive information that shouldn't be exposed to clients
   */
  public toAPIResponse() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        timestamp: this.timestamp,
        // Only include safe details, excluding sensitive information
        ...(this.details && this.isDetailsSafe() && { details: this.details }),
      },
    };
  }

  /**
   * Determines if error details are safe to expose in API responses
   * Override this in subclasses for custom safety logic
   */
  protected isDetailsSafe(): boolean {
    // By default, only expose details in development
    return process.env.NODE_ENV === 'development';
  }
}

/**
 * Validation Error - when user input doesn't meet requirements
 * Like having a specialized incident report for input validation issues
 */
export class ValidationError extends AppError<ValidationErrorDetails> {
  constructor(message: string, details?: ValidationErrorDetails) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Validation errors are generally safe to expose to users
   * since they help users correct their input
   */
  protected isDetailsSafe(): boolean {
    return true;
  }

  /**
   * Helper method to create validation errors from field-specific issues
   */
  static fromFields(fields: Array<{ field: string; message: string; code?: string }>) {
    const message = `Validation failed for ${fields.length} field(s)`;
    return new ValidationError(message, {
      errors: fields,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Authentication Error - when user credentials are invalid
 * Like having a specialized incident report for security issues
 */
export class AuthenticationError extends AppError<AuthErrorDetails> {
  constructor(message: string = 'Authentication failed', details?: AuthErrorDetails) {
    super(message, 401, true, 'AUTHENTICATION_ERROR', details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  /**
   * Auth errors should generally not expose details to prevent security leaks
   */
  protected isDetailsSafe(): boolean {
    return false;
  }
}

/**
 * Authorization Error - when user doesn't have permission
 * Like having a specialized incident report for access control violations
 */
export class AuthorizationError extends AppError<AuthErrorDetails> {
  constructor(message: string = 'Access denied', details?: AuthErrorDetails) {
    super(message, 403, true, 'AUTHORIZATION_ERROR', details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }

  /**
   * Authorization errors should not expose details for security reasons
   */
  protected isDetailsSafe(): boolean {
    return false;
  }
}

/**
 * Not Found Error - when requested resource doesn't exist
 * Like having a specialized incident report for missing resources
 */
export class NotFoundError extends AppError<BusinessErrorDetails> {
  constructor(message: string = 'Resource not found', details?: BusinessErrorDetails) {
    super(message, 404, true, 'NOT_FOUND_ERROR', details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  /**
   * Not found errors can generally expose basic details
   */
  protected isDetailsSafe(): boolean {
    return true;
  }
}

/**
 * Conflict Error - when request conflicts with current state
 * Like having a specialized incident report for business rule violations
 */
export class ConflictError extends AppError<BusinessErrorDetails> {
  constructor(message: string = 'Resource conflict', details?: BusinessErrorDetails) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }

  /**
   * Conflict errors can expose details to help users understand the issue
   */
  protected isDetailsSafe(): boolean {
    return true;
  }
}

/**
 * Rate Limit Error - when user exceeds request limits
 * Like having a specialized incident report for usage violations
 */
export class RateLimitError extends AppError<RateLimitErrorDetails> {
  constructor(message: string = 'Too many requests', details?: RateLimitErrorDetails) {
    super(message, 429, true, 'RATE_LIMIT_ERROR', details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  /**
   * Rate limit errors should expose details to help users understand limits
   */
  protected isDetailsSafe(): boolean {
    return true;
  }

  /**
   * Helper method to create rate limit errors with standard details
   */
  static withRetryAfter(retryAfterSeconds: number, details?: Partial<RateLimitErrorDetails>) {
    return new RateLimitError('Rate limit exceeded', {
      retryAfter: retryAfterSeconds,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}

/**
 * Database Error - when database operations fail
 * Like having a specialized incident report for database issues
 */
export class DatabaseError extends AppError<DatabaseErrorDetails> {
  constructor(message: string = 'Database operation failed', details?: DatabaseErrorDetails) {
    super(message, 500, true, 'DATABASE_ERROR', details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  /**
   * Database errors should not expose internal details in production
   */
  protected isDetailsSafe(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}

/**
 * Utility functions for working with errors
 */

/**
 * Type guard to check if an error is operational (expected) vs programming error
 */
export function isOperationalError(error: Error): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Helper to create standardized error responses for APIs
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return error.toAPIResponse();
  }
  
  // For unknown errors, return a generic response
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper to safely extract error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}