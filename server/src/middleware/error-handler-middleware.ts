/**
 * Error Handler Middleware
 * 
 * This middleware provides comprehensive error handling for the application.
 * It catches all errors thrown in route handlers, formats them appropriately,
 * and sends standardized error responses to clients.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError, ErrorDetail } from '../utils/response-utils';
import { ErrorType } from '../../../shared/types/errors';

// Type definitions for error handling
interface ValidationError extends Error {
  details: Array<{
    field?: string;
    message: string;
    type?: string;
    value?: unknown;
  }>;
  statusCode?: number;
  code?: string;
  type?: string;
  path?: string | string[];
  value?: unknown;
}

interface JWTError extends Error {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | 'NotBeforeError';
  message: string;
  expiredAt?: Date;
}

interface PrismaError extends Error {
  code: string;
  meta?: Record<string, unknown>;
  clientVersion?: string;
  batchRequestIdx?: number;
}

interface MulterError extends Error {
  code: string;
  field?: string;
}

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Type guards
function isJWTError(error: unknown): error is JWTError {
  return (
    error instanceof Error &&
    'name' in error &&
    ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(
      (error as JWTError).name
    )
  );
}

function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof Error &&
    'details' in error &&
    Array.isArray((error as ValidationError).details)
  );
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string' &&
    (error as PrismaError).code.startsWith('P')
  );
}

function isMulterError(error: unknown): error is MulterError {
  return (
    error instanceof Error &&
    'code' in error &&
    [
      'LIMIT_FILE_SIZE',
      'LIMIT_FIELD_VALUE',
      'LIMIT_FIELD_KEY',
      'LIMIT_FIELD_COUNT',
      'LIMIT_UNEXPECTED_FILE'
    ].includes((error as MulterError).code)
  );
}

/**
 * Error handling middleware
 * 
 * When something goes wrong anywhere in our app, this middleware catches it,
 * logs the details for debugging, and sends a proper response to the user.
 */
export function errorHandler(
  error: Error,
  _req: Request, 
  res: Response,
  _next: NextFunction 
): void | Response {
  // Log error details
  logger.error('Error details:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    path: _req.path,
    method: _req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (isPrismaError(error)) {
    return handlePrismaError(res, error);
  }

  if (isMulterError(error)) {
    return handleMulterError(res, error);
  }

  if (isJWTError(error)) {
    return handleJWTError(res, error);
  }

  if (isValidationError(error)) {
    return handleValidationError(res, error);
  }

  return handleUnexpectedError(res, error);
}

/**
 * Handles application-specific errors with custom status codes and messages.
 * @param res - Express Response object
 * @param error - Error object with status code and message
 * @returns Formatted error response
 */
export function handleAppError(
  res: Response, 
  error: { statusCode?: number; message: string; code?: string }
): Response {
  return sendError(
    res,
    error.message || 'An error occurred',
    error.statusCode ?? 500,
    error.code ?? 'INTERNAL_SERVER_ERROR'
  );
}

/**
 * Handle Prisma database errors with specific messages for each error code.
 * This keeps our database implementation details hidden from the user.
 */
function handlePrismaError(res: Response, error: PrismaError): Response {
  logger.error('Database error:', error);
  
  // Handle specific Prisma error codes
  switch (error.code) {
    case 'P2002':
      return sendError(res, 'A unique constraint was violated', 409, 'CONFLICT');
    case 'P2025':
      return sendError(res, 'The requested record was not found', 404, 'NOT_FOUND');
    case 'P2003':
      return sendError(res, 'Foreign key constraint failed', 400, 'BAD_REQUEST');
    case 'P2016':
      return sendError(res, 'Query interpretation error', 400, 'BAD_REQUEST');
    default:
      return sendError(res, 'A database error occurred', 500, 'DATABASE_ERROR');
  }
}

/**
 * Handle validation errors by passing along the validation details.
 * This helps frontend developers know exactly which fields have issues.
 */
/**
 * Processes and formats validation errors for consistent API responses.
 */
function handleValidationError(res: Response, error: ValidationError): Response {
  const details = extractErrorDetails(error);
  const validDetails = filterValidDetails(details);
  
  return sendError(
    res, 
    error.message || 'Validation failed', 
    error.statusCode ?? 400, 
    error.code ?? 'VALIDATION_ERROR', 
    validDetails
  );
}

/**
 * Extracts error details from a validation error.
 */
function extractErrorDetails(error: ValidationError): ErrorDetail[] {
  if (!Array.isArray(error.details)) {
    return [{ message: error.message || 'Validation failed' }];
  }

  return error.details.map(detail => {
    if (typeof detail === 'string') {
      return { message: detail };
    }
    
    return {
      message: typeof detail.message === 'string' ? detail.message : 'Validation error',
      field: detail.field ? String(detail.field) : undefined
    };
  });
}

/**
 * Filters and validates error details to ensure they match the ErrorDetail type.
 */
function filterValidDetails(details: ErrorDetail[]): ErrorDetail[] {
  return details.filter((d): d is ErrorDetail => 
    !!d && typeof d === 'object' && 'message' in d
  );
}

/**
 * Handle JWT authentication errors with appropriate messages.
 * Each JWT error type gets a specific, user-friendly message.
 */
function handleJWTError(res: Response, error: JWTError): Response {
  const message = (() => {
    switch (error.name) {
      case 'TokenExpiredError':
        return 'Your session has expired. Please log in again.';
      case 'JsonWebTokenError':
      case 'NotBeforeError':
        return 'Invalid authentication token';
      default:
        return 'Authentication failed';
    }
  })();
  
  return sendError(res, message, 401, ErrorType.AUTHENTICATION);
}

/**
 * Handle Multer file upload errors with specific messages for each error code.
 * This provides clear feedback about what went wrong with file uploads.
 */
function handleMulterError(res: Response, error: { code: string; field?: string }): Response {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return sendError(res, 'File size is too large', 413, 'FILE_TOO_LARGE');
    case 'LIMIT_FIELD_VALUE':
    case 'LIMIT_FIELD_KEY':
      return sendError(res, 'Invalid field in form data', 400, 'VALIDATION_ERROR');
    case 'LIMIT_FIELD_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return sendError(res, 'Too many files uploaded', 400, 'VALIDATION_ERROR');
    default:
      return sendError(
        res,
        'An error occurred while processing your upload',
        500,
        'SERVER_ERROR'
      );
  }
}

/**
 * Handle unexpected errors - these might be bugs in our code.
 * In production, we hide the details to avoid exposing sensitive information.
 */
function handleUnexpectedError(res: Response, error: Error): Response {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment
    ? `Unexpected error: ${error.message}`
    : 'An unexpected error occurred';
    
  logger.error('Unexpected error:', error);
  
  return sendError(res, message, 500, 'UNKNOWN_ERROR');
}

/**
 * Async error wrapper - use this to wrap async route handlers
 * to ensure errors are properly caught and passed to the error handler.
 * 
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDatabase();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
