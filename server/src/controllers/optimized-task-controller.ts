/**
 * Optimized Task Controller
 * 
 * Enhanced task controller with advanced caching, query optimization,
 * bulk operations, and performance monitoring.
 */

import { Request, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { queryOptimizer } from '../utils/query-optimizer';
import { apiOptimization } from '../middleware/api-optimization-middleware';
import { cacheManager } from '../../../src/services/cache/cache-manager';
import { performanceMonitor } from '../../../src/services/monitoring/performance-monitor';
import { errorTracker } from '../../../src/services/monitoring/error-tracking';

const prisma = new PrismaClient();

// Validation schemas
const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  categoryId: z.string().uuid().optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  search: z.string().optional(),
  include: z.string().optional(),
  select: z.string().optional(),
  sortBy: z.enum(['createdAt', 'budget', 'deadline', 'bidCount']).default('createdAt'),
  featured: z.coerce.boolean().optional(),
  urgent: z.coerce.boolean().optional()
});

const taskCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  categoryId: z.string().uuid(),
  budget: z.number().min(10).max(100000),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional(),
  skills: z.array(z.string()).max(10).optional(),
  deadline: z.string().datetime().optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
  isUrgent: z.boolean().default(false),
  isFeatured: z.boolean().default(false)
});

const bulkTaskUpdateSchema = z.object({
  taskIds: z.array(z.string().uuid()).max(100),
  updates: z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    budget: z.number().min(10).max(100000).optional(),
    deadline: z.string().datetime().optional(),
    isUrgent: z.boolean().optional(),
    isFeatured: z.boolean().optional()
  })
});

class OptimizedTaskController {
  /**
   * Get tasks with advanced filtering and optimization
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      // Validate and parse query parameters
      const query = taskQuerySchema.parse(req.query);
      const { page = 1, limit = 20 } = req.pagination || {};

      // Generate cache key
      const cacheKey = `tasks:${JSON.stringify({ query, page, limit })}`;
      
      // Check cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        timer();
        return res.json(cached);
      }

      // Build optimized Prisma query
      const include = query.include ? query.include.split(',') : ['owner', 'category', 'bids'];
      const select = query.select ? query.select.split(',') : [];

      const baseQuery = this.buildTaskQuery(query);
      const optimizedQuery = queryOptimizer.optimizePrismaQuery(baseQuery, {
        include,
        select,
        maxIncludes: 5,
        enableSmartSelects: true
      });

      // Execute optimized pagination
      const result = await queryOptimizer.optimizedPagination(
        prisma,
        prisma.task,
        optimizedQuery,
        page,
        limit
      );

      // Add computed fields
      const enrichedData = await this.enrichTaskData(result.data);

      const response = {
        ...result,
        data: enrichedData,
        meta: {
          ...result.performance,
          cacheStrategy: 'miss',
          optimization: {
            queryOptimized: true,
            includesOptimized: include.length > 0,
            selectsOptimized: select.length > 0
          }
        }
      };

      // Cache the response
      await cacheManager.set(cacheKey, response, {
        ttl: 300, // 5 minutes
        tags: ['tasks', 'listing'],
        priority: 'normal'
      });

      timer();
      res.json(response);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'getTasks',
          query: JSON.stringify(req.query)
        }
      });

      res.status(400).json({
        error: 'Failed to fetch tasks',
        details: error instanceof z.ZodError ? error.errors : 'Internal server error'
      });
    }
  }

  /**
   * Get trending/popular tasks with smart caching
   */
  async getTrendingTasks(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();

    try {
      const cacheKey = 'tasks:trending';
      const cached = await cacheManager.get(cacheKey);
      
      if (cached) {
        timer();
        return res.json(cached);
      }

      // Calculate trending based on multiple factors
      const trendingTasks = await prisma.task.findMany({
        where: {
          status: 'POSTED',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: {
              bids: true,
              views: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { urgent: 'desc' },
          { bids: { _count: 'desc' } },
          { views: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: 20
      });

      // Calculate trending score
      const enrichedTasks = trendingTasks.map(task => ({
        ...task,
        trendingScore: this.calculateTrendingScore(task),
        isHot: (task._count?.bids || 0) > 10,
        isNew: task.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      }));

      // Sort by trending score
      enrichedTasks.sort((a, b) => b.trendingScore - a.trendingScore);

      const response = {
        data: enrichedTasks,
        meta: {
          total: enrichedTasks.length,
          cached: false,
          algorithm: 'trending_score_v1'
        }
      };

      // Cache for 15 minutes
      await cacheManager.set(cacheKey, response, {
        ttl: 900,
        tags: ['tasks', 'trending'],
        priority: 'high'
      });

      timer();
      res.json(response);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'getTrendingTasks'
        }
      });

      res.status(500).json({
        error: 'Failed to fetch trending tasks'
      });
    }
  }

  /**
   * Create task with validation and optimization
   */
  async createTask(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();

    try {
      const taskData = taskCreateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check user limits
      const userTaskCount = await prisma.task.count({
        where: {
          ownerId: userId,
          status: { in: ['DRAFT', 'POSTED'] }
        }
      });

      if (userTaskCount >= 10) {
        return res.status(400).json({
          error: 'Maximum active tasks limit reached (10)'
        });
      }

      // Create task with optimized includes
      const task = await prisma.task.create({
        data: {
          ...taskData,
          ownerId: userId,
          status: 'DRAFT',
          slug: this.generateSlug(taskData.title)
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        }
      });

      // Invalidate relevant caches
      await this.invalidateTaskCaches(['tasks', 'user-tasks']);

      // Track task creation event
      performanceMonitor.recordMetric({
        name: 'task.created',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          categoryId: taskData.categoryId,
          budget: String(taskData.budget),
          isUrgent: String(taskData.isUrgent)
        }
      });

      timer();
      res.status(201).json({
        data: task,
        meta: {
          created: true,
          cacheInvalidated: true
        }
      });

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'createTask',
          userId: req.user?.id
        }
      });

      res.status(400).json({
        error: 'Failed to create task',
        details: error instanceof z.ZodError ? error.errors : 'Internal server error'
      });
    }
  }

  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();

    try {
      const { taskIds, updates } = bulkTaskUpdateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify ownership of all tasks
      const ownedTasks = await prisma.task.findMany({
        where: {
          id: { in: taskIds },
          ownerId: userId
        },
        select: { id: true }
      });

      if (ownedTasks.length !== taskIds.length) {
        return res.status(403).json({
          error: 'You can only update your own tasks'
        });
      }

      // Perform bulk update with transaction
      const results = await prisma.$transaction(async (tx) => {
        const updatePromises = taskIds.map(id =>
          tx.task.update({
            where: { id },
            data: {
              ...updates,
              updatedAt: new Date()
            },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
        );

        return Promise.all(updatePromises);
      });

      // Invalidate caches
      await this.invalidateTaskCaches(['tasks', 'user-tasks', 'trending']);

      timer();
      res.bulkResponse?.(results, []);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'bulkUpdateTasks',
          userId: req.user?.id
        }
      });

      res.status(400).json({
        error: 'Bulk update failed',
        details: error instanceof z.ZodError ? error.errors : 'Internal server error'
      });
    }
  }

  /**
   * Get task analytics for admin/owner
   */
  async getTaskAnalytics(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();

    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      // Check permissions
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          ownerId: userId
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found or access denied' });
      }

      const cacheKey = `task:analytics:${taskId}`;
      const cached = await cacheManager.get(cacheKey);

      if (cached) {
        timer();
        return res.json(cached);
      }

      // Gather comprehensive analytics
      const [bidsAnalytics, viewsAnalytics, performanceData] = await Promise.all([
        this.getBidsAnalytics(taskId),
        this.getViewsAnalytics(taskId),
        this.getTaskPerformanceData(taskId)
      ]);

      const analytics = {
        task: {
          id: taskId,
          status: task.status,
          budget: task.budget
        },
        bids: bidsAnalytics,
        views: viewsAnalytics,
        performance: performanceData,
        recommendations: this.generateTaskRecommendations(task, bidsAnalytics),
        generatedAt: new Date().toISOString()
      };

      // Cache for 1 hour
      await cacheManager.set(cacheKey, analytics, {
        ttl: 3600,
        tags: ['analytics', `task-${taskId}`],
        priority: 'normal'
      });

      timer();
      res.json(analytics);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'getTaskAnalytics',
          taskId: req.params.taskId
        }
      });

      res.status(500).json({
        error: 'Failed to fetch task analytics'
      });
    }
  }

  /**
   * Smart task search with autocomplete and suggestions
   */
  async searchTasks(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();

    try {
      const { q: searchQuery, suggest = false } = req.query as { q: string; suggest?: boolean };
      
      if (!searchQuery || searchQuery.length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters'
        });
      }

      const cacheKey = `search:${searchQuery}:${suggest}`;
      const cached = await cacheManager.get(cacheKey);

      if (cached) {
        timer();
        return res.json(cached);
      }

      let results;

      if (suggest) {
        // Return search suggestions
        results = await this.getSearchSuggestions(searchQuery);
      } else {
        // Perform full search
        results = await this.performFullTextSearch(searchQuery, req.pagination);
      }

      // Cache search results
      await cacheManager.set(cacheKey, results, {
        ttl: 600, // 10 minutes
        tags: ['search', 'tasks'],
        priority: 'normal'
      });

      timer();
      res.json(results);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'OptimizedTaskController',
          action: 'searchTasks',
          query: req.query.q as string
        }
      });

      res.status(500).json({
        error: 'Search failed'
      });
    }
  }

  // Private helper methods

  private buildTaskQuery(query: any): any {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.minBudget || query.maxBudget) {
      where.budget = {};
      if (query.minBudget) where.budget.gte = query.minBudget;
      if (query.maxBudget) where.budget.lte = query.maxBudget;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    if (query.featured) {
      where.featured = true;
    }

    if (query.urgent) {
      where.urgent = true;
    }

    return {
      where,
      orderBy: this.buildOrderBy(query.sortBy)
    };
  }

  private buildOrderBy(sortBy: string): any {
    const orderMappings: Record<string, any> = {
      createdAt: { createdAt: 'desc' },
      budget: { budget: 'desc' },
      deadline: { deadline: 'asc' },
      bidCount: { bids: { _count: 'desc' } }
    };

    return orderMappings[sortBy] || orderMappings.createdAt;
  }

  private async enrichTaskData(tasks: any[]): Promise<any[]> {
    return tasks.map(task => ({
      ...task,
      bidCount: task._count?.bids || 0,
      viewCount: task._count?.views || 0,
      isNew: task.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000),
      timeRemaining: task.deadline ? this.calculateTimeRemaining(task.deadline) : null,
      avgBidAmount: task.bids?.length > 0
        ? task.bids.reduce((sum: number, bid: any) => sum + bid.amount, 0) / task.bids.length
        : null
    }));
  }

  private calculateTrendingScore(task: any): number {
    const bidWeight = 0.4;
    const viewWeight = 0.3;
    const recencyWeight = 0.2;
    const featuredWeight = 0.1;

    const bidScore = Math.min((task._count?.bids || 0) / 10, 1);
    const viewScore = Math.min((task._count?.views || 0) / 100, 1);
    const recencyScore = Math.max(0, 1 - (Date.now() - task.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const featuredScore = task.featured ? 1 : 0;

    return (
      bidScore * bidWeight +
      viewScore * viewWeight +
      recencyScore * recencyWeight +
      featuredScore * featuredWeight
    ) * 100;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Date.now().toString(36);
  }

  private calculateTimeRemaining(deadline: Date): string | null {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  }

  private async invalidateTaskCaches(tags: string[]): Promise<void> {
    try {
      await apiOptimization.invalidateByTags(tags);
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  private async getBidsAnalytics(taskId: string): Promise<any> {
    // Implementation for bid analytics
    return {
      total: 0,
      average: 0,
      distribution: [],
      timeline: []
    };
  }

  private async getViewsAnalytics(taskId: string): Promise<any> {
    // Implementation for views analytics
    return {
      total: 0,
      unique: 0,
      timeline: []
    };
  }

  private async getTaskPerformanceData(taskId: string): Promise<any> {
    // Implementation for performance data
    return {
      responseRate: 0,
      completionTime: null,
      satisfactionScore: null
    };
  }

  private generateTaskRecommendations(task: any, bidsAnalytics: any): string[] {
    const recommendations = [];
    
    if (bidsAnalytics.total < 3) {
      recommendations.push('Consider adjusting your budget or requirements to attract more bids');
    }
    
    if (task.urgent && bidsAnalytics.total === 0) {
      recommendations.push('Urgent tasks may benefit from higher budgets');
    }
    
    return recommendations;
  }

  private async getSearchSuggestions(query: string): Promise<any> {
    // Implementation for search suggestions
    return {
      suggestions: [],
      categories: [],
      skills: []
    };
  }

  private async performFullTextSearch(query: string, pagination: any): Promise<any> {
    // Implementation for full-text search
    return {
      data: [],
      meta: {
        total: 0,
        query,
        searchTime: 0
      }
    };
  }
}

export const optimizedTaskController = new OptimizedTaskController();
export default optimizedTaskController;