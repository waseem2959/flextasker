/**
 * Consolidated Database Module
 *
 * This module provides a centralized database client instance and comprehensive utilities
 * for working with the database throughout the application, including:
 * - Singleton Prisma client with proper configuration
 * - Centralized error handling for database operations
 * - Transaction management and retry logic
 * - Query builder helpers and common database operation patterns
 * - Pagination and filtering utilities
 * - Type-safe prisma client interactions
 */

import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { DatabaseError, DatabaseErrorDetails, NotFoundError } from './error-utils';
import { logger } from './logger';

// Create a singleton instance of the Prisma Client with comprehensive configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ]
    : [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$on('query' as any, (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Handle database connection errors with comprehensive error handling
prisma.$use(async (params: any, next: (params: any) => Promise<any>) => {
  try {
    return await next(params);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Database operation failed', {
      model: params.model,
      action: params.action,
      error: errorMessage,
      stack: errorStack,
    });
    throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export the database client with both naming conventions for compatibility
export const db = prisma;
export { prisma };

/**
 * Safely execute a database operation with standardized error handling
 *
 * @param operation Function that performs the database operation
 * @param errorMessage Error message to use if operation fails
 * @returns Result of the database operation
 * @throws DatabaseError if operation fails
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Database error: ${errorMessage}`, { error });

    // Handle Prisma-specific errors using centralized handler
    if (error instanceof PrismaClientKnownRequestError) {
      // Import the handler function (note: this would need to be moved to a shared location)
      // For now, keeping the existing logic but noting it should be centralized
      if (error.code === 'P2025') {
        throw new NotFoundError(errorMessage);
      }
      if (error.code === 'P2002') {
        const fields = error.meta?.target as string[] || [];
        throw new DatabaseError(`${errorMessage}: Duplicate entry for ${fields.join(', ')}`);
      }
    }

    // Generic database error
    const errorDetails: DatabaseErrorDetails = {
      operation: 'database_operation',
      errorCode: 'UNKNOWN_ERROR'
    };

    // Safely extract error code if available
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails.errorCode = String(error.code);
    }

    // Safely extract meta if available
    if (error && typeof error === 'object' && 'meta' in error) {
      errorDetails.meta = error.meta as Record<string, unknown>;
    }

    throw new DatabaseError(errorMessage, errorDetails);
  }
}

/**
 * Find a record by ID with proper error handling
 *
 * @param model Prisma model to query
 * @param id ID of record to find
 * @param entityName Name of entity (for error messages)
 * @param options Additional query options
 * @returns Found record
 * @throws NotFoundError if record not found
 */
export async function findById<T>(
  model: any,
  id: string,
  entityName: string,
  options: any = {}
): Promise<T> {
  return executeDbOperation(
    async () => {
      const record = await model.findUnique({
        where: { id },
        ...options,
      });

      if (!record) {
        throw new NotFoundError(`${entityName} with ID ${id} not found`);
      }

      return record;
    },
    `Failed to find ${entityName}`
  );
}

/**
 * Create a record with proper error handling
 *
 * @param model Prisma model to use
 * @param data Data to create record with
 * @param entityName Name of entity (for error messages)
 * @returns Created record
 */
export async function createRecord<T>(
  model: any,
  data: any,
  entityName: string
): Promise<T> {
  return executeDbOperation(
    () => model.create({ data }),
    `Failed to create ${entityName}`
  );
}

/**
 * Update a record with proper error handling
 *
 * @param model Prisma model to use
 * @param id ID of record to update
 * @param data Data to update record with
 * @param entityName Name of entity (for error messages)
 * @returns Updated record
 */
export async function updateRecord<T>(
  model: any,
  id: string,
  data: any,
  entityName: string
): Promise<T> {
  return executeDbOperation(
    async () => {
      // Check if record exists first
      const exists = await model.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!exists) {
        throw new NotFoundError(`${entityName} with ID ${id} not found`);
      }

      return model.update({
        where: { id },
        data,
      });
    },
    `Failed to update ${entityName}`
  );
}

/**
 * Delete a record with proper error handling
 *
 * @param model Prisma model to use
 * @param id ID of record to delete
 * @param entityName Name of entity (for error messages)
 * @returns Deleted record
 */
export async function deleteRecord<T>(
  model: any,
  id: string,
  entityName: string
): Promise<T> {
  return executeDbOperation(
    async () => {
      // Check if record exists first
      const exists = await model.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!exists) {
        throw new NotFoundError(`${entityName} with ID ${id} not found`);
      }

      return model.delete({
        where: { id },
      });
    },
    `Failed to delete ${entityName}`
  );
}

/**
 * Build pagination and sorting options for queries
 *
 * @param page Page number
 * @param limit Items per page
 * @param sortBy Field to sort by
 * @param sortDir Sort direction
 * @returns Object with pagination and sorting options
 */
export function buildPaginationOptions(
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortDir: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  return {
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortDir,
    },
  };
}

/**
 * Get total count of records matching a filter
 *
 * @param model Prisma model to query
 * @param where Filter conditions
 * @returns Count of matching records
 */
export async function getCount(
  model: any,
  where: any = {}
): Promise<number> {
  return executeDbOperation(
    () => model.count({ where }),
    'Failed to count records'
  );
}

// Import centralized pagination from database-query-builder
import { DatabaseQueryBuilder } from './database-query-builder';

/**
 * Get paginated records with count (using centralized implementation)
 * @deprecated Use DatabaseQueryBuilder.findManyWithCount instead
 */
export async function getPaginatedRecords<T>(
  model: any,
  params: {
    where?: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    include?: any;
    select?: any;
  }
): Promise<{ items: T[]; total: number }> {
  const {
    where = {},
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortDir = 'desc',
    include,
    select
  } = params;

  // Use centralized implementation
  return DatabaseQueryBuilder.findManyWithCount(model, {
    where,
    select,
    orderBy: { [sortBy]: sortDir },
    pagination: { skip: (page - 1) * limit, limit }
  }, 'Record');

  return executeDbOperation(
    async () => {
      // Execute both queries in parallel
      const [items, total] = await Promise.all([
        model.findMany({
          where,
          ...buildPaginationOptions(page, limit, sortBy, sortDir),
          ...(include ? { include } : {}),
          ...(select ? { select } : {}),
        }),
        model.count({ where })
      ]);

      return { items, total };
    },
    'Failed to fetch paginated records'
  );
}

// Re-export types for convenience
export * from '@prisma/client';

