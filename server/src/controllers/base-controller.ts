/**
 * Base Controller
 * 
 * Abstract base controller that provides common functionality for all controllers.
 * This helps maintain consistent patterns across the application and reduces code duplication.
 * 
 * Enhanced with standardized parameter parsing, error handling, and response formatting.
 */

import { NextFunction, Request, Response } from 'express';
import { ErrorType } from '../utils/error-utils';
import {
    extractPaginationParams,
    PaginationParams
} from '../utils/pagination';
import { sendError, sendSuccess } from '../utils/response-utils';

// Re-export pagination types for backward compatibility
import type { SortParams } from '../utils/pagination';
export type { PaginationParams, SortParams } from '../utils/pagination';
export type SortingParams = SortParams;

export abstract class BaseController {
  /**
   * Handle async route handlers with proper error catching
   * @param fn The async route handler function
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }
  
  /**
   * Parse pagination parameters from request with validation
   * @param req Express request object
   * @param defaultPage Default page number (deprecated - use pagination.ts defaults)
   * @param defaultLimit Default limit per page (deprecated - use pagination.ts defaults)
   * @param maxLimit Maximum allowed limit (deprecated - use pagination.ts validation)
   */
  protected getPaginationParams(
    req: Request,
    _defaultPage: number = 1,
    _defaultLimit: number = 10,
    maxLimit: number = 50
  ): PaginationParams {
    // Use the comprehensive pagination utilities
    const params = extractPaginationParams(req);

    // Apply max limit constraint for backward compatibility
    if (params.limit > maxLimit) {
      params.limit = maxLimit;
    }

    return {
      page: params.page,
      limit: params.limit,
      skip: params.skip
    };
  }
  
  /**
   * Parse sorting parameters from request with validation
   * @param req Express request object
   * @param allowedFields Array of allowed sort fields
   * @param defaultSortBy Default field to sort by
   * @param defaultSortDir Default sort direction
   */
  protected getSortingParams(
    req: Request,
    allowedFields: string[],
    defaultSortBy: string = 'createdAt',
    _defaultSortDir: 'asc' | 'desc' = 'desc'
  ): SortingParams {
    // Use the comprehensive sort utilities
    const { extractSortParams } = require('../utils/pagination');
    const params = extractSortParams(req, defaultSortBy);

    // Validate sort field against allowed fields
    const validSortBy = params.sortBy && allowedFields.includes(params.sortBy)
      ? params.sortBy
      : defaultSortBy;

    return {
      sortBy: validSortBy,
      sortDir: params.sortDir.toLowerCase() as 'asc' | 'desc'
    };
  }
  
  /**
   * Parse a numeric parameter from request
   * @param value Parameter value to parse
   * @param defaultValue Default value if parsing fails
   */
  protected parseNumeric(
    value: any,
    defaultValue?: number
  ): number | undefined {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    const parsed = Number(value);
    
    if (isNaN(parsed)) {
      return defaultValue;
    }
    
    return parsed;
  }

  /**
   * Send a successful response with standardized format
   * @param res Express response object
   * @param data Data to send
   * @param message Success message
   * @param statusCode HTTP status code
   */
  protected sendSuccess(
    res: Response, 
    data: any = null, 
    message: string = 'Success', 
    statusCode: number = 200
  ): void {
    sendSuccess(res, data, message, statusCode);
  }

  /**
   * Send an error response with standardized format
   * @param res Express response object
   * @param message Error message
   * @param statusCode HTTP status code
   * @param errorType Error type for client-side handling
   * @param errors Additional error details
   */
  protected sendError(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errorType: ErrorType = ErrorType.SERVER,
    errors?: any
  ): void {
    sendError(res, message, statusCode, errorType, errors);
  }

  /**
   * Build pagination metadata for response
   * @param total Total number of items
   * @param page Current page
   * @param limit Items per page
   */
  protected buildPaginationMeta(total: number, page: number, limit: number) {
    // Use the comprehensive pagination utilities
    const { createPaginationMeta } = require('../utils/pagination');
    return createPaginationMeta(total, page, limit);
  }
}
