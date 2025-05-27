/**
 * Task Controller
 * 
 * Handles HTTP requests related to tasks.
 * It serves as an intermediary between routes and services, improving separation of concerns.
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { taskService } from '../services/task-service';
import { logger } from '../utils/logger';
import { TaskStatus } from '../../../shared/types/enums';
import { ErrorType } from '../../../shared/types/errors';

export class TaskController extends BaseController {
  /**
   * Get all tasks with filtering, pagination, and sorting
   */
  getTasks = this.asyncHandler(async (req: Request, res: Response) => {
    const { 
      status, 
      categoryId, 
      ownerId,
      assigneeId, 
      search, 
      minBudget,
      maxBudget,
      page = '1', 
      limit = '10',
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;
    
    // Parse query parameters
    const parsedStatus = status 
      ? Array.isArray(status)
        ? status.map(s => s as TaskStatus)
        : status as TaskStatus
      : undefined;
    
    const parsedMinBudget = minBudget ? parseFloat(minBudget as string) : undefined;
    const parsedMaxBudget = maxBudget ? parseFloat(maxBudget as string) : undefined;
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    
    // Validate numeric parameters
    if (
      (parsedMinBudget !== undefined && isNaN(parsedMinBudget)) ||
      (parsedMaxBudget !== undefined && isNaN(parsedMaxBudget)) ||
      isNaN(parsedPage) || 
      isNaN(parsedLimit)
    ) {
      return this.sendError(res, {
        type: ErrorType.VALIDATION,
        message: 'Invalid numeric parameter'
      }, 400);
    }
    
    // Get tasks using service with caching
    const result = await taskService.getTasks({
      status: parsedStatus,
      categoryId: categoryId as string,
      ownerId: ownerId as string,
      assigneeId: assigneeId as string,
      search: search as string,
      minBudget: parsedMinBudget,
      maxBudget: parsedMaxBudget,
      sortBy: sortBy as string,
      sortDir: (sortDir as string === 'asc' ? 'asc' : 'desc'),
      page: parsedPage,
      limit: parsedLimit
    });
    
    // Add pagination metadata
    const response = {
      data: result.tasks,
      pagination: {
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(result.total / parsedLimit)
      }
    };
    
    this.log('info', 'Tasks fetched successfully', { 
      count: result.total, 
      filters: req.query 
    });
    return this.sendSuccess(res, response, 'Tasks fetched successfully');
  });
  
  /**
   * Get task by ID
   */
  getTaskById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Fetching task by ID', { taskId: id });
    
    const task = await taskService.getTaskById(id);
    
    if (!task) {
      return this.sendError(res, {
        type: ErrorType.NOT_FOUND,
        message: 'Task not found'
      }, 404);
    }
    
    return this.sendSuccess(res, task, 'Task retrieved successfully');
  });
  
  /**
   * Get popular task categories
   */
  getPopularCategories = this.asyncHandler(async (req: Request, res: Response) => {
    const categories = await taskService.getPopularCategories();
    return this.sendSuccess(res, categories, 'Popular categories retrieved successfully');
  });
  
  /**
   * Get tasks for a specific user
   */
  getUserTasks = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'User ID required'
      }, 401);
    }
    
    const role = req.query.role as string === 'assignee' ? 'assignee' : 'owner';
    
    const tasks = await taskService.getUserTasks(userId, role);
    return this.sendSuccess(res, tasks, 'User tasks retrieved successfully');
  });
  
  /**
   * Create a new task
   */
  createTask = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required'
      }, 401);
    }
    
    const taskData = {
      ...req.body,
      ownerId: userId
    };
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'categoryId', 'budget'];
    for (const field of requiredFields) {
      if (!taskData[field]) {
        return this.sendError(res, {
          type: ErrorType.VALIDATION,
          message: `Missing required field: ${field}`
        }, 400);
      }
    }
    
    // Create task using service with cache management
    const task = await taskService.createTask(taskData);
    
    this.log('info', 'Task created', { taskId: task.id, userId });
    
    return this.sendSuccess(res, task, 'Task created successfully', 201);
  });

  /**
   * Update a task
   */
  updateTask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required'
      }, 401);
    }
    
    // Check if task exists and user is authorized
    const existingTask = await taskService.getTaskById(id);
    
    if (!existingTask) {
      return this.sendError(res, {
        type: ErrorType.NOT_FOUND,
        message: 'Task not found'
      }, 404);
    }
    
    if (existingTask.ownerId !== userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHORIZATION,
        message: 'Not authorized to update this task'
      }, 403);
    }
    
    // Update task using service with cache management
    const updatedTask = await taskService.updateTask(id, req.body);
    
    this.log('info', 'Task updated', { taskId: id, userId });
    
    return this.sendSuccess(res, updatedTask, 'Task updated successfully');
  });

  /**
   * Update task status
   */
  updateTaskStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required'
      }, 401);
    }
    
    if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
      return this.sendError(res, {
        type: ErrorType.VALIDATION,
        message: 'Invalid task status'
      }, 400);
    }
    
    // Check if task exists and user is authorized
    const existingTask = await taskService.getTaskById(id);
    
    if (!existingTask) {
      return this.sendError(res, {
        type: ErrorType.NOT_FOUND,
        message: 'Task not found'
      }, 404);
    }
    
    // Only owner or assignee can update status
    if (existingTask.ownerId !== userId && existingTask.assigneeId !== userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHORIZATION,
        message: 'Not authorized to update this task status'
      }, 403);
    }
    
    // Update task status
    const updatedTask = await taskService.updateTask(id, { status });
    
    this.log('info', 'Task status updated', { taskId: id, userId, status });
    
    return this.sendSuccess(res, updatedTask, 'Task status updated successfully');
  });

  /**
   * Delete a task
   */
  deleteTask = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'Authentication required'
      }, 401);
    }
    
    // Check if task exists and user is authorized
    const existingTask = await taskService.getTaskById(id);
    
    if (!existingTask) {
      return this.sendError(res, {
        type: ErrorType.NOT_FOUND,
        message: 'Task not found'
      }, 404);
    }
    
    if (existingTask.ownerId !== userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHORIZATION,
        message: 'Not authorized to delete this task'
      }, 403);
    }
    
    // Delete task using service with cache management
    await taskService.deleteTask(id);
    
    this.log('info', 'Task deleted', { taskId: id, userId });
    
    return this.sendSuccess(res, { message: 'Task deleted successfully' });
  });

  /**
   * Get tasks by user
   */
  getTasksByUser = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.user?.id;
    
    if (!userId) {
      return this.sendError(res, {
        type: ErrorType.AUTHENTICATION,
        message: 'User ID required'
      }, 401);
    }
    
    const type = req.query.type as 'posted' | 'assigned' | 'all' || 'all';
    const statusParam = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Convert string status to TaskStatus enum if provided
    const status = statusParam ? statusParam as TaskStatus : undefined;
    
    // Determine which role to use based on type
    const role = type === 'assigned' ? 'assignee' : 'owner';
    
    this.log('info', 'Fetching tasks by user', { userId, type, status });
    
    // Use our getUserTasks method which is already cached
    const tasks = await taskService.getUserTasks(userId, role);
    
    // Filter by status if provided
    const filteredTasks = status ? tasks.filter(task => task.status === status) : tasks;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    const response = {
      data: paginatedTasks,
      pagination: {
        total: filteredTasks.length,
        page,
        limit,
        totalPages: Math.ceil(filteredTasks.length / limit)
      }
    };
    
    return this.sendSuccess(res, response, 'Tasks retrieved successfully');
  });
}
