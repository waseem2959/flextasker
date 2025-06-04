/**
 * Pagination Utilities
 * 
 * This module provides standardized pagination handling for API endpoints,
 * ensuring consistent behavior across the application.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { z } from 'zod';
import { logger } from './logger';

// Prisma client instance
const prisma = new PrismaClient();

// Pagination parameters schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

// Sort order schema
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

// Combined pagination and sort schema
export const paginationSortSchema = paginationSchema.merge(sortSchema);

// Pagination parameters interface
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// Sort parameters interface
export interface SortParams {
  sortBy?: string;
  sortDir: 'asc' | 'desc' | 'ASC' | 'DESC';
}

// Pagination result interface
export interface PaginationResult<T> {
  items: T[];
  meta: {
    page: number;               // Consistent with client naming
    currentPage: number;        // Keep for backward compatibility
    limit: number;              // Consistent with client naming
    itemsPerPage: number;       // Keep for backward compatibility
    total: number;              // Primary field name (matches client)
    totalItems: number;         // Keep for backward compatibility
    totalPages: number;
    hasNext: boolean;           // Primary field names (matches client)
    hasPrev: boolean;
    hasNextPage: boolean;       // Keep for backward compatibility
    hasPreviousPage: boolean;   // Keep for backward compatibility
  };
}

/**
 * Extract pagination parameters from request
 * 
 * @param req Express request
 * @returns Pagination parameters
 */
export function extractPaginationParams(req: Request): PaginationParams {
  const result = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit
  });
  
  if (!result.success) {
    // Log validation errors but use defaults
    logger.warn('Invalid pagination parameters', { 
      errors: result.error.errors,
      query: req.query 
    });
    
    return {
      page: 1,
      limit: 20,
      skip: 0
    };
  }
  
  const { page, limit } = result.data;
  
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

/**
 * Extract sort parameters from request
 * 
 * @param req Express request
 * @param defaultSortBy Default sort field
 * @returns Sort parameters
 */
export function extractSortParams(req: Request, defaultSortBy?: string): SortParams {
  const result = sortSchema.safeParse({
    sortBy: req.query.sortBy || defaultSortBy,
    sortDir: req.query.sortDir
  });
  
  if (!result.success) {
    // Log validation errors but use defaults
    logger.warn('Invalid sort parameters', { 
      errors: result.error.errors,
      query: req.query 
    });
    
    return {
      sortBy: defaultSortBy,
      sortDir: 'desc'
    };
  }
  
  return result.data;
}

/**
 * Create pagination metadata
 * 
 * @param totalItems Total number of items
 * @param page Current page number
 * @param limit Items per page
 * @returns Pagination metadata
 */
export function createPaginationMeta(totalItems: number, page: number, limit: number) {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,                       // Primary field names (matches client)
    currentPage: page,          // Keep for backward compatibility
    limit,                      // Primary field names (matches client)
    itemsPerPage: limit,        // Keep for backward compatibility
    total: totalItems,          // Primary field name (matches client)
    totalItems,                 // Keep for backward compatibility
    totalPages,
    hasNext,                    // Primary field names (matches client)
    hasPrev,
    hasNextPage: hasNext,       // Keep for backward compatibility
    hasPreviousPage: hasPrev    // Keep for backward compatibility
  };
}

/**
 * Create a paginated result
 * 
 * @param items Array of items for the current page
 * @param totalItems Total number of items across all pages
 * @param page Current page number
 * @param limit Items per page
 * @returns Paginated result object
 */
export function createPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return {
    items,
    meta: createPaginationMeta(totalItems, page, limit)
  };
}

/**
 * Generate pagination links
 * 
 * @param baseUrl Base URL for the links
 * @param page Current page number
 * @param limit Items per page
 * @param totalPages Total number of pages
 * @returns Object with pagination links
 */
export function generatePaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  totalPages: number
) {
  const url = new URL(baseUrl);
  
  // Set limit parameter
  url.searchParams.set('limit', String(limit));
  
  // Create links
  const links: Record<string, string> = {};
  
  // First page
  url.searchParams.set('page', '1');
  links.first = url.toString();
  
  // Last page
  url.searchParams.set('page', String(totalPages));
  links.last = url.toString();
  
  // Previous page
  if (page > 1) {
    url.searchParams.set('page', String(page - 1));
    links.prev = url.toString();
  }
  
  // Next page
  if (page < totalPages) {
    url.searchParams.set('page', String(page + 1));
    links.next = url.toString();
  }
  
  return links;
}

// Type for Prisma model with required operations
type PrismaModel = {
  count: (args: any) => Promise<number>;
  findMany: (args: any) => Promise<any[]>;
};

/**
 * Execute a paginated query with Prisma
 * 
 * @param model Prisma model name
 * @param params Query parameters
 * @returns Paginated result
 */
export async function paginatedQuery<T>(
  model: string,
  params: {
    page: number;
    limit: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }
): Promise<PaginationResult<T>> {
  const { page, limit, where, orderBy, include, select } = params;
  const skip = (page - 1) * limit;
  
  try {
    const prismaModel = prisma[model as keyof typeof prisma] as unknown as PrismaModel;

    if (!prismaModel || typeof prismaModel.count !== 'function' || typeof prismaModel.findMany !== 'function') {
      throw new Error(`Model ${model} does not support required operations`);
    }

    // Use Promise.all to run both queries in parallel
    const [totalItems, items] = await Promise.all([
      // Count query
      prismaModel.count({ where }),
      
      // Data query
      prismaModel.findMany({
        where,
        orderBy,
        include,
        select,
        skip,
        take: limit
      })
    ]);
    
    return createPaginatedResult<T>(items, totalItems, page, limit);
  } catch (error) {
    logger.error(`Error executing paginated query on ${model}`, { error });
    throw error;
  }
}

/**
 * Create a cursor-based pagination handler for large datasets
 * 
 * @param model Prisma model name
 * @param cursorField Field to use as cursor (usually 'id')
 * @returns Function to get paginated data
 */
export function createCursorPagination<T>(
  model: string,
  cursorField: string = 'id'
) {
  return async (params: {
    limit: number;
    cursor?: string;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }): Promise<{
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }> => {
    const { limit, cursor, where, orderBy, include, select } = params;
    
    try {
      // Build query parameters
      const queryParams: any = {
        where,
        orderBy,
        include,
        select,
        take: limit + 1 // Get one extra item to check if there are more items
      };
      
      // Add cursor if provided
      if (cursor) {
        queryParams.cursor = {
          [cursorField]: cursor
        };
        queryParams.skip = 1; // Skip the cursor item
      }
      
      const prismaModel = prisma[model as keyof typeof prisma];
      
      if (!('findMany' in prismaModel)) {
        throw new Error(`Model ${model} does not support required operations`);
      }

      // Execute query
      const items = await (prismaModel as any).findMany(queryParams);
      
      // Check if there are more items
      const hasMore = items.length > limit;
      
      // Remove the extra item if there are more
      if (hasMore) {
        items.pop();
      }
      
      // Get the next cursor
      const nextCursor = hasMore ? items[items.length - 1][cursorField] : null;
      
      return {
        items,
        nextCursor,
        hasMore
      };
    } catch (error) {
      logger.error(`Error executing cursor-based paginated query on ${model}`, { error });
      throw error;
    }
  };
}

/**
 * Parse a cursor from a base64 encoded string
 * 
 * @param cursor Base64 encoded cursor string
 * @returns Decoded cursor object
 */
export function parseCursor<T>(cursor: string): T | null {
  try {
    const decodedString = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(decodedString);
  } catch (error) {
    logger.warn('Failed to parse cursor', { cursor, error });
    return null;
  }
}

/**
 * Encode a cursor object to base64 string
 * 
 * @param cursorData Cursor data to encode
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(cursorData: any): string {
  const jsonString = JSON.stringify(cursorData);
  return Buffer.from(jsonString, 'utf8').toString('base64');
}

/**
 * Type-safe function to retrieve paginated data
 * 
 * @param modelName Prisma model name
 * @param options Query options
 * @returns Paginated result
 */
export async function getPaginatedData<T>(
  modelName: keyof typeof prisma,
  options: {
    page: number;
    limit: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }
): Promise<PaginationResult<T>> {
  const model = prisma[modelName] as unknown as PrismaModel;
  
  if (!model || typeof model.count !== 'function' || typeof model.findMany !== 'function') {
    throw new Error(`Invalid model name: ${String(modelName)}`);
  }
  
  const { page, limit, where, orderBy, include, select } = options;
  const skip = (page - 1) * limit;
  
  try {
    // Execute count and find queries in parallel
    const [totalItems, items] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        orderBy,
        include,
        select,
        skip,
        take: limit
      })
    ]);
    
    return createPaginatedResult<T>(
      items as T[],
      totalItems,
      page,
      limit
    );
  } catch (error) {
    logger.error(`Error executing paginated query on ${String(modelName)}`, { error });
    throw error;
  }
}

export default {
  extractPaginationParams,
  extractSortParams,
  createPaginationMeta,
  createPaginatedResult,
  generatePaginationLinks,
  paginatedQuery,
  createCursorPagination,
  parseCursor,
  encodeCursor,
  getPaginatedData
};
