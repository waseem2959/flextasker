import { Response } from 'express';

/**
 * Response utilities provide a consistent way to send responses from our API.
 * This ensures all our endpoints return data in the same format, making it
 * easier for frontend developers to work with our API.
 */

// Define a more specific type for error details
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: unknown;
}

// Define a union type for different kinds of errors we might encounter
export type ApiError = string | ErrorDetail | Record<string, unknown>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  pagination?: PaginationInfo;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Send a successful response
 * 
 * This function now uses proper generic typing without defaulting to 'any'.
 * The generic T represents the specific type of data being returned.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation successful',
  statusCode: number = 200,
  pagination?: PaginationInfo
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.status(statusCode).json(response);
};

/**
 * Send an error response
 * 
 * Now accepts a more specific type for errors instead of 'any[]'.
 * This provides better type safety and IDE support.
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: ApiError[]
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Create pagination info from query parameters
 */
export const createPagination = (
  page: number,
  limit: number,
  total: number
): PaginationInfo => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// Additional utility types for common error scenarios
export interface ValidationErrorDetail extends ErrorDetail {
  field: string;
  code: 'VALIDATION_ERROR';
}

export interface DatabaseErrorDetail extends ErrorDetail {
  code: 'DATABASE_ERROR';
  operation?: string;
}

/**
 * Helper function to create standardized validation error responses
 */
export const sendValidationError = (
  res: Response,
  errors: ValidationErrorDetail[],
  message: string = 'Validation failed'
): void => {
  sendError(res, message, 400, errors);
};

/**
 * Helper function to create standardized not found error responses
 */
export const sendNotFoundError = (
  res: Response,
  resource: string = 'Resource'
): void => {
  sendError(res, `${resource} not found`, 404);
};