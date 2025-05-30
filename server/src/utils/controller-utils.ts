/**
 * Controller Utilities
 * 
 * This module provides shared utilities for controllers to standardize:
 * - Request parameter parsing and validation
 * - Error handling patterns
 * - Response formatting
 * - Common controller operations
 */

import { Request } from 'express';
import { z } from 'zod';
import { logger } from './logger';
import { ErrorType } from '../../../shared/types/errors';

// Type definitions for common query parameters
export interface PaginationParams {
  page: number;
  limit: number;
  totalItems?: number;
}

export interface SortingParams {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

/**
 * Parses pagination parameters from request query with validation
 * 
 * @param req Express request object
 * @param defaultPage Default page number if not provided or invalid
 * @param defaultLimit Default limit if not provided or invalid
 * @param maxLimit Maximum allowed limit to prevent excessive requests
 * @returns Validated pagination parameters
 */
export function parsePaginationParams(
  req: Request,
  defaultPage: number = 1,
  defaultLimit: number = 10,
  maxLimit: number = 50
): PaginationParams {
  // Create a schema for pagination parameters
  const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(defaultPage),
    limit: z.coerce.number().int().positive().max(maxLimit).default(defaultLimit)
  });
  
  // Parse and validate query parameters
  const result = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit
  });
  
  // Return validated result or defaults on error
  if (result.success) {
    return result.data;
  } else {
    logger.warn('Invalid pagination parameters', { 
      error: result.error.format(),
      params: { page: req.query.page, limit: req.query.limit }
    });
    return { page: defaultPage, limit: defaultLimit };
  }
}

/**
 * Parses sorting parameters from request query
 * 
 * @param req Express request object
 * @param allowedFields Array of allowed sort fields to prevent injection
 * @param defaultSortBy Default field to sort by
 * @param defaultSortDir Default sort direction
 * @returns Validated sorting parameters
 */
export function parseSortingParams(
  req: Request,
  allowedFields: string[],
  defaultSortBy: string = 'createdAt',
  defaultSortDir: 'asc' | 'desc' = 'desc'
): SortingParams {
  // Create schema for sorting parameters
  const sortingSchema = z.object({
    sortBy: z.string().refine(val => allowedFields.includes(val), {
      message: `Sort field must be one of: ${allowedFields.join(', ')}`
    }).default(defaultSortBy),
    sortDir: z.enum(['asc', 'desc']).default(defaultSortDir)
  });
  
  // Parse and validate query parameters
  const result = sortingSchema.safeParse({
    sortBy: req.query.sortBy,
    sortDir: req.query.sortDir
  });
  
  // Return validated result or defaults on error
  if (result.success) {
    return result.data;
  } else {
    logger.warn('Invalid sorting parameters', { 
      error: result.error.format(),
      params: { sortBy: req.query.sortBy, sortDir: req.query.sortDir }
    });
    return { sortBy: defaultSortBy, sortDir: defaultSortDir };
  }
}

/**
 * Builds and returns a standardized error object
 * 
 * @param type Error type from shared enums
 * @param message User-friendly error message
 * @param details Optional error details for debugging
 * @returns Standardized error object
 */
export function createError(
  type: ErrorType = ErrorType.SERVER,
  message: string = 'An unexpected error occurred',
  details?: any
) {
  return {
    type,
    message,
    details
  };
}

/**
 * Safely parses a numeric parameter from request
 * 
 * @param value Parameter value to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed number or default value
 */
export function parseNumericParam(
  value: any,
  defaultValue?: number
): number | undefined {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Builds pagination metadata for response
 * 
 * @param page Current page number
 * @param limit Items per page
 * @param totalItems Total number of items
 * @returns Pagination metadata object
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: page < Math.ceil(totalItems / limit),
    hasPreviousPage: page > 1
  };
}

/**
 * Transforms query parameters into an object with appropriate types
 * 
 * @param query Express request query object
 * @param schema Zod schema for validation
 * @returns Validated and transformed query parameters
 */
export function parseQueryParams<T>(
  query: Request['query'],
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(query);
  
  if (result.success) {
    return result.data;
  } else {
    logger.warn('Invalid query parameters', { error: result.error.format() });
    throw createError(ErrorType.VALIDATION, 'Invalid query parameters');
  }
}
