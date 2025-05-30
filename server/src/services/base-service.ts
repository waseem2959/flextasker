/**
 * Base Service
 * 
 * Abstract base class for all services providing:
 * - Standardized database access patterns
 * - Common CRUD operations with proper error handling
 * - Consistent logging and performance tracking
 */

import { logger } from '../utils/logger';
import {
  prisma,
  findById,
  createRecord,
  updateRecord,
  deleteRecord,
  getPaginatedRecords,
  getCount,
  buildPaginationOptions
} from '../utils/database-utils';

export abstract class BaseService<T> {
  protected readonly modelName: string;
  protected readonly prismaModel: any;

  /**
   * Initialize the base service
   * @param modelName Name of the model (for error messages)
   * @param prismaModel Prisma model to use
   */
  constructor(modelName: string, prismaModel: any) {
    this.modelName = modelName;
    this.prismaModel = prismaModel;
  }

  /**
   * Find a record by ID with proper error handling
   * @param id ID of the record to find
   * @param options Additional query options (include, select)
   * @returns Found record
   */
  async findById(id: string, options: any = {}): Promise<T> {
    logger.debug(`Finding ${this.modelName} by ID: ${id}`);
    return findById(this.prismaModel, id, this.modelName, options);
  }

  /**
   * Create a new record
   * @param data Data to create record with
   * @returns Created record
   */
  async create(data: any): Promise<T> {
    logger.debug(`Creating new ${this.modelName}`, { data });
    return createRecord(this.prismaModel, data, this.modelName);
  }

  /**
   * Update an existing record
   * @param id ID of record to update
   * @param data Data to update record with
   * @returns Updated record
   */
  async update(id: string, data: any): Promise<T> {
    logger.debug(`Updating ${this.modelName} with ID: ${id}`, { data });
    return updateRecord(this.prismaModel, id, data, this.modelName);
  }

  /**
   * Delete a record
   * @param id ID of record to delete
   * @returns Deleted record
   */
  async delete(id: string): Promise<T> {
    logger.debug(`Deleting ${this.modelName} with ID: ${id}`);
    return deleteRecord(this.prismaModel, id, this.modelName);
  }

  /**
   * Get paginated list of records
   * @param params Query parameters
   * @returns Paginated records with total count
   */
  async findMany(params: {
    where?: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    include?: any;
    select?: any;
  }): Promise<{ items: T[]; total: number }> {
    logger.debug(`Fetching paginated ${this.modelName} records`, params);
    return getPaginatedRecords(this.prismaModel, params);
  }

  /**
   * Count records matching a filter
   * @param where Filter conditions
   * @returns Count of matching records
   */
  async count(where: any = {}): Promise<number> {
    return getCount(this.prismaModel, where);
  }

  /**
   * Check if a record exists
   * @param where Filter conditions
   * @returns True if record exists, false otherwise
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Create query options for pagination and sorting
   * @param page Page number
   * @param limit Items per page
   * @param sortBy Field to sort by
   * @param sortDir Sort direction
   * @returns Query options object
   */
  protected buildPaginationOptions(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ) {
    return buildPaginationOptions(page, limit, sortBy, sortDir);
  }

  /**
   * Get the Prisma client instance
   * @returns PrismaClient instance
   */
  protected get db() {
    return prisma;
  }
}
