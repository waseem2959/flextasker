/**
 * Task Service
 * 
 * This service provides business logic for task-related operations.
 * It uses caching to improve performance for frequently accessed data.
 */

import { PrismaClient, Task } from '@prisma/client';
import { cacheService, CachePrefix } from '../utils/cache';
import { logger } from '../utils/logger';
import { monitorError } from '../utils/monitoring';
import { TaskStatus } from '../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  TASK_DETAIL: 60 * 10, // 10 minutes
  TASK_LIST: 60 * 5,    // 5 minutes
  USER_TASKS: 60 * 5,   // 5 minutes
  POPULAR_TASKS: 60 * 30 // 30 minutes
};

/**
 * Task service for task-related operations
 */
export class TaskService {
  /**
   * Get a task by ID with caching
   */
  public async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const cacheKey = `${CachePrefix.TASK}${taskId}`;
      
      // Try to get from cache first
      const cachedTask = await cacheService.get<Task>(cacheKey);
      if (cachedTask) {
        logger.debug('Cache hit for task', { taskId });
        return cachedTask;
      }
      
      // Cache miss, fetch from database
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              averageRating: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              averageRating: true
            }
          },
          category: true,
          bids: {
            include: {
              bidder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  averageRating: true
                }
              }
            }
          },
          attachments: true
        }
      });
      
      if (task) {
        // Cache the result
        await cacheService.set(cacheKey, task, CACHE_TTL.TASK_DETAIL);
        logger.debug('Cached task', { taskId });
      }
      
      return task;
    } catch (error) {
      monitorError(error, { component: 'TaskService.getTaskById', taskId });
      logger.error('Failed to get task', { taskId, error });
      throw error;
    }
  }

  /**
   * Get tasks with filtering, sorting, and pagination
   */
  public async getTasks(params: {
    status?: TaskStatus | TaskStatus[];
    categoryId?: string;
    ownerId?: string;
    assigneeId?: string;
    search?: string;
    minBudget?: number;
    maxBudget?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ tasks: Task[]; total: number }> {
    try {
      const {
        status,
        categoryId,
        ownerId,
        assigneeId,
        search,
        minBudget,
        maxBudget,
        sortBy = 'createdAt',
        sortDir = 'desc',
        page = 1,
        limit = 10
      } = params;
      
      // Build cache key based on params
      const cacheKey = `${CachePrefix.LIST}tasks:${JSON.stringify({
        status,
        categoryId,
        ownerId,
        assigneeId,
        search,
        minBudget,
        maxBudget,
        sortBy,
        sortDir,
        page,
        limit
      })}`;
      
      // Try to get from cache first
      const cachedResult = await cacheService.get<{ tasks: Task[]; total: number }>(cacheKey);
      if (cachedResult) {
        logger.debug('Cache hit for task list', { params });
        return cachedResult;
      }
      
      // Build filter conditions
      const where: any = {};
      
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      if (ownerId) {
        where.ownerId = ownerId;
      }
      
      if (assigneeId) {
        where.assigneeId = assigneeId;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (minBudget !== undefined || maxBudget !== undefined) {
        where.budget = {};
        
        if (minBudget !== undefined) {
          where.budget.gte = minBudget;
        }
        
        if (maxBudget !== undefined) {
          where.budget.lte = maxBudget;
        }
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Fetch data from database
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy: { [sortBy]: sortDir },
          skip,
          take: limit,
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                averageRating: true
              }
            },
            category: true,
            _count: {
              select: { bids: true }
            }
          }
        }),
        prisma.task.count({ where })
      ]);
      
      const result = { tasks, total };
      
      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL.TASK_LIST);
      logger.debug('Cached task list', { params });
      
      return result;
    } catch (error) {
      monitorError(error, { component: 'TaskService.getTasks', params });
      logger.error('Failed to get tasks', { params, error });
      throw error;
    }
  }

  /**
   * Get popular task categories with counts
   */
  public async getPopularCategories(): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.LIST}popular-categories`;
      
      // Try to get from cache first
      const cachedCategories = await cacheService.get<any[]>(cacheKey);
      if (cachedCategories) {
        logger.debug('Cache hit for popular categories');
        return cachedCategories;
      }
      
      // Get categories with task counts
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          icon: true,
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: {
          tasks: {
            _count: 'desc'
          }
        },
        take: 10
      });
      
      // Format result
      const result = categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        taskCount: category._count.tasks
      }));
      
      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL.POPULAR_TASKS);
      logger.debug('Cached popular categories');
      
      return result;
    } catch (error) {
      monitorError(error, { component: 'TaskService.getPopularCategories' });
      logger.error('Failed to get popular categories', { error });
      throw error;
    }
  }

  /**
   * Get tasks for a specific user
   */
  public async getUserTasks(userId: string, role: 'owner' | 'assignee'): Promise<Task[]> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:tasks:${role}`;
      
      // Try to get from cache first
      const cachedTasks = await cacheService.get<Task[]>(cacheKey);
      if (cachedTasks) {
        logger.debug('Cache hit for user tasks', { userId, role });
        return cachedTasks;
      }
      
      // Build filter condition based on role
      const where = role === 'owner' 
        ? { ownerId: userId } 
        : { assigneeId: userId };
      
      // Fetch from database
      const tasks = await prisma.task.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: { bids: true }
          }
        }
      });
      
      // Cache the result
      await cacheService.set(cacheKey, tasks, CACHE_TTL.USER_TASKS);
      logger.debug('Cached user tasks', { userId, role });
      
      return tasks;
    } catch (error) {
      monitorError(error, { component: 'TaskService.getUserTasks', userId, role });
      logger.error('Failed to get user tasks', { userId, role, error });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  public async createTask(taskData: any): Promise<Task> {
    try {
      // Create task in database
      const task = await prisma.task.create({
        data: taskData,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              averageRating: true
            }
          },
          category: true
        }
      });
      
      // Cache the new task
      const cacheKey = `${CachePrefix.TASK}${task.id}`;
      await cacheService.set(cacheKey, task, CACHE_TTL.TASK_DETAIL);
      
      // Invalidate user tasks list cache
      await cacheService.deletePattern(`${CachePrefix.USER}${task.ownerId}:tasks:*`);
      
      // Invalidate task list caches
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
      return task;
    } catch (error) {
      monitorError(error, { component: 'TaskService.createTask', taskData });
      logger.error('Failed to create task', { taskData, error });
      throw error;
    }
  }

  /**
   * Update a task
   */
  public async updateTask(taskId: string, updates: any): Promise<Task> {
    try {
      // Get existing task for cache invalidation
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { ownerId: true, assigneeId: true }
      });
      
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Update task in database
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updates,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              averageRating: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              averageRating: true
            }
          },
          category: true
        }
      });
      
      // Update cache for this task
      const cacheKey = `${CachePrefix.TASK}${taskId}`;
      await cacheService.set(cacheKey, updatedTask, CACHE_TTL.TASK_DETAIL);
      
      // Invalidate related caches
      const userIds = [existingTask.ownerId];
      if (existingTask.assigneeId) userIds.push(existingTask.assigneeId);
      if (updates.assigneeId && updates.assigneeId !== existingTask.assigneeId) {
        userIds.push(updates.assigneeId);
      }
      
      // Invalidate user tasks lists
      for (const userId of userIds) {
        await cacheService.deletePattern(`${CachePrefix.USER}${userId}:tasks:*`);
      }
      
      // Invalidate task list caches
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
      return updatedTask;
    } catch (error) {
      monitorError(error, { component: 'TaskService.updateTask', taskId, updates });
      logger.error('Failed to update task', { taskId, updates, error });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  public async deleteTask(taskId: string): Promise<void> {
    try {
      // Get existing task for cache invalidation
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { ownerId: true, assigneeId: true }
      });
      
      if (!existingTask) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Delete task from database
      await prisma.task.delete({
        where: { id: taskId }
      });
      
      // Delete task from cache
      await cacheService.delete(`${CachePrefix.TASK}${taskId}`);
      
      // Invalidate related caches
      const userIds = [existingTask.ownerId];
      if (existingTask.assigneeId) userIds.push(existingTask.assigneeId);
      
      // Invalidate user tasks lists
      for (const userId of userIds) {
        await cacheService.deletePattern(`${CachePrefix.USER}${userId}:tasks:*`);
      }
      
      // Invalidate task list caches
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
    } catch (error) {
      monitorError(error, { component: 'TaskService.deleteTask', taskId });
      logger.error('Failed to delete task', { taskId, error });
      throw error;
    }
  }
}

// Export singleton instance
export const taskService = new TaskService();

export default taskService;
