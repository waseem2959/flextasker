/**
 * Enhanced Task Controller
 * 
 * Consolidated task controller combining basic functionality with advanced features:
 * - Optimized queries and caching
 * - Bulk operations
 * - Performance monitoring
 * - Comprehensive validation
 * - Error tracking
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { TaskStatus, UserRole } from '../../../shared/types/enums';
import { BaseController } from './base-controller';
import { taskService } from '../services/task-service';
import { cacheManager } from '../../../src/services/cache/cache-manager';
import { performanceMonitor } from '../../../src/services/monitoring/performance-monitor';
import { logger } from '../utils/logger';

// Enhanced validation schemas
const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  categoryId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  urgent: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'budget', 'deadline', 'bidCount', 'title']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  include: z.string().optional()
});

const taskCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  categoryId: z.string().uuid(),
  budget: z.number().min(10).max(100000),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(5).max(500)
  }).optional(),
  skills: z.array(z.string()).max(10).optional(),
  deadline: z.string().datetime().optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
  isUrgent: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  requirements: z.string().optional()
});

const taskUpdateSchema = taskCreateSchema.partial().omit({ categoryId: true });

const bulkOperationSchema = z.object({
  operation: z.enum(['status_update', 'delete', 'feature', 'archive']),
  taskIds: z.array(z.string().uuid()).min(1).max(50),
  data: z.record(z.any()).optional()
});

export class EnhancedTaskController extends BaseController {
  /**
   * Get all tasks with advanced filtering, caching, and optimization
   */
  getTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Validate query parameters
      const validatedQuery = taskQuerySchema.parse(req.query);
      
      // Generate cache key
      const cacheKey = `tasks:${JSON.stringify(validatedQuery)}:${req.user?.id || 'anonymous'}`;
      
      // Try to get from cache first
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        performanceMonitor.recordMetric('task_controller_cache_hit', Date.now() - startTime);
        return res.json({
          ...cachedResult,
          fromCache: true,
          timestamp: new Date().toISOString()
        });
      }

      // Build filter object
      const filters: any = {};
      
      if (validatedQuery.status) {
        filters.status = validatedQuery.status;
      }
      
      if (validatedQuery.categoryId) {
        filters.categoryId = validatedQuery.categoryId;
      }
      
      if (validatedQuery.ownerId) {
        filters.ownerId = validatedQuery.ownerId;
      }
      
      if (validatedQuery.assigneeId) {
        filters.assigneeId = validatedQuery.assigneeId;
      }
      
      if (validatedQuery.minBudget || validatedQuery.maxBudget) {
        filters.budget = {};
        if (validatedQuery.minBudget) filters.budget.gte = validatedQuery.minBudget;
        if (validatedQuery.maxBudget) filters.budget.lte = validatedQuery.maxBudget;
      }
      
      if (validatedQuery.search) {
        filters.OR = [
          { title: { contains: validatedQuery.search, mode: 'insensitive' } },
          { description: { contains: validatedQuery.search, mode: 'insensitive' } }
        ];
      }
      
      if (validatedQuery.skills) {
        const skillsArray = validatedQuery.skills.split(',').map(s => s.trim());
        filters.skills = { hasSome: skillsArray };
      }
      
      if (validatedQuery.featured !== undefined) {
        filters.isFeatured = validatedQuery.featured;
      }
      
      if (validatedQuery.urgent !== undefined) {
        filters.isUrgent = validatedQuery.urgent;
      }

      // Get tasks with optimized query
      const tasks = await taskService.getTasks({
        filters,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit
        },
        sorting: {
          field: validatedQuery.sortBy,
          direction: validatedQuery.sortDir
        },
        include: validatedQuery.include?.split(',') || ['category', 'owner']
      });

      // Cache the result (5 minutes for task lists)
      await cacheManager.set(cacheKey, tasks, { ttl: 300000 });

      performanceMonitor.recordMetric('task_controller_db_query', Date.now() - startTime);
      
      res.json({
        ...tasks,
        fromCache: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error fetching tasks:', error);
      throw error;
    }
  });

  /**
   * Get single task by ID with caching
   */
  getTaskById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { include } = req.query;
    
    if (!id) {
      return this.sendError(res, 'Task ID is required', 400, 'VALIDATION_ERROR');
    }

    const cacheKey = `task:${id}:${include || 'basic'}`;
    
    // Try cache first
    const cachedTask = await cacheManager.get(cacheKey);
    if (cachedTask) {
      return res.json({ ...cachedTask, fromCache: true });
    }

    const task = await taskService.getTaskById(id, {
      include: typeof include === 'string' ? include.split(',') : ['category', 'owner', 'assignee', 'bids']
    });

    if (!task) {
      return this.sendError(res, 'Task not found', 404, 'NOT_FOUND');
    }

    // Cache for 10 minutes
    await cacheManager.set(cacheKey, task, { ttl: 600000 });

    res.json({ ...task, fromCache: false });
  });

  /**
   * Create new task with enhanced validation
   */
  createTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    
    if (!userId) {
      return this.sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    try {
      // Validate request body
      const validatedData = taskCreateSchema.parse(req.body);
      
      // Create task
      const task = await taskService.createTask({
        ...validatedData,
        ownerId: userId
      });

      // Invalidate related caches
      await this.invalidateTaskCaches();

      // Track creation metric
      performanceMonitor.recordEvent('task_created', {
        userId,
        taskId: task.id,
        category: validatedData.categoryId,
        budget: validatedData.budget
      });

      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });

    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  });

  /**
   * Update task with validation and cache invalidation
   */
  updateTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return this.sendError(res, 'Task ID is required', 400, 'VALIDATION_ERROR');
    }

    try {
      // Validate request body
      const validatedData = taskUpdateSchema.parse(req.body);

      // Check if user can update this task
      const existingTask = await taskService.getTaskById(id);
      if (!existingTask) {
        return this.sendError(res, 'Task not found', 404, 'NOT_FOUND');
      }

      if (existingTask.ownerId !== userId && userRole !== UserRole.ADMIN) {
        return this.sendError(res, 'Not authorized to update this task', 403, 'FORBIDDEN');
      }

      // Update task
      const updatedTask = await taskService.updateTask(id, validatedData);

      // Invalidate caches
      await this.invalidateTaskCaches(id);

      res.json({
        success: true,
        data: updatedTask,
        message: 'Task updated successfully'
      });

    } catch (error) {
      logger.error('Error updating task:', error);
      throw error;
    }
  });

  /**
   * Delete task with proper authorization
   */
  deleteTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!id) {
      return this.sendError(res, 'Task ID is required', 400, 'VALIDATION_ERROR');
    }

    // Check authorization
    const task = await taskService.getTaskById(id);
    if (!task) {
      return this.sendError(res, 'Task not found', 404, 'NOT_FOUND');
    }

    if (task.ownerId !== userId && userRole !== UserRole.ADMIN) {
      return this.sendError(res, 'Not authorized to delete this task', 403, 'FORBIDDEN');
    }

    // Check if task can be deleted (no active bids, not in progress)
    if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.COMPLETED) {
      return this.sendError(res, 'Cannot delete task in current status', 400, 'INVALID_OPERATION');
    }

    await taskService.deleteTask(id);

    // Invalidate caches
    await this.invalidateTaskCaches(id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  });

  /**
   * Bulk operations for tasks
   */
  bulkOperation = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userRole = req.user?.role;
    
    if (userRole !== UserRole.ADMIN) {
      return this.sendError(res, 'Admin access required for bulk operations', 403, 'FORBIDDEN');
    }

    try {
      const validatedData = bulkOperationSchema.parse(req.body);
      const { operation, taskIds, data } = validatedData;

      let results: any = {};

      switch (operation) {
        case 'status_update':
          if (!data?.status || !Object.values(TaskStatus).includes(data.status)) {
            return this.sendError(res, 'Valid status required for status update', 400, 'VALIDATION_ERROR');
          }
          results = await taskService.bulkUpdateStatus(taskIds, data.status);
          break;

        case 'delete':
          results = await taskService.bulkDelete(taskIds);
          break;

        case 'feature':
          results = await taskService.bulkUpdateFeatured(taskIds, data?.featured || true);
          break;

        case 'archive':
          results = await taskService.bulkArchive(taskIds);
          break;

        default:
          return this.sendError(res, 'Invalid bulk operation', 400, 'VALIDATION_ERROR');
      }

      // Invalidate all task caches
      await this.invalidateTaskCaches();

      res.json({
        success: true,
        data: results,
        message: `Bulk ${operation} completed successfully`
      });

    } catch (error) {
      logger.error('Error in bulk operation:', error);
      throw error;
    }
  });

  /**
   * Get task statistics
   */
  getTaskStats = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const cacheKey = 'task_stats:global';
    
    // Try cache first
    const cachedStats = await cacheManager.get(cacheKey);
    if (cachedStats) {
      return res.json({ ...cachedStats, fromCache: true });
    }

    const stats = await taskService.getTaskStatistics();

    // Cache for 15 minutes
    await cacheManager.set(cacheKey, stats, { ttl: 900000 });

    res.json({ ...stats, fromCache: false });
  });

  /**
   * Search tasks with full-text search
   */
  searchTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q, category, location, minBudget, maxBudget, page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return this.sendError(res, 'Search query must be at least 2 characters', 400, 'VALIDATION_ERROR');
    }

    const searchParams = {
      query: q.trim(),
      category: category as string,
      location: location as string,
      minBudget: minBudget ? parseFloat(minBudget as string) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget as string) : undefined,
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 50) // Max 50 results
    };

    const results = await taskService.searchTasks(searchParams);

    res.json({
      success: true,
      data: results,
      searchParams
    });
  });

  /**
   * Helper method to invalidate task-related caches
   */
  private async invalidateTaskCaches(taskId?: string): Promise<void> => {
    try {
      // Clear general task list caches
      await cacheManager.delete('tasks:*');
      await cacheManager.delete('task_stats:*');
      
      // Clear specific task cache if ID provided
      if (taskId) {
        await cacheManager.delete(`task:${taskId}:*`);
      }
    } catch (error) {
      logger.warn('Failed to invalidate task caches:', error);
    }
  }
}

// Export singleton instance
export const enhancedTaskController = new EnhancedTaskController();