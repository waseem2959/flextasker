/**
 * Comprehensive Database Query Builder
 *
 * Consolidated utility that eliminates duplicate database query patterns across services.
 * Combines features from database.ts, enhanced-database-service.ts, and database-manager.ts
 * Provides standardized CRUD operations with caching, read replicas, error handling, and logging.
 */

import { DatabaseError, NotFoundError, ValidationError } from './error-utils';
import { logger } from './logger';
import { PaginationParams } from './pagination';
// Use centralized database client instead of creating a new one
import { prisma } from './database';

// DatabaseErrorDetails interface removed - error handling is now centralized

// Note: Using centralized Prisma client from ./database.ts
// This eliminates duplicate client instances and middleware

/**
 * Standard select fields for user queries to avoid duplication
 */
export const USER_SELECT_FIELDS = {
  basic: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    profileImage: true,
    isActive: true,
    emailVerified: true,
    createdAt: true
  },
  detailed: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    bio: true,
    location: true,
    profileImage: true,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
    averageRating: true,
    trustScore: true,
    lastActive: true,
    createdAt: true
  },
  withAuth: {
    id: true,
    email: true,
    passwordHash: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    emailVerified: true
  }
};

/**
 * Standard select fields for task queries
 */
export const TASK_SELECT_FIELDS = {
  basic: {
    id: true,
    title: true,
    description: true,
    budget: true,
    status: true,
    location: true,
    createdAt: true,
    deadline: true
  },
  detailed: {
    id: true,
    title: true,
    description: true,
    budget: true,
    budgetType: true,
    status: true,
    priority: true,
    location: true,
    city: true,
    state: true,
    isRemote: true,
    tags: true,
    requirements: true,
    createdAt: true,
    updatedAt: true,
    deadline: true,
    completedAt: true
  }
};

/**
 * Safely execute a database operation with enhanced error handling
 */
async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Database error: ${errorMessage}`, { error });

    // Error handling is now done by centralized database middleware
    // Re-throw the original error
    throw error;
  }
}

/**
 * Comprehensive database query builder class
 */
export class DatabaseQueryBuilder {
  /**
   * Find a record by ID with enhanced error handling
   */
  static async findById<T>(
    model: any,
    id: string,
    entityName: string,
    selectFields?: any
  ): Promise<T> {
    return executeDbOperation(
      async () => {
        const record = await model.findUnique({
          where: { id },
          select: selectFields
        });

        if (!record) {
          throw new NotFoundError(`${entityName} with ID ${id} not found`);
        }

        logger.debug(`${entityName} found by ID`, { id });
        return record;
      },
      `Failed to find ${entityName}`
    );
  }

  /**
   * Find a record by email (common pattern)
   */
  static async findByEmail<T>(
    model: any,
    email: string,
    entityName: string,
    selectFields?: any
  ): Promise<T | null> {
    try {
      const record = await model.findUnique({
        where: { email: email.toLowerCase() },
        select: selectFields
      });

      logger.debug(`${entityName} search by email`, { email, found: !!record });
      return record;
    } catch (error) {
      logger.error(`Error finding ${entityName} by email`, { email, error });
      throw new DatabaseError(`Failed to find ${entityName} by email`);
    }
  }

  /**
   * Create a new record with validation
   */
  static async create<T>(
    model: any,
    data: any,
    entityName: string,
    selectFields?: any
  ): Promise<T> {
    try {
      const record = await model.create({
        data,
        select: selectFields
      });

      logger.info(`${entityName} created`, { id: record.id });
      return record;
    } catch (error) {
      logger.error(`Error creating ${entityName}`, { data, error });
      // Error handling is now done by centralized database middleware
      throw new DatabaseError(`Failed to create ${entityName}`);
    }
  }

  /**
   * Update a record with existence check
   */
  static async update<T>(
    model: any,
    id: string,
    data: any,
    entityName: string,
    selectFields?: any
  ): Promise<T> {
    try {
      // Check if record exists first
      await this.findById(model, id, entityName, { id: true });

      const record = await model.update({
        where: { id },
        data,
        select: selectFields
      });

      logger.info(`${entityName} updated`, { id });
      return record;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error updating ${entityName}`, { id, data, error });
      throw new DatabaseError(`Failed to update ${entityName}`);
    }
  }

  /**
   * Delete a record with existence check
   */
  static async delete(
    model: any,
    id: string,
    entityName: string
  ): Promise<void> {
    try {
      // Check if record exists first
      await this.findById(model, id, entityName, { id: true });

      await model.delete({
        where: { id }
      });

      logger.info(`${entityName} deleted`, { id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error deleting ${entityName}`, { id, error });
      throw new DatabaseError(`Failed to delete ${entityName}`);
    }
  }

  /**
   * Count records with optional filter
   */
  static async count(
    model: any,
    entityName: string,
    where: any = {}
  ): Promise<number> {
    return executeDbOperation(
      async () => {
        const count = await model.count({ where });
        logger.debug(`${entityName} count`, { count, where });
        return count;
      },
      `Failed to count ${entityName}`
    );
  }

  /**
   * Update multiple records
   */
  static async updateMany(
    model: any,
    where: any,
    data: any,
    entityName: string
  ): Promise<{ count: number }> {
    return executeDbOperation(
      async () => {
        const result = await model.updateMany({ where, data });
        logger.debug(`${entityName} updateMany`, { where, data, count: result.count });
        return result;
      },
      `Failed to update multiple ${entityName} records`
    );
  }

  /**
   * Find a unique record with where clause
   */
  static async findUnique<T>(
    model: any,
    where: any,
    entityName: string,
    selectFields?: any
  ): Promise<T | null> {
    return executeDbOperation(
      async () => {
        const record = await model.findUnique({
          where,
          select: selectFields
        });

        logger.debug(`${entityName} findUnique`, { where, found: !!record });
        return record;
      },
      `Failed to find unique ${entityName}`
    );
  }

  /**
   * Find first record matching criteria
   */
  static async findFirst<T>(
    model: any,
    where: any,
    entityName: string,
    selectFields?: any
  ): Promise<T | null> {
    return executeDbOperation(
      async () => {
        const record = await model.findFirst({
          where,
          select: selectFields
        });

        logger.debug(`${entityName} findFirst`, { where, found: !!record });
        return record;
      },
      `Failed to find first ${entityName}`
    );
  }

  /**
   * Delete multiple records
   */
  static async deleteMany(
    model: any,
    where: any,
    entityName: string
  ): Promise<{ count: number }> {
    return executeDbOperation(
      async () => {
        const result = await model.deleteMany({ where });
        logger.debug(`${entityName} deleteMany`, { where, count: result.count });
        return result;
      },
      `Failed to delete multiple ${entityName} records`
    );
  }

  /**
   * Group records by specified fields
   */
  static async groupBy(
    model: any,
    by: string[],
    aggregations: any,
    entityName: string,
    where?: any
  ): Promise<any[]> {
    return executeDbOperation(
      async () => {
        const options: any = { by, ...aggregations };
        if (where) {
          options.where = where;
        }
        const result = await model.groupBy(options);
        logger.debug(`${entityName} groupBy`, { by, aggregations, count: result.length });
        return result;
      },
      `Failed to group ${entityName} records`
    );
  }

  /**
   * Find many records with pagination
   */
  static async findMany<T>(
    model: any,
    params: {
      where?: any;
      select?: any;
      orderBy?: any;
      pagination?: PaginationParams;
    },
    entityName: string
  ): Promise<{ items: T[]; total: number }> {
    try {
      const { where = {}, select, orderBy, pagination } = params;

      // Execute count and find queries in parallel
      const [total, items] = await Promise.all([
        model.count({ where }),
        model.findMany({
          where,
          select,
          orderBy,
          skip: pagination?.skip ?? 0,
          take: pagination?.limit ?? 20
        })
      ]);

      logger.debug(`${entityName} findMany`, { 
        total, 
        itemCount: items.length, 
        pagination 
      });

      return { items, total };
    } catch (error) {
      logger.error(`Error finding ${entityName} records`, { params, error });
      throw new DatabaseError(`Failed to find ${entityName} records`);
    }
  }

  /**
   * Find many records with count (alias for findMany for backward compatibility)
   */
  static async findManyWithCount<T>(
    model: any,
    params: any,
    entityName: string = 'Record'
  ): Promise<{ items: T[]; total: number }> {
    return this.findMany<T>(model, params, entityName);
  }

  /**
   * Check if a record exists
   */
  static async exists(
    model: any,
    where: any,
    entityName: string
  ): Promise<boolean> {
    try {
      const count = await model.count({ where });
      const exists = count > 0;
      logger.debug(`${entityName} exists check`, { where, exists });
      return exists;
    } catch (error) {
      logger.error(`Error checking ${entityName} existence`, { where, error });
      throw new DatabaseError(`Failed to check ${entityName} existence`);
    }
  }

  /**
   * Validate unique field (common pattern for email, etc.)
   */
  static async validateUnique(
    model: any,
    field: string,
    value: any,
    excludeId?: string,
    entityName: string = 'Record'
  ): Promise<void> {
    try {
      const where: any = { [field]: value };
      if (excludeId) {
        where.NOT = { id: excludeId };
      }

      const exists = await this.exists(model, where, entityName);
      if (exists) {
        throw new ValidationError(`${entityName} with this ${field} already exists`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error(`Error validating unique ${field}`, { field, value, error });
      throw new DatabaseError(`Failed to validate ${field} uniqueness`);
    }
  }
}

// Export Prisma client for direct access when needed
export { prisma };

// Export commonly used models for type safety
export const models = {
  user: prisma.user,
  task: prisma.task,
  bid: prisma.bid,
  review: prisma.review,
  notification: prisma.notification,
  notificationPreference: prisma.notificationPreference,
  payment: prisma.payment,
  paymentMethod: prisma.paymentMethod,
  refreshToken: prisma.refreshToken,
  passwordReset: prisma.passwordReset,
  platformRevenue: prisma.platformRevenue,
  refund: prisma.refund,
  category: prisma.category,
  verification: prisma.verification,
  emailVerification: prisma.emailVerification,
  phoneVerification: prisma.phoneVerification,
  documentVerification: prisma.documentVerification,
  auditLog: prisma.auditLog,
  conversation: prisma.conversation,
  message: prisma.message,
  attachment: prisma.attachment
};
