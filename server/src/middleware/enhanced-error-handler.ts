/**
 * Enhanced Error Handler Middleware
 * 
 * This middleware provides standardized error handling across the application,
 * using the shared error types to ensure consistency between frontend and backend.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  isAppError, 
  AppError, 
  ValidationError,
  createErrorResponse
} from '@/utils/enhanced-errors';
import { logger } from '@/utils/logger';
import { ErrorType, HttpStatusCode } from '../../../shared/types/errors';

// Error type definitions for various libraries
interface PrismaError extends Error {
  code: string;
  clientVersion?: string;
  meta?: Record<string, unknown>;
}

interface JWTError extends Error {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
  expiredAt?: Date;
}

interface MulterError extends Error {
  code: string;
  field?: string;
}

// Type guards
function isPrismaError(error: Error): error is PrismaError {
  return 'code' in error && 
    (error.name === 'PrismaClientKnownRequestError' || 
     error.name === 'PrismaClientValidationError');
}

function isJWTError(error: Error): error is JWTError {
  return error.name === 'JsonWebTokenError' || 
         error.name === 'TokenExpiredError' || 
         error.name === 'NotBeforeError';
}

function isMulterError(error: Error): error is MulterError {
  return error.name === 'MulterError' && 'code' in error;
}

/**
 * Enhanced error handling middleware with improved logging and standardized responses
 */
export function enhancedErrorHandler(
  error: Error,
  req: Request, 
  res: Response,
  _next: NextFunction
): void {
  // Log error details
  logErrorDetails(error, req);
  
  // Handle different types of errors
  if (isAppError(error)) {
    // Our own AppError types
    return sendErrorResponse(res, error);
  } else if (isPrismaError(error)) {
    // Database errors
    return handlePrismaError(res, error);
  } else if (isJWTError(error)) {
    // Authentication errors
    return handleJWTError(res, error);
  } else if (isMulterError(error)) {
    // File upload errors
    return handleMulterError(res, error);
  } else {
    // Unexpected errors
    return handleUnexpectedError(res, error);
  }
}

/**
 * Logs detailed error information for debugging
 */
function logErrorDetails(error: Error, req: Request): void {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    path: req.path,
    method: req.method,
    requestId: req.id,
    userId: req.user?.id,
    ...(isAppError(error) && { 
      errorType: error.type,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    }),
    ...(isPrismaError(error) && { 
      prismaCode: (error as PrismaError).code,
      prismaMeta: (error as PrismaError).meta
    })
  };
  
  // Log operational errors as warnings, programming errors as errors
  if (isAppError(error) && error.isOperational) {
    logger.warn('Operational error occurred', errorDetails);
  } else {
    logger.error('Error occurred', errorDetails);
  }
}

/**
 * Sends standardized error response
 */
function sendErrorResponse(res: Response, error: AppError): void {
  const errorResponse = createErrorResponse(error);
  res.status(error.statusCode).json(errorResponse);
}

/**
 * Handles Prisma database errors
 */
function handlePrismaError(res: Response, error: PrismaError): void {
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let message = 'Database operation failed';
  let errorType = ErrorType.DATABASE;
  
  // Map Prisma error codes to appropriate status codes and messages
  if (error.code === 'P2002') {
    statusCode = HttpStatusCode.CONFLICT;
    message = 'A record with this information already exists';
    errorType = ErrorType.CONFLICT;
  } else if (error.code === 'P2025') {
    statusCode = HttpStatusCode.NOT_FOUND;
    message = 'The requested record was not found';
    errorType = ErrorType.NOT_FOUND;
  } else if (error.code.startsWith('P1')) {
    // P1xxx errors are related to the database connection
    statusCode = HttpStatusCode.SERVICE_UNAVAILABLE;
    message = 'Database service is currently unavailable';
  }
  
  const appError = new AppError(message, errorType, statusCode);
  sendErrorResponse(res, appError);
}

/**
 * Handles JWT authentication errors
 */
function handleJWTError(res: Response, error: JWTError): void {
  let message = 'Authentication failed';
  
  if (error.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again';
  } else if (error.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
  } else if (error.name === 'NotBeforeError') {
    message = 'Token not yet valid';
  }
  
  const appError = new AppError(message, ErrorType.AUTHENTICATION, HttpStatusCode.UNAUTHORIZED);
  sendErrorResponse(res, appError);
}

/**
 * Handles Multer file upload errors
 */
function handleMulterError(res: Response, error: MulterError): void {
  let message = 'File upload failed';
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File is too large';
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files uploaded';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = `Unexpected file field: ${error.field}`;
  } else if (error.code === 'LIMIT_FIELD_KEY') {
    message = 'Field name is too long';
  } else if (error.code === 'LIMIT_FIELD_VALUE') {
    message = 'Field value is too long';
  } else if (error.code === 'LIMIT_FIELD_COUNT') {
    message = 'Too many fields';
  } else if (error.code === 'LIMIT_PART_COUNT') {
    message = 'Too many parts';
  }
  
  const appError = new AppError(message, ErrorType.VALIDATION, HttpStatusCode.BAD_REQUEST);
  sendErrorResponse(res, appError);
}

/**
 * Handles unexpected errors (likely programming errors)
 */
function handleUnexpectedError(res: Response, error: Error): void {
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : error.message || 'Unknown error';
    
  const appError = new AppError(message, ErrorType.SERVER, HttpStatusCode.INTERNAL_SERVER_ERROR, false);
  sendErrorResponse(res, appError);
}
