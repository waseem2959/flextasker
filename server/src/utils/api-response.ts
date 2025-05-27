/**
 * API Response Utilities
 * 
 * This module provides standardized response formats for API endpoints.
 * It ensures consistent response structure across the application.
 */

import { Response } from 'express';
import { ErrorType, HttpStatusCode } from '../../../shared/types/errors';
import { logger } from './logger';

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    [key: string]: any;
  };
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
}

/**
 * Send a standardized success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatusCode.OK,
  meta?: Record<string, any>
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 */
export function sendError(
  res: Response,
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: Record<string, any>;
  },
  statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR
): Response {
  // Log client errors at info level, server errors at error level
  if (statusCode >= 500) {
    logger.error('API error response', { error, statusCode });
  } else {
    logger.info('API client error response', { error, statusCode });
  }
  
  const response: ApiErrorResponse = {
    success: false,
    error
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Send a standardized validation error response
 */
export function sendValidationError(
  res: Response,
  message: string = 'Validation failed',
  details: Record<string, any> = {}
): Response {
  return sendError(
    res,
    {
      type: ErrorType.VALIDATION,
      message,
      details
    },
    HttpStatusCode.BAD_REQUEST
  );
}

/**
 * Send a standardized not found error response
 */
export function sendNotFoundError(
  res: Response,
  message: string = 'Resource not found',
  details?: Record<string, any>
): Response {
  return sendError(
    res,
    {
      type: ErrorType.NOT_FOUND,
      message,
      details
    },
    HttpStatusCode.NOT_FOUND
  );
}

/**
 * Send a standardized unauthorized error response
 */
export function sendUnauthorizedError(
  res: Response,
  message: string = 'Unauthorized access',
  details?: Record<string, any>
): Response {
  return sendError(
    res,
    {
      type: ErrorType.AUTHENTICATION,
      message,
      details
    },
    HttpStatusCode.UNAUTHORIZED
  );
}

/**
 * Send a standardized forbidden error response
 */
export function sendForbiddenError(
  res: Response,
  message: string = 'Access forbidden',
  details?: Record<string, any>
): Response {
  return sendError(
    res,
    {
      type: ErrorType.AUTHORIZATION,
      message,
      details
    },
    HttpStatusCode.FORBIDDEN
  );
}

/**
 * Send a standardized conflict error response
 */
export function sendConflictError(
  res: Response,
  message: string = 'Resource conflict',
  details?: Record<string, any>
): Response {
  return sendError(
    res,
    {
      type: ErrorType.CONFLICT,
      message,
      details
    },
    HttpStatusCode.CONFLICT
  );
}

/**
 * Send a paginated success response
 */
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  additionalMeta?: Record<string, any>
): Response {
  const totalPages = Math.ceil(total / limit);
  
  return sendSuccess(
    res,
    data,
    message,
    HttpStatusCode.OK,
    {
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      ...additionalMeta
    }
  );
}
