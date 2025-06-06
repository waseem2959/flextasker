/**
 * Database Utilities
 * 
 * Common database operations and utilities for Prisma models
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * Find a record by ID with proper error handling
 */
export async function findById<T>(
  model: any,
  id: string,
  modelName: string,
  options: any = {}
): Promise<T> {
  try {
    const record = await model.findUnique({
      where: { id },
      ...options
    });

    if (!record) {
      throw new Error(`${modelName} not found with ID: ${id}`);
    }

    return record;
  } catch (error) {
    logger.error(`Error finding ${modelName} by ID`, { id, error });
    throw error;
  }
}

/**
 * Create a new record
 */
export async function createRecord<T>(
  model: any,
  data: any,
  modelName: string
): Promise<T> {
  try {
    const record = await model.create({ data });
    logger.info(`Created new ${modelName}`, { id: record.id });
    return record;
  } catch (error) {
    logger.error(`Error creating ${modelName}`, { data, error });
    throw error;
  }
}

/**
 * Update an existing record
 */
export async function updateRecord<T>(
  model: any,
  id: string,
  data: any,
  modelName: string
): Promise<T> {
  try {
    const record = await model.update({
      where: { id },
      data
    });
    logger.info(`Updated ${modelName}`, { id });
    return record;
  } catch (error) {
    logger.error(`Error updating ${modelName}`, { id, data, error });
    throw error;
  }
}

/**
 * Delete a record
 */
export async function deleteRecord<T>(
  model: any,
  id: string,
  modelName: string
): Promise<T> {
  try {
    const record = await model.delete({
      where: { id }
    });
    logger.info(`Deleted ${modelName}`, { id });
    return record;
  } catch (error) {
    logger.error(`Error deleting ${modelName}`, { id, error });
    throw error;
  }
}

/**
 * Get paginated records
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

  const skip = (page - 1) * limit;
  const orderBy = { [sortBy]: sortDir };

  try {
    const [items, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
        select
      }),
      model.count({ where })
    ]);

    return { items, total };
  } catch (error) {
    logger.error('Error getting paginated records', { params, error });
    throw error;
  }
}

/**
 * Get count of records
 */
export async function getCount(model: any, where: any = {}): Promise<number> {
  try {
    return await model.count({ where });
  } catch (error) {
    logger.error('Error counting records', { where, error });
    throw error;
  }
}

/**
 * Build pagination options
 */
export function buildPaginationOptions(
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortDir: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;
  const orderBy = { [sortBy]: sortDir };

  return {
    skip,
    take: limit,
    orderBy
  };
}

/**
 * Execute a transaction
 */
export async function executeTransaction<T>(
  operations: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(operations);
  } catch (error) {
    logger.error('Transaction failed', { error });
    throw error;
  }
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
    throw error;
  }
}
