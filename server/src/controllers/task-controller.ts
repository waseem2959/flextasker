/**
 * Task Controller
 * 
 * Handles HTTP requests related to tasks.
 * It serves as an intermediary between routes and services, improving separation of concerns.
 */

import { taskService } from '../services/task-service';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { TaskStatus } from '../../../shared/types/enums';
import { ErrorType } from '../utils/error-utils';
import { BaseController } from './base-controller';

export class TaskController extends BaseController {
  /**
   * Get all tasks with filtering, pagination, and sorting
   */
  getTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    
    // Parse status parameter
    let parsedStatus: TaskStatus | TaskStatus[] | undefined;
    if (status) {
      parsedStatus = Array.isArray(status) 
        ? status.map(s => s as TaskStatus) 
        : status as TaskStatus;
    }
    
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
      return this.sendError(
        res, 
        'Invalid numeric parameters', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    // Build filter options
    const options = {
      status: parsedStatus,
      userId: ownerId as string,
      assignedUserId: assigneeId as string,
      category: categoryId as string,
      search: search as string,
      minBudget: parsedMinBudget,
      maxBudget: parsedMaxBudget,
      page: parsedPage,
      limit: parsedLimit,
      sortBy: sortBy as string,
      sortOrder: sortDir as 'asc' | 'desc'
    };
    
    logger.info('Fetching tasks with filters', { options });
    const tasks = await taskService.getTasks(options);
    
    this.sendSuccess(res, tasks, 'Tasks retrieved successfully');
  });

  /**
   * Get a task by ID
   */
  getTaskById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    
    logger.info('Fetching task by ID', { taskId });
    const task = await taskService.getTaskById(taskId);
    
    this.sendSuccess(res, task, 'Task retrieved successfully');
  });

  /**
   * Create a new task
   */
  createTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const taskData = {
      ...req.body,
      userId
    };
    
    logger.info('Creating new task', { userId });
    const task = await taskService.createTask(taskData);
    
    this.sendSuccess(res, task, 'Task created successfully', 201);
  });

  /**
   * Update a task
   */
  updateTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const updateData = req.body;
    
    logger.info('Updating task', { taskId, userId });
    const task = await taskService.updateTask(taskId, userId, updateData);
    
    this.sendSuccess(res, task, 'Task updated successfully');
  });

  /**
   * Delete a task
   */
  deleteTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    
    logger.info('Deleting task', { taskId, userId });
    const result = await taskService.deleteTask(taskId, userId);
    
    this.sendSuccess(res, result, 'Task deleted successfully');
  });

  /**
   * Complete a task
   */
  completeTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    
    logger.info('Completing task', { taskId, userId });
    const task = await taskService.completeTask(taskId, userId);
    
    this.sendSuccess(res, task, 'Task marked as completed');
  });

  /**
   * Cancel a task
   */
  cancelTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    
    logger.info('Cancelling task', { taskId, userId });
    const task = await taskService.cancelTask(taskId, userId);
    
    this.sendSuccess(res, task, 'Task cancelled successfully');
  });

  /**
   * Assign a task to a user
   */
  assignTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const { assignedUserId } = req.body;
    
    if (!assignedUserId) {
      return this.sendError(
        res, 
        'Assigned user ID is required', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    logger.info('Assigning task', { taskId, userId, assignedUserId });
    const task = await taskService.assignTask(taskId, assignedUserId, userId);
    
    this.sendSuccess(res, task, 'Task assigned successfully');
  });
  /**
   * Search for tasks
   */
  searchTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      query,
      category,
      minBudget,
      maxBudget,
      status,
      location,
      page = '1',
      limit = '10'
    } = req.query;
    
    // Parse numeric parameters
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
      return this.sendError(
        res, 
        'Invalid numeric parameters', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    // Build search parameters
    const searchParams = {
      query: query as string,
      category: category as string,
      minBudget: parsedMinBudget,
      maxBudget: parsedMaxBudget,
      status: status as TaskStatus,
      location: location as string,
      page: parsedPage,
      limit: parsedLimit
    };
    
    logger.info('Searching tasks', { searchParams });
    const tasks = await taskService.searchTasks(searchParams);
    
    this.sendSuccess(res, tasks, 'Search results retrieved successfully');
  });

  /**
   * Update task status
   */
  updateTaskStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const { status, notes } = req.body;
    
    logger.info('Updating task status', { taskId, userId, status });
    const task = await taskService.updateTaskStatus(taskId, userId, status, notes);
    
    this.sendSuccess(res, task, 'Task status updated successfully');
  });

  /**
   * Get my tasks (client view)
   */
  getMyTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const {
      status,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    
    // Validate numeric parameters
    if (isNaN(parsedPage) || isNaN(parsedLimit)) {
      return this.sendError(
        res, 
        'Invalid pagination parameters', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    const options = {
      status: status as TaskStatus,
      page: parsedPage,
      limit: parsedLimit,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };
    
    logger.info('Fetching user tasks', { userId, options });
    const result = await taskService.getMyTasks(userId, options);
    
    this.sendSuccess(res, result, 'Tasks retrieved successfully');
  });

  /**
   * Get tasks I'm working on (tasker view)
   */
  getTasksImWorkingOn = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const {
      status,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    
    // Validate numeric parameters
    if (isNaN(parsedPage) || isNaN(parsedLimit)) {
      return this.sendError(
        res, 
        'Invalid pagination parameters', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    const options = {
      status: status as TaskStatus,
      page: parsedPage,
      limit: parsedLimit,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };
    
    logger.info('Fetching assigned tasks', { userId, options });
    const result = await taskService.getTasksImWorkingOn(userId, options);
    
    this.sendSuccess(res, result, 'Assigned tasks retrieved successfully');
  });

  /**
   * Add task attachment
   */
  addTaskAttachment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const userId = req.user!.id;
    const attachmentData = req.body;
    
    // Validate required fields
    if (!attachmentData.filename || !attachmentData.fileUrl) {
      return this.sendError(
        res, 
        'Filename and file URL are required', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    logger.info('Adding task attachment', { taskId, userId, filename: attachmentData.filename });
    const attachment = await taskService.addTaskAttachment(taskId, userId, attachmentData);
    
    this.sendSuccess(res, attachment, 'Attachment added successfully', 201);
  });

  /**
   * Remove task attachment
   */
  removeTaskAttachment = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const attachmentId = req.params.attachmentId;
    const userId = req.user!.id;
    
    logger.info('Removing task attachment', { taskId, attachmentId, userId });
    const result = await taskService.removeTaskAttachment(taskId, attachmentId, userId);
    
    this.sendSuccess(res, result, 'Attachment removed successfully');
  });

  /**
   * Get featured tasks
   */
  getFeaturedTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { limit = '5' } = req.query;
    
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10) {
      return this.sendError(
        res, 
        'Limit must be between 1 and 10', 
        400, 
        ErrorType.VALIDATION
      );
    }
    
    const options = { limit: parsedLimit };
    
    logger.info('Fetching featured tasks', { options });
    const tasks = await taskService.getFeaturedTasks(options);
    
    this.sendSuccess(res, tasks, 'Featured tasks retrieved successfully');
  });
}

// Export controller instance
export const taskController = new TaskController();
