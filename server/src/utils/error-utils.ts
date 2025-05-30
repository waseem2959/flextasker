/**
 * Error Utilities
 * 
 * This module provides a comprehensive set of error handling utilities:
 * - Standardized error classes for different error types
 * - Global error handling middleware
 * - Helper functions for creating and working with errors
 * - Type definitions for error details
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from './logger';
// Re-export the interfaces from shared types for backward compatibility
export { ErrorType, HttpStatusCode, ValidationErrorDetail } from '../../../shared/types/errors';

// Define error detail interfaces to maintain compatibility with existing code
/**
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
export interface DatabaseErrorDetails extends BaseErrorDetails {
  operation?: string;
  table?: string;
  query?: string;
  params?: Record<string, unknown>;
  errorCode?: string;
  constraint?: string;
  meta?: Record<string, unknown>;
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
  | RateLimitErrorDetails;

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

  // Serializes the error for logging or API responses
  // This method ensures we only expose safe information
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.isDetailsSafe() ? this.details : undefined,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }

  // Creates a sanitized version for API responses
  // This removes sensitive information that shouldn't be exposed to clients
  toAPIResponse() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        details: this.isDetailsSafe() ? this.details : undefined
      }
    };
  }

  // Determines if error details are safe to expose in API responses
  // Override this in subclasses for custom safety logic
  isDetailsSafe(): boolean {
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

  // Validation errors are generally safe to expose to users
  // since they help users correct their input
  isDetailsSafe(): boolean {
    return true;
  }

  // Helper method to create validation errors from field-specific issues
  static fromFields(fields: Array<{ field: string; message: string; code?: string }>) {
    const details: ValidationErrorDetails = {
      errors: fields
    };
    
    // Create a readable message from the field errors
    const message = fields.length === 1
      ? `Validation failed: ${fields[0].message}`
      : `Validation failed: ${fields.length} field(s) have errors`;
      
    return new ValidationError(message, details);
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

  // Auth errors should generally not expose details to prevent security leaks
  isDetailsSafe(): boolean {
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

  // Authorization errors should not expose details for security reasons
  isDetailsSafe(): boolean {
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

  // Not found errors can generally expose basic details
  isDetailsSafe(): boolean {
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

  // Conflict errors can expose details to help users understand the issue
  isDetailsSafe(): boolean {
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

  // Rate limit errors should expose details to help users understand limits
  isDetailsSafe(): boolean {
    return true;
  }

  // Helper method to create rate limit errors with standard details
  static withRetryAfter(retryAfterSeconds: number, details?: Partial<RateLimitErrorDetails>) {
    const fullDetails: RateLimitErrorDetails = {
      ...details,
      retryAfter: retryAfterSeconds
    };
    
    return new RateLimitError(
      `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      fullDetails
    );
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

  // Database errors should not expose internal details in production
  isDetailsSafe(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}

/**
 * Utility functions for working with errors
 */

// Type guard to check if an error is operational (expected) vs programming error
export function isOperationalError(error: Error): error is AppError {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Helper to create standardized error responses for APIs
export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return error.toAPIResponse();
  }
  
  // For unknown errors, create a generic response
  const message = getErrorMessage(error);
  const isDevEnv = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR',
      // Only include stack trace in development
      stack: isDevEnv && error instanceof Error ? error.stack : undefined
    }
  };
}

// Helper to safely extract error message from unknown error types
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Global error handling middleware for Express applications
 * 
 * This middleware catches all errors thrown in route handlers and middleware,
 * formats them appropriately, and sends a standardized response to the client.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log the error for debugging and monitoring
  logger.error('Error caught by global error handler', {
    error: err instanceof Error ? { 
      message: err.message,
      stack: err.stack,
      name: err.name
    } : err,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] || 'unknown'
  });

  // Handle Prisma-specific errors
  if (err instanceof PrismaClientKnownRequestError) {
    // Map Prisma error codes to appropriate application errors
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        err = new ConflictError(
          'A record with this information already exists',
          { 
            businessRule: 'UNIQUE_CONSTRAINT',
            metadata: { fields: err.meta?.target }
          }
        );
        break;
      case 'P2025': // Record not found
        err = new NotFoundError(
          'The requested resource does not exist',
          { entityType: 'USER' }
        );
        break;
      default:
        // For other Prisma errors, create a generic database error
        err = new DatabaseError(
          'Database operation failed',
          { 
            errorCode: err.code,
            operation: err.meta?.modelName as string
          }
        );
    }
  }

  try {
    // If the error is one of our application errors, use its built-in response format
    if (err instanceof AppError) {
      res.status(err.statusCode).json(err.toAPIResponse());
      return;
    }

    // For all other errors, create a generic error response
    const statusCode = 500;
    const errorResponse = createErrorResponse(err);
    
    res.status(statusCode).json(errorResponse);
  } catch (error) {
    // Fallback error response if something goes wrong in the error handler
    logger.error('Error in error handler', { error });
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// Default export for backward compatibility
export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  isOperationalError,
  createErrorResponse,
  getErrorMessage,
  errorHandlerMiddleware
};
