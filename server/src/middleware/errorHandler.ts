import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { sendError } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

/**
 * Type definitions for various error types we might encounter.
 * Think of these as detailed shipping labels that tell us exactly
 * what kind of error package we're dealing with.
 */

// Prisma errors have a specific structure
interface PrismaError extends Error {
  code: string;
  clientVersion?: string;
  meta?: Record<string, unknown>;
}

// Validation errors from express-validator or similar libraries
interface ValidationError extends Error {
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Multer file upload errors
interface MulterError extends Error {
  code: string;
  field?: string;
}

// JWT errors from jsonwebtoken library
interface JWTError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
  expiredAt?: Date;
}

/**
 * Type guard functions - these are like quality inspectors that verify
 * what type of error we're dealing with before we handle it.
 */

// Check if an error is from Prisma
function isPrismaError(error: Error): error is PrismaError {
  return error.name === 'PrismaClientKnownRequestError' && 'code' in error;
}

// Check if an error has validation details
function isValidationError(error: Error): error is ValidationError {
  return error.name === 'ValidationError' && 'details' in error;
}

// Check if an error is from Multer
function isMulterError(error: Error): error is MulterError {
  return 'code' in error && (
    error.code === 'LIMIT_FILE_SIZE' || 
    error.code === 'LIMIT_FILE_COUNT' ||
    error.code === 'LIMIT_UNEXPECTED_FILE'
  );
}

// Check if an error is from JWT
function isJWTError(error: Error): error is JWTError {
  return error.name === 'JsonWebTokenError' || 
         error.name === 'TokenExpiredError' ||
         error.name === 'NotBeforeError';
}

/**
 * Type definition for Express async handler functions.
 * This tells TypeScript exactly what shape our route handlers have,
 * making it much safer than using the generic Function type.
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Error handling middleware - this is like having a skilled problem-solver who
 * knows how to handle different types of issues that might arise in our application.
 * 
 * When something goes wrong anywhere in our app, this middleware catches it,
 * logs the details for debugging, and sends a proper response to the user.
 */
export const errorHandler = (
  error: Error,
  req: Request, 
  res: Response,
  _next: NextFunction // Prefixed with underscore to indicate it's intentionally unused
): void => {
  // Log the error with full context for debugging
  logErrorDetails(error, req);

  // Handle different types of errors appropriately
  if (error instanceof AppError) {
    handleAppError(res, error);
    return;
  }

  // Check each error type using our handler functions
  if (isPrismaError(error)) {
    handlePrismaError(res, error);
    return;
  }

  if (isValidationError(error)) {
    handleValidationError(res, error);
    return;
  }

  if (isJWTError(error)) {
    handleJWTError(res, error);
    return;
  }

  if (isMulterError(error)) {
    handleMulterError(res, error);
    return;
  }

  // Handle any unexpected errors
  handleUnexpectedError(res, error);
};

/**
 * Helper function to log error details.
 * Extracted to reduce complexity in the main handler.
 */
function logErrorDetails(error: Error, req: Request): void {
  logger.error('Error caught by error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle our custom AppError instances.
 * These are errors we throw intentionally with specific status codes.
 */
function handleAppError(res: Response, error: AppError): void {
  sendError(res, error.message, error.statusCode);
}

/**
 * Handle Prisma database errors with specific messages for each error code.
 * This keeps our database implementation details hidden from the user.
 */
function handlePrismaError(res: Response, error: PrismaError): void {
  const errorMessages: Record<string, { message: string; status: number }> = {
    'P2002': { message: 'This record already exists', status: 409 },
    'P2025': { message: 'The requested record was not found', status: 404 },
    'P2003': { message: 'This operation violates data integrity constraints', status: 400 },
  };

  const errorInfo = errorMessages[error.code];
  
  if (errorInfo) {
    sendError(res, errorInfo.message, errorInfo.status);
  } else {
    logger.error('Unhandled Prisma error:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    sendError(res, 'A database error occurred', 500);
  }
}

/**
 * Handle validation errors by passing along the validation details.
 * This helps frontend developers know exactly which fields have issues.
 */
function handleValidationError(res: Response, error: ValidationError): void {
  sendError(res, 'Invalid input data', 400, error.details);
}

/**
 * Handle JWT authentication errors with appropriate messages.
 * Each JWT error type gets a specific, user-friendly message.
 */
function handleJWTError(res: Response, error: JWTError): void {
  const jwtErrorMessages: Record<string, string> = {
    'JsonWebTokenError': 'Invalid authentication token',
    'TokenExpiredError': 'Authentication token has expired',
    'NotBeforeError': 'Token not yet valid',
  };

  const message = jwtErrorMessages[error.name] || 'Authentication error';
  sendError(res, message, 401);
}

/**
 * Handle Multer file upload errors with specific messages for each error code.
 * This provides clear feedback about what went wrong with file uploads.
 */
function handleMulterError(res: Response, error: MulterError): void {
  const multerErrorMessages: Record<string, string> = {
    'LIMIT_FILE_SIZE': 'File size exceeds the maximum allowed limit',
    'LIMIT_FILE_COUNT': 'Too many files uploaded',
    'LIMIT_UNEXPECTED_FILE': 'Unexpected file field',
  };

  const message = multerErrorMessages[error.code] || 'File upload error';
  sendError(res, message, 400);
}

/**
 * Handle unexpected errors - these might be bugs in our code.
 * In production, we hide the details to avoid exposing sensitive information.
 */
function handleUnexpectedError(res: Response, error: Error): void {
  logger.error('Unhandled error:', error);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : error.message;
    
  sendError(res, message, 500);
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
export const asyncHandler = (fn: AsyncRequestHandler) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};