/**
 * Base Service Class
 * 
 * Provides common functionality for all services to eliminate code duplication.
 * Contains shared patterns for validation, error handling, logging, and database operations.
 */

import { DatabaseQueryBuilder } from '../utils/database-query-builder';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { PaginationParams } from '../utils/pagination';

/**
 * Base service error class that all service-specific errors should extend
 */
export class BaseServiceError extends Error {
  constructor(message: string, public code?: string, public service?: string) {
    super(message);
    this.name = 'BaseServiceError';
  }
}

/**
 * Base Service class that provides common functionality for all services
 */
export abstract class BaseService {
  protected readonly serviceName: string;
  protected readonly queryBuilder: typeof DatabaseQueryBuilder;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.queryBuilder = DatabaseQueryBuilder;
  }

  /**
   * Validate required fields with standardized error messages
   */
  protected validateRequired(data: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        'MISSING_REQUIRED_FIELDS'
      );
    }
  }

  /**
   * Validate field formats with custom validators
   */
  protected validateFields(data: Record<string, any>, validators: Record<string, (value: any) => boolean>, messages?: Record<string, string>): void {
    for (const [field, validator] of Object.entries(validators)) {
      if (data[field] && !validator(data[field])) {
        const message = messages?.[field] || `Invalid format for field: ${field}`;
        throw new ValidationError(message, 'INVALID_FIELD_FORMAT');
      }
    }
  }

  /**
   * Standardized create operation with validation and logging
   */
  protected async create(model: any, data: Record<string, any>, requiredFields: string[] = []): Promise<any> {
    try {
      // Validate required fields
      this.validateRequired(data, requiredFields);

      // Log operation
      this.logOperation('CREATE', { model: model.name, data: this.sanitizeLogData(data) });

      // Perform create operation
      const result = await this.queryBuilder.create(model, data);
      
      // Log success
      this.logSuccess('CREATE', { model: model.name, id: result.id });
      
      return result;
    } catch (error) {
      this.logError('CREATE', error, { model: model.name, data: this.sanitizeLogData(data) });
      throw error;
    }
  }

  /**
   * Standardized findById operation with not found handling
   */
  protected async findById(model: any, id: string, select?: any): Promise<any> {
    try {
      this.logOperation('FIND_BY_ID', { model: model.name, id, select });

      const result = await this.queryBuilder.findById(model, id, select);
      
      if (!result) {
        throw new NotFoundError(`${model.name} not found with id: ${id}`, 'ENTITY_NOT_FOUND');
      }
      
      this.logSuccess('FIND_BY_ID', { model: model.name, id });
      return result;
    } catch (error) {
      this.logError('FIND_BY_ID', error, { model: model.name, id });
      throw error;
    }
  }

  /**
   * Standardized findMany operation with pagination
   */
  protected async findMany(model: any, params: {
    where?: any;
    select?: any;
    orderBy?: any;
    pagination?: PaginationParams;
  } = {}): Promise<{ data: any[]; pagination: any }> {
    try {
      const { where, select, orderBy, pagination } = params;
      
      this.logOperation('FIND_MANY', { 
        model: model.name, 
        where: this.sanitizeLogData(where), 
        pagination 
      });

      const result = await this.queryBuilder.findMany(model, {
        where,
        select,
        orderBy,
        ...pagination && { 
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }
      });

      // If pagination is requested, get total count
      let paginationInfo = null;
      if (pagination) {
        const total = await this.queryBuilder.count(model, where);
        paginationInfo = {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit)
        };
      }

      this.logSuccess('FIND_MANY', { 
        model: model.name, 
        count: result.length,
        pagination: paginationInfo 
      });

      return {
        data: result,
        pagination: paginationInfo
      };
    } catch (error) {
      this.logError('FIND_MANY', error, { model: model.name, params });
      throw error;
    }
  }

  /**
   * Standardized update operation
   */
  protected async updateById(model: any, id: string, data: Record<string, any>): Promise<any> {
    try {
      this.logOperation('UPDATE', { model: model.name, id, data: this.sanitizeLogData(data) });

      // Check if entity exists
      await this.findById(model, id);

      const result = await this.queryBuilder.update(model, id, data);
      
      this.logSuccess('UPDATE', { model: model.name, id });
      return result;
    } catch (error) {
      this.logError('UPDATE', error, { model: model.name, id, data: this.sanitizeLogData(data) });
      throw error;
    }
  }

  /**
   * Standardized delete operation
   */
  protected async deleteById(model: any, id: string): Promise<void> {
    try {
      this.logOperation('DELETE', { model: model.name, id });

      // Check if entity exists
      await this.findById(model, id);

      await this.queryBuilder.delete(model, id);
      
      this.logSuccess('DELETE', { model: model.name, id });
    } catch (error) {
      this.logError('DELETE', error, { model: model.name, id });
      throw error;
    }
  }

  /**
   * Standardized bulk operations
   */
  protected async bulkCreate(model: any, dataArray: Record<string, any>[], requiredFields: string[] = []): Promise<any[]> {
    try {
      this.logOperation('BULK_CREATE', { model: model.name, count: dataArray.length });

      // Validate all items
      dataArray.forEach((data, index) => {
        try {
          this.validateRequired(data, requiredFields);
        } catch (error) {
          throw new ValidationError(`Validation failed for item ${index}: ${error.message}`, 'BULK_VALIDATION_ERROR');
        }
      });

      const results = await this.queryBuilder.createMany(model, dataArray);
      
      this.logSuccess('BULK_CREATE', { model: model.name, count: results.count });
      return results;
    } catch (error) {
      this.logError('BULK_CREATE', error, { model: model.name, count: dataArray.length });
      throw error;
    }
  }

  /**
   * Create service-specific error
   */
  protected createError(message: string, code?: string): BaseServiceError {
    return new BaseServiceError(message, code, this.serviceName);
  }

  /**
   * Log service operations
   */
  protected logOperation(operation: string, details: any): void {
    logger.info(`[${this.serviceName}] ${operation}`, {
      service: this.serviceName,
      operation,
      ...details
    });
  }

  /**
   * Log successful operations
   */
  protected logSuccess(operation: string, details: any): void {
    logger.info(`[${this.serviceName}] ${operation} - SUCCESS`, {
      service: this.serviceName,
      operation,
      status: 'success',
      ...details
    });
  }

  /**
   * Log errors
   */
  protected logError(operation: string, error: any, details?: any): void {
    logger.error(`[${this.serviceName}] ${operation} - ERROR`, {
      service: this.serviceName,
      operation,
      status: 'error',
      error: {
        message: error.message,
        name: error.name,
        code: error.code
      },
      ...details
    });
  }

  /**
   * Sanitize sensitive data from logs
   */
  protected sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Common validation patterns
   */
  protected static readonly validators = {
    email: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value: string): boolean => /^\+?[\d\s\-\(\)]+$/.test(value.replace(/\s/g, '')),
    uuid: (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    url: (value: string): boolean => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    positiveNumber: (value: number): boolean => typeof value === 'number' && value > 0,
    nonEmptyString: (value: string): boolean => typeof value === 'string' && value.trim().length > 0
  };
}

/**
 * Export service error class for use in specific services
 */
export { BaseServiceError };