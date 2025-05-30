/**
 * Base Controller
 * 
 * Abstract base controller that provides common functionality for all controllers.
 * This helps maintain consistent patterns across the application and reduces code duplication.
 * 
 * Enhanced with standardized parameter parsing, error handling, and response formatting.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response-utils';
import { ErrorType } from '../../../shared/types/errors';

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Interface for sorting parameters
 */
export interface SortingParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export abstract class BaseController {
  /**
   * Handle async route handlers with proper error catching
   * @param fn The async route handler function
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
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
   * @param defaultPage Default page number
   * @param defaultLimit Default limit per page
   * @param maxLimit Maximum allowed limit
   */
  protected getPaginationParams(
    req: Request,
    defaultPage: number = 1,
    defaultLimit: number = 10,
    maxLimit: number = 50
  ): PaginationParams {
    const page = this.parseNumeric(req.query.page, defaultPage) ?? defaultPage;
    const limit = Math.min(
      this.parseNumeric(req.query.limit, defaultLimit) ?? defaultLimit,
      maxLimit
    );
    
    return {
      page,
      limit,
      offset: (page - 1) * limit
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
    defaultSortDir: 'asc' | 'desc' = 'desc'
  ): SortingParams {
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';
    
    // Validate sort field
    const validSortBy = sortBy && allowedFields.includes(sortBy)
      ? sortBy
      : defaultSortBy;
    
    // Validate sort direction
    const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc'
      ? sortOrder
      : defaultSortDir;
    
    return {
      sortBy: validSortBy,
      sortOrder: validSortOrder
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
  ) {
    return sendSuccess(res, data, message, statusCode);
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
  ) {
    return sendError(res, message, statusCode, errorType, errors);
  }

  /**
   * Build pagination metadata for response
   * @param total Total number of items
   * @param page Current page
   * @param limit Items per page
   */
  protected buildPaginationMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    };
  }
}
