/**
 * Unit Tests for Database Optimization
 * 
 * These tests verify the functionality of the database optimization utilities
 * including query performance monitoring and optimized query builders.
 */

import { QueryPerformanceMonitor, OptimizedQueries } from '../../utils/database-optimization';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  },
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  },
  bid: {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  },
  review: {
    aggregate: jest.fn()
  }
} as unknown as PrismaClient;

describe('Database Optimization Unit Tests', () => {
  let queryMonitor: QueryPerformanceMonitor;
  let optimizedQueries: OptimizedQueries;

  beforeEach(() => {
    queryMonitor = QueryPerformanceMonitor.getInstance();
    queryMonitor.resetStats();
    optimizedQueries = new OptimizedQueries(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe('QueryPerformanceMonitor', () => {
    it('should be a singleton', () => {
      const monitor1 = QueryPerformanceMonitor.getInstance();
      const monitor2 = QueryPerformanceMonitor.getInstance();
      expect(monitor1).toBe(monitor2);
    });

    it('should monitor query execution time', async () => {
      const queryName = 'testQuery';
      const mockQueryFn = jest.fn().mockResolvedValue('result');

      const result = await queryMonitor.monitorQuery(queryName, mockQueryFn);

      expect(result).toBe('result');
      expect(mockQueryFn).toHaveBeenCalled();

      const stats = queryMonitor.getStats();
      expect(stats[queryName]).toBeDefined();
      expect(stats[queryName].count).toBe(1);
      expect(stats[queryName].avgTime).toBeGreaterThan(0);
    });

    it('should record multiple query executions', async () => {
      const queryName = 'testQuery';
      const mockQueryFn = jest.fn().mockResolvedValue('result');

      // Execute the same query multiple times
      await queryMonitor.monitorQuery(queryName, mockQueryFn);
      await queryMonitor.monitorQuery(queryName, mockQueryFn);
      await queryMonitor.monitorQuery(queryName, mockQueryFn);

      const stats = queryMonitor.getStats();
      expect(stats[queryName].count).toBe(3);
      expect(stats[queryName].totalTime).toBeGreaterThan(0);
      expect(stats[queryName].avgTime).toBeGreaterThan(0);
    });

    it('should handle query failures', async () => {
      const queryName = 'failingQuery';
      const error = new Error('Query failed');
      const mockQueryFn = jest.fn().mockRejectedValue(error);

      await expect(queryMonitor.monitorQuery(queryName, mockQueryFn)).rejects.toThrow('Query failed');

      const stats = queryMonitor.getStats();
      expect(stats[queryName]).toBeDefined();
      expect(stats[queryName].count).toBe(1);
    });

    it('should reset statistics', () => {
      const queryName = 'testQuery';
      const mockQueryFn = jest.fn().mockResolvedValue('result');

      // Add some stats
      queryMonitor.monitorQuery(queryName, mockQueryFn);

      // Reset
      queryMonitor.resetStats();

      const stats = queryMonitor.getStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });

    it('should calculate average time correctly', async () => {
      const queryName = 'testQuery';
      
      // Mock query functions with different execution times
      const fastQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('fast'), 10))
      );
      const slowQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow'), 50))
      );

      await queryMonitor.monitorQuery(queryName, fastQuery);
      await queryMonitor.monitorQuery(queryName, slowQuery);

      const stats = queryMonitor.getStats();
      expect(stats[queryName].count).toBe(2);
      expect(stats[queryName].avgTime).toBeGreaterThan(10);
      expect(stats[queryName].avgTime).toBeLessThan(100);
    });
  });

  describe('OptimizedQueries', () => {
    describe('getPaginatedResults', () => {
      it('should execute count and data queries in parallel', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        const mockCount = 10;

        (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockCount);

        const result = await optimizedQueries.getPaginatedResults(mockPrismaClient.user, {
          page: 1,
          limit: 5,
          where: { isActive: true }
        });

        expect(result).toEqual({
          data: mockData,
          total: mockCount,
          page: 1,
          limit: 5,
          totalPages: 2
        });

        expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
          where: { isActive: true },
          orderBy: undefined,
          include: undefined,
          select: undefined,
          skip: 0,
          take: 5
        });

        expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
          where: { isActive: true }
        });
      });

      it('should calculate pagination correctly', async () => {
        const mockData = [{ id: '1', name: 'Test' }];
        const mockCount = 23;

        (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockCount);

        const result = await optimizedQueries.getPaginatedResults(mockPrismaClient.user, {
          page: 3,
          limit: 10
        });

        expect(result.totalPages).toBe(3);
        expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 20, // (page - 1) * limit = (3 - 1) * 10
            take: 10
          })
        );
      });
    });

    describe('searchUsers', () => {
      it('should build search query with multiple terms', async () => {
        const mockData = [{ id: '1', firstName: 'John', lastName: 'Doe' }];
        const mockCount = 1;

        (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockCount);

        await optimizedQueries.searchUsers('john doe', { page: 1, limit: 10 });

        expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { firstName: { contains: 'john', mode: 'insensitive' } },
                { lastName: { contains: 'john', mode: 'insensitive' } },
                { email: { contains: 'john', mode: 'insensitive' } },
                { firstName: { contains: 'doe', mode: 'insensitive' } },
                { lastName: { contains: 'doe', mode: 'insensitive' } },
                { email: { contains: 'doe', mode: 'insensitive' } }
              ]
            }
          })
        );
      });

      it('should handle empty search query', async () => {
        const mockData = [];
        const mockCount = 0;

        (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockCount);

        await optimizedQueries.searchUsers('', { page: 1, limit: 10 });

        expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { OR: [] }
          })
        );
      });
    });

    describe('searchTasks', () => {
      it('should build complex search query with all filters', async () => {
        const mockData = [{ id: '1', title: 'Test Task' }];
        const mockCount = 1;

        (mockPrismaClient.task.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.task.count as jest.Mock).mockResolvedValue(mockCount);

        const filters = {
          query: 'test task',
          categoryId: 'cat-1',
          location: 'New York',
          minBudget: 100,
          maxBudget: 500,
          status: 'OPEN',
          page: 1,
          limit: 10
        };

        await optimizedQueries.searchTasks(filters);

        expect(mockPrismaClient.task.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              OR: [
                { title: { contains: 'test', mode: 'insensitive' } },
                { description: { contains: 'test', mode: 'insensitive' } },
                { title: { contains: 'task', mode: 'insensitive' } },
                { description: { contains: 'task', mode: 'insensitive' } }
              ],
              categoryId: 'cat-1',
              location: { contains: 'New York', mode: 'insensitive' },
              budget: { gte: 100, lte: 500 },
              status: 'OPEN'
            }
          })
        );
      });

      it('should handle partial filters', async () => {
        const mockData = [];
        const mockCount = 0;

        (mockPrismaClient.task.findMany as jest.Mock).mockResolvedValue(mockData);
        (mockPrismaClient.task.count as jest.Mock).mockResolvedValue(mockCount);

        const filters = {
          minBudget: 100,
          page: 1,
          limit: 10
        };

        await optimizedQueries.searchTasks(filters);

        expect(mockPrismaClient.task.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              budget: { gte: 100 }
            }
          })
        );
      });
    });

    describe('getUserWithStats', () => {
      it('should fetch user data and stats in parallel', async () => {
        const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe' };
        const mockTaskStats = [{ status: 'COMPLETED', _count: { status: 5 } }];
        const mockBidStats = [{ status: 'ACCEPTED', _count: { status: 3 } }];
        const mockReviewStats = { _avg: { rating: 4.5 }, _count: { rating: 10 } };

        (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (mockPrismaClient.task.groupBy as jest.Mock).mockResolvedValue(mockTaskStats);
        (mockPrismaClient.bid.groupBy as jest.Mock).mockResolvedValue(mockBidStats);
        (mockPrismaClient.review.aggregate as jest.Mock).mockResolvedValue(mockReviewStats);

        const result = await optimizedQueries.getUserWithStats('user-1');

        expect(result).toEqual({
          ...mockUser,
          stats: {
            tasks: { COMPLETED: 5 },
            bids: { ACCEPTED: 3 },
            reviews: {
              averageRating: 4.5,
              totalReviews: 10
            }
          }
        });

        // Verify all queries were called
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          select: expect.any(Object)
        });
        expect(mockPrismaClient.task.groupBy).toHaveBeenCalled();
        expect(mockPrismaClient.bid.groupBy).toHaveBeenCalled();
        expect(mockPrismaClient.review.aggregate).toHaveBeenCalled();
      });

      it('should return null for non-existent user', async () => {
        (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await optimizedQueries.getUserWithStats('non-existent');

        expect(result).toBeNull();
      });

      it('should handle empty stats gracefully', async () => {
        const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe' };

        (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (mockPrismaClient.task.groupBy as jest.Mock).mockResolvedValue([]);
        (mockPrismaClient.bid.groupBy as jest.Mock).mockResolvedValue([]);
        (mockPrismaClient.review.aggregate as jest.Mock).mockResolvedValue({
          _avg: { rating: null },
          _count: { rating: 0 }
        });

        const result = await optimizedQueries.getUserWithStats('user-1');

        expect(result?.stats).toEqual({
          tasks: {},
          bids: {},
          reviews: {
            averageRating: 0,
            totalReviews: 0
          }
        });
      });
    });
  });

  describe('Performance Integration', () => {
    it('should monitor optimized query performance', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      const mockCount = 1;

      (mockPrismaClient.user.findMany as jest.Mock).mockResolvedValue(mockData);
      (mockPrismaClient.user.count as jest.Mock).mockResolvedValue(mockCount);

      await optimizedQueries.searchUsers('test', { page: 1, limit: 10 });

      const stats = queryMonitor.getStats();
      expect(stats.searchUsers).toBeDefined();
      expect(stats.searchUsers.count).toBe(1);
    });

    it('should track query performance across multiple calls', async () => {
      const mockData = [];
      const mockCount = 0;

      (mockPrismaClient.task.findMany as jest.Mock).mockResolvedValue(mockData);
      (mockPrismaClient.task.count as jest.Mock).mockResolvedValue(mockCount);

      // Make multiple search calls
      await optimizedQueries.searchTasks({ page: 1, limit: 10 });
      await optimizedQueries.searchTasks({ page: 2, limit: 10 });
      await optimizedQueries.searchTasks({ page: 3, limit: 10 });

      const stats = queryMonitor.getStats();
      expect(stats.searchTasks).toBeDefined();
      expect(stats.searchTasks.count).toBe(3);
      expect(stats.searchTasks.avgTime).toBeGreaterThan(0);
    });
  });
});
