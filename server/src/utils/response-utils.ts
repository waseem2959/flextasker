/**
 * Response Utilities
 * 
 * This module provides standardized response handling for API endpoints.
 * It ensures consistent response formats across the application.
 */

import { Response } from 'express';
import { logger } from './logger';

// Response type definitions
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: ErrorDetail[];
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;              // Primary field name (matches client)
  totalItems: number;         // Keep for backward compatibility
  totalPages: number;
  hasNext: boolean;           // Primary field names (matches client)
  hasPrev: boolean;
  hasNextPage: boolean;       // Keep for backward compatibility
  hasPreviousPage?: boolean;  // Alternative for backward compatibility
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Send a success response
 * 
 * @param res Express response object
 * @param data Data to include in the response
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message
  };
  
  logger.debug(`API Success Response [${statusCode}]`, { 
    path: res.req?.originalUrl,
    method: res.req?.method,
    statusCode
  });
  
  res.status(statusCode).json(response);
}

/**
 * Send a paginated success response
 * 
 * @param res Express response object
 * @param data Data to include in the response
 * @param pagination Pagination information
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 */
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T,
  pagination: PaginationInfo,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    pagination,
    message
  };
  
  logger.debug(`API Paginated Response [${statusCode}]`, { 
    path: res.req?.originalUrl,
    method: res.req?.method,
    statusCode,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: pagination.totalItems
    }
  });
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 * 
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 * @param code Optional error code
 * @param details Optional error details
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: ErrorDetail[]
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      code,
      details
    }
  };
  
  logger.error(`API Error Response [${statusCode}]`, { 
    path: res.req?.originalUrl,
    method: res.req?.method,
    statusCode,
    errorMessage: message,
    errorCode: code
  });
  
  res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 * 
 * @param res Express response object
 * @param errors Validation errors
 * @param message Optional error message
 */
export function sendValidationError(
  res: Response,
  errors: Record<string, string>,
  message: string = 'Validation failed'
): void {
  const details: ErrorDetail[] = Object.entries(errors).map(([field, message]) => ({
    field,
    message
  }));
  
  sendError(res, message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Send a not found error response
 * 
 * @param res Express response object
 * @param message Optional error message
 * @param resource Optional resource name
 */
export function sendNotFoundError(
  res: Response,
  message: string = 'Resource not found',
  resource?: string
): void {
  const code = resource ? `${resource.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND';
  sendError(res, message, 404, code);
}

/**
 * Send an unauthorized error response
 * 
 * @param res Express response object
 * @param message Optional error message
 */
export function sendUnauthorizedError(
  res: Response,
  message: string = 'Unauthorized access'
): void {
  sendError(res, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a forbidden error response
 * 
 * @param res Express response object
 * @param message Optional error message
 */
export function sendForbiddenError(
  res: Response,
  message: string = 'Access forbidden'
): void {
  sendError(res, message, 403, 'FORBIDDEN');
}

/**
 * Send a conflict error response
 * 
 * @param res Express response object
 * @param message Optional error message
 * @param resource Optional resource name
 */
export function sendConflictError(
  res: Response,
  message: string = 'Resource conflict',
  resource?: string
): void {
  const code = resource ? `${resource.toUpperCase()}_CONFLICT` : 'CONFLICT';
  sendError(res, message, 409, code);
}

/**
 * Create pagination information
 * 
 * @param page Current page number
 * @param limit Items per page
 * @param totalItems Total number of items
 * @returns Pagination information
 */
export function createPagination(
  page: number,
  limit: number,
  totalItems: number
): PaginationInfo {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total: totalItems,           // Primary field name
    totalItems,                  // Backward compatibility
    totalPages,
    hasNext,                     // Primary field names
    hasPrev,
    hasNextPage: hasNext,        // Backward compatibility
    hasPreviousPage: hasPrev     // Alternative naming
  };
}

// Default export for backward compatibility
export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFoundError,
  sendUnauthorizedError,
  sendForbiddenError,
  sendConflictError,
  sendPaginatedSuccess,
  createPagination
};
