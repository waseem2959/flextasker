/**
 * Database Optimization Utilities
 * 
 * This module provides utilities for optimizing database queries and performance.
 * It includes query builders, index suggestions, and performance monitoring.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private slowQueryThreshold = 1000; // 1 second
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  /**
   * Monitor query execution time
   */
  async monitorQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      this.recordQueryStats(queryName, executionTime);
      
      if (executionTime > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryName,
          executionTime,
          threshold: this.slowQueryThreshold
        });
      }
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Query failed', {
        queryName,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private recordQueryStats(queryName: string, executionTime: number): void {
    const stats = this.queryStats.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    this.queryStats.set(queryName, stats);
  }

  /**
   * Get query statistics
   */
  getStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queryStats);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.queryStats.clear();
  }
}

/**
 * Optimized query builders for common patterns
 */
export class OptimizedQueries {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get paginated results with optimized counting
   */
  async getPaginatedResults<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
      page: number;
      limit: number;
    }
  ): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const { where, orderBy, include, select, page, limit } = options;
    const skip = (page - 1) * limit;

    // Use Promise.all to run count and data queries in parallel
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        orderBy,
        include,
        select,
        skip,
        take: limit
      }),
      model.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Optimized user search with full-text search simulation
   */
  async searchUsers(query: string, options: { page: number; limit: number }) {
    const monitor = QueryPerformanceMonitor.getInstance();
    
    return monitor.monitorQuery('searchUsers', async () => {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      
      const where = {
        OR: searchTerms.flatMap(term => [
          { firstName: { contains: term, mode: 'insensitive' as const } },
          { lastName: { contains: term, mode: 'insensitive' as const } },
          { email: { contains: term, mode: 'insensitive' as const } }
        ])
      };

      return this.getPaginatedResults(this.prisma.user, {
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePictureUrl: true,
          createdAt: true
        },
        ...options
      });
    });
  }

  /**
   * Optimized task search with category and location filtering
   */
  async searchTasks(filters: {
    query?: string;
    categoryId?: string;
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: string;
    page: number;
    limit: number;
  }) {
    const monitor = QueryPerformanceMonitor.getInstance();
    
    return monitor.monitorQuery('searchTasks', async () => {
      const { query, categoryId, location, minBudget, maxBudget, status, ...pagination } = filters;
      
      const where: any = {};
      
      // Text search
      if (query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        where.OR = searchTerms.flatMap(term => [
          { title: { contains: term, mode: 'insensitive' as const } },
          { description: { contains: term, mode: 'insensitive' as const } }
        ]);
      }
      
      // Category filter
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      // Location filter
      if (location) {
        where.location = { contains: location, mode: 'insensitive' as const };
      }
      
      // Budget range filter
      if (minBudget !== undefined || maxBudget !== undefined) {
        where.budget = {};
        if (minBudget !== undefined) where.budget.gte = minBudget;
        if (maxBudget !== undefined) where.budget.lte = maxBudget;
      }
      
      // Status filter
      if (status) {
        where.status = status;
      }

      return this.getPaginatedResults(this.prisma.task, {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true }
          },
          owner: {
            select: { id: true, firstName: true, lastName: true }
          },
          _count: {
            select: { bids: true }
          }
        },
        ...pagination
      });
    });
  }

  /**
   * Get user with related data efficiently
   */
  async getUserWithStats(userId: string) {
    const monitor = QueryPerformanceMonitor.getInstance();
    
    return monitor.monitorQuery('getUserWithStats', async () => {
      // Use Promise.all to fetch user data and stats in parallel
      const [user, taskStats, bidStats, reviewStats] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            isActive: true
          }
        }),
        
        // Task statistics
        this.prisma.task.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true }
        }),
        
        // Bid statistics
        this.prisma.bid.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true }
        }),
        
        // Review statistics
        this.prisma.review.aggregate({
          where: { revieweeId: userId },
          _avg: { rating: true },
          _count: { rating: true }
        })
      ]);

      if (!user) {
        return null;
      }

      // Process statistics
      const taskCounts = taskStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>);

      const bidCounts = bidStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...user,
        stats: {
          tasks: taskCounts,
          bids: bidCounts,
          reviews: {
            averageRating: reviewStats._avg?.rating ?? 0,
            totalReviews: reviewStats._count?.rating ?? 0
          }
        }
      };
    });
  }
}

/**
 * Database index suggestions based on common query patterns
 */
export const indexSuggestions = {
  // User table indexes
  users: [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);',
    'CREATE INDEX IF NOT EXISTS idx_users_active ON "User"(isActive);',
    'CREATE INDEX IF NOT EXISTS idx_users_created ON "User"(createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_users_name ON "User"(firstName, lastName);'
  ],
  
  // Task table indexes
  tasks: [
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON "Task"(status);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_category ON "Task"(categoryId);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_owner ON "Task"(userId);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON "Task"(assignedUserId);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_created ON "Task"(createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_budget ON "Task"(budget);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_location ON "Task"(location);',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON "Task"(status, createdAt);'
  ],
  
  // Bid table indexes
  bids: [
    'CREATE INDEX IF NOT EXISTS idx_bids_task ON "Bid"(taskId);',
    'CREATE INDEX IF NOT EXISTS idx_bids_user ON "Bid"(userId);',
    'CREATE INDEX IF NOT EXISTS idx_bids_status ON "Bid"(status);',
    'CREATE INDEX IF NOT EXISTS idx_bids_created ON "Bid"(createdAt);',
    'CREATE INDEX IF NOT EXISTS idx_bids_task_status ON "Bid"(taskId, status);'
  ],
  
  // Review table indexes
  reviews: [
    'CREATE INDEX IF NOT EXISTS idx_reviews_subject ON "Review"(subjectId);',
    'CREATE INDEX IF NOT EXISTS idx_reviews_author ON "Review"(authorId);',
    'CREATE INDEX IF NOT EXISTS idx_reviews_task ON "Review"(taskId);',
    'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON "Review"(rating);',
    'CREATE INDEX IF NOT EXISTS idx_reviews_created ON "Review"(createdAt);'
  ]
};

/**
 * Apply database optimizations
 */
export async function applyDatabaseOptimizations(prisma: PrismaClient): Promise<void> {
  logger.info('Applying database optimizations...');
  
  try {
    // Apply indexes (this would be done via migrations in production)
    const allIndexes = [
      ...indexSuggestions.users,
      ...indexSuggestions.tasks,
      ...indexSuggestions.bids,
      ...indexSuggestions.reviews
    ];
    
    for (const indexQuery of allIndexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery);
        logger.debug('Index applied', { query: indexQuery });
      } catch (error) {
        // Index might already exist, which is fine
        logger.debug('Index application skipped', { 
          query: indexQuery, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    logger.info('Database optimizations applied successfully');
  } catch (error) {
    logger.error('Failed to apply database optimizations', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export default {
  QueryPerformanceMonitor,
  OptimizedQueries,
  indexSuggestions,
  applyDatabaseOptimizations
};
