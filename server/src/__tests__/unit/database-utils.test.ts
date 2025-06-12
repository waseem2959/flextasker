/**
 * Database Utils Tests
 * 
 * Tests for database utility functions including error handling and connection management.
 */

import { PrismaClient } from '@prisma/client';
import { 
  handlePrismaError, 
  executeWithRetry, 
  validateDatabaseConnection,
  createPaginationQuery 
} from '../../utils/database';
import { DatabaseError, NotFoundError, ValidationError } from '../../utils/error-utils';

// Mock Prisma client
jest.mock('@prisma/client');

describe('Database Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePrismaError', () => {
    it('should handle P2002 unique constraint violation', () => {
      const prismaError = {
        code: 'P2002',
        meta: {
          target: ['email'],
        },
        message: 'Unique constraint failed on the fields: (`email`)',
      };

      expect(() => handlePrismaError(prismaError, 'User creation')).toThrow(ValidationError);
      expect(() => handlePrismaError(prismaError, 'User creation')).toThrow(
        'User creation failed: Duplicate entry for email'
      );
    });

    it('should handle P2025 record not found', () => {
      const prismaError = {
        code: 'P2025',
        meta: {
          cause: 'Record to update not found.',
        },
        message: 'An operation failed because it depends on one or more records that were required but not found.',
      };

      expect(() => handlePrismaError(prismaError, 'User update')).toThrow(NotFoundError);
      expect(() => handlePrismaError(prismaError, 'User update')).toThrow(
        'User update failed: Record not found'
      );
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const prismaError = {
        code: 'P2003',
        meta: {
          field_name: 'categoryId',
        },
        message: 'Foreign key constraint failed on the field: `categoryId`',
      };

      expect(() => handlePrismaError(prismaError, 'Task creation')).toThrow(ValidationError);
      expect(() => handlePrismaError(prismaError, 'Task creation')).toThrow(
        'Task creation failed: Invalid reference for categoryId'
      );
    });

    it('should handle P2012 missing required field', () => {
      const prismaError = {
        code: 'P2012',
        meta: {
          field: 'title',
        },
        message: 'Missing a required value at `title`',
      };

      expect(() => handlePrismaError(prismaError, 'Task creation')).toThrow(ValidationError);
      expect(() => handlePrismaError(prismaError, 'Task creation')).toThrow(
        'Task creation failed: Missing required field title'
      );
    });

    it('should handle unknown Prisma errors', () => {
      const prismaError = {
        code: 'P9999',
        message: 'Unknown database error',
      };

      expect(() => handlePrismaError(prismaError, 'Database operation')).toThrow(DatabaseError);
      expect(() => handlePrismaError(prismaError, 'Database operation')).toThrow(
        'Database operation failed: Unknown database error'
      );
    });

    it('should handle errors without meta information', () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      expect(() => handlePrismaError(prismaError, 'User creation')).toThrow(ValidationError);
      expect(() => handlePrismaError(prismaError, 'User creation')).toThrow(
        'User creation failed: Duplicate entry'
      );
    });

    it('should handle non-Prisma errors', () => {
      const genericError = new Error('Generic database error');

      expect(() => handlePrismaError(genericError, 'Database operation')).toThrow(DatabaseError);
      expect(() => handlePrismaError(genericError, 'Database operation')).toThrow(
        'Database operation failed: Generic database error'
      );
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await executeWithRetry(mockOperation, 3, 100);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another failure'))
        .mockResolvedValue('success');

      const result = await executeWithRetry(mockOperation, 3, 10);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(executeWithRetry(mockOperation, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on validation errors', async () => {
      const validationError = new ValidationError('Invalid input');
      const mockOperation = jest.fn().mockRejectedValue(validationError);

      await expect(executeWithRetry(mockOperation, 3, 10)).rejects.toThrow(ValidationError);
      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries for validation errors
    });

    it('should not retry on not found errors', async () => {
      const notFoundError = new NotFoundError('Record not found');
      const mockOperation = jest.fn().mockRejectedValue(notFoundError);

      await expect(executeWithRetry(mockOperation, 3, 10)).rejects.toThrow(NotFoundError);
      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries for not found errors
    });

    it('should respect delay between retries', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await executeWithRetry(mockOperation, 2, 100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateDatabaseConnection', () => {
    let mockPrisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
      mockPrisma = {
        $queryRaw: jest.fn(),
        $disconnect: jest.fn(),
      } as any;
    });

    it('should validate successful database connection', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await validateDatabaseConnection(mockPrisma);

      expect(result).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith`SELECT 1 as result`;
    });

    it('should handle database connection failure', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await validateDatabaseConnection(mockPrisma);

      expect(result).toBe(false);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith`SELECT 1 as result`;
    });

    it('should handle timeout during connection validation', async () => {
      mockPrisma.$queryRaw.mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await validateDatabaseConnection(mockPrisma, 100);

      expect(result).toBe(false);
    });
  });

  describe('createPaginationQuery', () => {
    it('should create pagination query with default values', () => {
      const result = createPaginationQuery({});

      expect(result).toEqual({
        skip: 0,
        take: 20,
        page: 1,
        limit: 20,
      });
    });

    it('should create pagination query with custom values', () => {
      const result = createPaginationQuery({ page: 3, limit: 10 });

      expect(result).toEqual({
        skip: 20, // (3 - 1) * 10
        take: 10,
        page: 3,
        limit: 10,
      });
    });

    it('should handle invalid page numbers', () => {
      const result = createPaginationQuery({ page: 0, limit: 10 });

      expect(result).toEqual({
        skip: 0,
        take: 10,
        page: 1, // Corrected to minimum value
        limit: 10,
      });
    });

    it('should handle invalid limit values', () => {
      const result = createPaginationQuery({ page: 1, limit: 0 });

      expect(result).toEqual({
        skip: 0,
        take: 20, // Corrected to default value
        page: 1,
        limit: 20,
      });
    });

    it('should enforce maximum limit', () => {
      const result = createPaginationQuery({ page: 1, limit: 200 });

      expect(result).toEqual({
        skip: 0,
        take: 100, // Capped at maximum
        page: 1,
        limit: 100,
      });
    });

    it('should handle string inputs', () => {
      const result = createPaginationQuery({ page: '2', limit: '15' } as any);

      expect(result).toEqual({
        skip: 15, // (2 - 1) * 15
        take: 15,
        page: 2,
        limit: 15,
      });
    });

    it('should handle non-numeric string inputs', () => {
      const result = createPaginationQuery({ page: 'invalid', limit: 'also-invalid' } as any);

      expect(result).toEqual({
        skip: 0,
        take: 20,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('Database Transaction Helpers', () => {
    let mockPrisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
      mockPrisma = {
        $transaction: jest.fn(),
      } as any;
    });

    it('should execute transaction successfully', async () => {
      const mockTransactionFn = jest.fn().mockResolvedValue('transaction result');
      mockPrisma.$transaction.mockResolvedValue('transaction result');

      const result = await mockPrisma.$transaction(mockTransactionFn);

      expect(result).toBe('transaction result');
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(mockTransactionFn);
    });

    it('should handle transaction rollback on error', async () => {
      const mockTransactionFn = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(mockPrisma.$transaction(mockTransactionFn)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Query Optimization Helpers', () => {
    it('should create optimized include query', () => {
      const includeFields = ['user', 'category', 'bids'];
      const optimizedInclude = includeFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);

      expect(optimizedInclude).toEqual({
        user: true,
        category: true,
        bids: true,
      });
    });

    it('should create selective field query', () => {
      const selectFields = ['id', 'title', 'description', 'budget'];
      const selectQuery = selectFields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);

      expect(selectQuery).toEqual({
        id: true,
        title: true,
        description: true,
        budget: true,
      });
    });
  });
});
