/**
 * Base Service
 * 
 * Abstract base class for all services providing:
 * - Standardized database access patterns
 * - Common CRUD operations with proper error handling
 * - Consistent logging and performance tracking
 */

import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

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

    try {
      const record = await this.prismaModel.findUnique({
        where: { id },
        ...options
      });

      if (!record) {
        throw new Error(`${this.modelName} with ID ${id} not found`);
      }

      return record;
    } catch (error) {
      logger.error(`Error finding ${this.modelName} by ID: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Create a new record
   * @param data Data to create record with
   * @returns Created record
   */
  async create(data: any): Promise<T> {
    logger.debug(`Creating new ${this.modelName}`, { data });

    try {
      return await this.prismaModel.create({ data });
    } catch (error) {
      logger.error(`Error creating ${this.modelName}`, { error, data });
      throw error;
    }
  }

  /**
   * Update an existing record
   * @param id ID of record to update
   * @param data Data to update record with
   * @returns Updated record
   */
  async update(id: string, data: any): Promise<T> {
    logger.debug(`Updating ${this.modelName} with ID: ${id}`, { data });

    try {
      return await this.prismaModel.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error(`Error updating ${this.modelName} with ID: ${id}`, { error, data });
      throw error;
    }
  }

  /**
   * Delete a record
   * @param id ID of record to delete
   * @returns Deleted record
   */
  async delete(id: string): Promise<T> {
    logger.debug(`Deleting ${this.modelName} with ID: ${id}`);

    try {
      return await this.prismaModel.delete({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error deleting ${this.modelName} with ID: ${id}`, { error });
      throw error;
    }
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

    const {
      where = {},
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
      include,
      select
    } = params;

    try {
      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortDir };

      const [items, total] = await Promise.all([
        this.prismaModel.findMany({
          where,
          orderBy,
          include,
          select,
          skip,
          take: limit
        }),
        this.prismaModel.count({ where })
      ]);

      return { items, total };
    } catch (error) {
      logger.error(`Error fetching paginated ${this.modelName} records`, { error, params });
      throw error;
    }
  }

  /**
   * Count records matching a filter
   * @param where Filter conditions
   * @returns Count of matching records
   */
  async count(where: any = {}): Promise<number> {
    try {
      return await this.prismaModel.count({ where });
    } catch (error) {
      logger.error(`Error counting ${this.modelName} records`, { error, where });
      throw error;
    }
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
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir }
    };
  }

  /**
   * Get the Prisma client instance
   * @returns PrismaClient instance
   */
  protected get db() {
    return prisma;
  }
}
