/**
 * Task Service
 * 
 * This module provides a comprehensive implementation of all task-related functionality.
 */

import { TaskPriority, TaskStatus } from '../../../shared/types/enums';
import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';

/**
 * Error class for task-specific errors
 */
export class TaskError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TaskError';
  }
}

/**
 * Task Service class that provides all task-related functionality
 */
export class TaskService {
  /**
   * Create a new task
   */
  async createTask(taskData: any): Promise<any> {
    // Validate required fields
    if (!taskData.title || !taskData.description || !taskData.userId) {
      throw new ValidationError('Title, description, and userId are required');
    }

    try {
      // DatabaseQueryBuilder is now imported at the top

      const task = await DatabaseQueryBuilder.create(
        models.task,
        {
          title: taskData.title,
          description: taskData.description,
          ownerId: taskData.userId,
          priority: taskData.priority ?? 'NORMAL',
          location: taskData.location,
          budget: taskData.budget,
          budgetType: taskData.budgetType,
          categoryId: taskData.category,
          deadline: taskData.dueDate ? new Date(taskData.dueDate) : null,
          status: TaskStatus.OPEN
        },
        'Task',
        {
          id: true,
          title: true,
          description: true,
          budget: true,
          status: true,
          location: true,
          createdAt: true,
          deadline: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              averageRating: true
            }
          }
        }
      );

      logger.info('Task created', { taskId: (task as any).id });
      return task;
    } catch (error) {
      logger.error('Error creating task', { error });
      throw error;
    }
  }

  /**
   * Get a task by its ID
   */
  async getTaskById(taskId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    return await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      {
        id: true,
        title: true,
        description: true,
        budget: true,
        budgetType: true,
        status: true,
        priority: true,
        location: true,
        deadline: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            averageRating: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            averageRating: true
          }
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                averageRating: true
              }
            }
          }
        }
      }
    );
  }

  /**
   * Get all tasks with filtering options
   */
  async getTasks(options: any = {}): Promise<any[]> {
    const {
      status,
      userId,
      assignedUserId,
      category,
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build the where clause based on provided criteria
    const where: any = {};
    
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (category) where.category = category;
    
    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Execute the query with pagination
    const { items: tasks } = await DatabaseQueryBuilder.findMany(
      models.task,
      {
        where,
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          status: true,
          location: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              averageRating: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              averageRating: true
            }
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        pagination: { page, skip: (page - 1) * limit, limit }
      },
      'Task'
    );

    return tasks;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, userId: string, updateData: any): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to update the task
    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can update the task');
    }

    // Check if task can be updated
    if ((task as any).status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be updated');
    }

    // Update the task
    const updatedTask = await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      {
        title: updateData.title,
        description: updateData.description,
        budget: updateData.budget,
        budgetType: updateData.budgetType,
        category: updateData.category,
        location: updateData.location,
        deadline: updateData.dueDate ? new Date(updateData.dueDate) : undefined
      },
      'Task'
    );

    logger.info('Task updated', { taskId });
    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Get the current task to check authorization
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true }
    );

    // Check if user is authorized to delete the task
    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can delete the task');
    }

    // Check if task can be deleted
    if ((task as any).status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be deleted');
    }

    // Delete the task
    await DatabaseQueryBuilder.delete(models.task, taskId, 'Task');

    return { success: true, message: 'Task deleted successfully' };
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true, assigneeId: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to complete the task
    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can mark a task as completed');
    }

    // Check if task can be completed
    if ((task as any).status !== TaskStatus.IN_PROGRESS) {
      throw new ValidationError('Only in-progress tasks can be marked as completed');
    }

    if (!(task as any).assigneeId) {
      throw new ValidationError('Task must be assigned to a user before it can be completed');
    }

    // Update the task
    const updatedTask = await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      {
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      },
      'Task'
    );

    logger.info('Task completed', { taskId });
    return updatedTask;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to cancel the task
    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can cancel a task');
    }

    // Check if task can be cancelled
    if (![TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes((task as any).status as TaskStatus)) {
      throw new ValidationError('Only open or in-progress tasks can be cancelled');
    }

    // Update the task
    const updatedTask = await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      {
        status: TaskStatus.CANCELLED,
        cancelledAt: new Date()
      },
      'Task'
    );

    logger.info('Task cancelled', { taskId });
    return updatedTask;
  }

  /**
   * Assign a task to a user
   */
  async assignTask(taskId: string, assignedUserId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to assign the task
    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can assign a task');
    }

    // Check if task can be assigned
    if ((task as any).status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be assigned');
    }

    // Update the task
    const updatedTask = await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      {
        assigneeId: assignedUserId,
        status: TaskStatus.IN_PROGRESS
      },
      'Task'
    );

    logger.info('Task assigned', { taskId, assignedUserId });
    return updatedTask;
  }

  /**
   * Search for tasks based on various criteria
   */
  async searchTasks(searchParams: any): Promise<any[]> {
    const {
      query,
      category,
      minBudget,
      maxBudget,
      status,
      location,
      page = 1,
      limit = 10
    } = searchParams;

    // Build the where clause based on provided criteria
    const where: any = {};
    
    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Filters
    if (category) where.category = category;
    if (status) where.status = status;
    
    // Budget range
    if (minBudget !== undefined || maxBudget !== undefined) {
      where.budget = {};
      if (minBudget !== undefined) where.budget.gte = minBudget;
      if (maxBudget !== undefined) where.budget.lte = maxBudget;
    }
    
    // Location search
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // DatabaseQueryBuilder is now imported at the top

    // Execute the query with pagination
    const { items: tasks } = await DatabaseQueryBuilder.findMany(
      models.task,
      {
        where,
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          budgetType: true,
          location: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              averageRating: true
            }
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        pagination: { page, skip: (page - 1) * limit, limit }
      },
      'Task'
    );
    
    return tasks;
  }

  /**
   * Update task status with optional notes
   */
  async updateTaskStatus(taskId: string, userId: string, status: TaskStatus, notes?: string): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true, assigneeId: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check authorization - task owner or assigned user can update status
    if ((task as any).ownerId !== userId && (task as any).assigneeId !== userId) {
      throw new AuthorizationError('Only task owner or assigned user can update task status');
    }

    // Validate status transitions
    const currentStatus = (task as any).status as TaskStatus;
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.OPEN]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.ACCEPTED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.DISPUTED],
      [TaskStatus.COMPLETED]: [TaskStatus.DISPUTED],
      [TaskStatus.CANCELLED]: [],
      [TaskStatus.DISPUTED]: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED]
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new ValidationError(`Cannot transition from ${currentStatus} to ${status}`);
    }

    // Update task status
    const updateData: any = {
      status,
      statusNotes: notes
    };

    // Set timestamp based on status
    if (status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (status === TaskStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedTask = await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      updateData,
      'Task'
    );

    logger.info('Task status updated', { taskId, oldStatus: currentStatus, newStatus: status, userId });
    return updatedTask;
  }

  /**
   * Get tasks created by the user (client view)
   */
  async getMyTasks(userId: string, options: any = {}): Promise<any> {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const { items: tasks, total } = await DatabaseQueryBuilder.findMany(
      models.task,
      {
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budget: true,
          location: true,
          createdAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              averageRating: true
            }
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        pagination: { page, skip: (page - 1) * limit, limit }
      },
      'Task'
    );

    logger.info('Retrieved user tasks', { userId, count: (tasks as any).length, total });
    
    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get tasks assigned to the user (tasker view)
   */
  async getTasksImWorkingOn(userId: string, options: any = {}): Promise<any> {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where: any = { assignedUserId: userId };
    if (status) {
      where.status = status;
    }

    const { items: tasks, total } = await DatabaseQueryBuilder.findMany(
      models.task,
      {
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budget: true,
          location: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              averageRating: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        pagination: { page, skip: (page - 1) * limit, limit }
      },
      'Task'
    );

    logger.info('Retrieved assigned tasks', { userId, count: (tasks as any).length, total });
    
    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Add attachment to a task
   */
  async addTaskAttachment(taskId: string, userId: string, attachmentData: any): Promise<any> {
    // Get the current task
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, assigneeId: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check authorization - task owner or assigned user can add attachments
    if ((task as any).ownerId !== userId && (task as any).assigneeId !== userId) {
      throw new AuthorizationError('Only task owner or assigned user can add attachments');
    }

    // Validate attachment data
    if (!attachmentData.filename || !attachmentData.fileUrl) {
      throw new ValidationError('Filename and file URL are required');
    }

    // Create attachment record
    const attachment = await DatabaseQueryBuilder.create(
      models.attachment,
      {
        taskId: taskId,
        fileName: attachmentData.filename,
        fileUrl: attachmentData.fileUrl,
        size: attachmentData.fileSize ?? 0,
        contentType: attachmentData.mimeType ?? 'application/octet-stream'
      },
      'Attachment',
      {
        id: true,
        taskId: true,
        fileName: true,
        fileUrl: true,
        size: true,
        contentType: true,
        createdAt: true
      }
    );

    logger.info('Task attachment added', { taskId, attachmentId: (attachment as any).id, userId });
    return attachment;
  }

  /**
   * Remove attachment from a task
   */
  async removeTaskAttachment(taskId: string, attachmentId: string, userId: string): Promise<any> {
    // Get the attachment with task info
    const attachment = await DatabaseQueryBuilder.findById(
      models.attachment,
      attachmentId,
      'Attachment',
      {
        id: true,
        taskId: true,
        task: {
          select: { id: true, ownerId: true, assigneeId: true }
        }
      }
    );

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    if ((attachment as any).taskId !== taskId) {
      throw new ValidationError('Attachment does not belong to this task');
    }

    // Check authorization - only task owner or assigned user can remove attachments
    const canRemove = (attachment as any).task.ownerId === userId ||
                     (attachment as any).task.assigneeId === userId;

    if (!canRemove) {
      throw new AuthorizationError('Insufficient permissions to remove this attachment');
    }

    // Remove attachment
    await DatabaseQueryBuilder.delete(
      models.attachment,
      attachmentId,
      'Attachment'
    );

    logger.info('Task attachment removed', { taskId, attachmentId, userId });
    return { success: true, message: 'Attachment removed successfully' };
  }

  /**
   * Get featured tasks (based on criteria like high budget, recent activity, etc.)
   */
  async getFeaturedTasks(options: any = {}): Promise<any[]> {
    const { limit = 5 } = options;

    // Featured tasks criteria:
    // 1. Open status
    // 2. High budget (top 20% of budgets) OR high priority
    // 3. Recent (created within last 30 days)
    // 4. Has description and good details
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get average budget to determine "high budget" threshold
    const budgetStats = await models.task.aggregate({
      where: {
        status: TaskStatus.OPEN,
        budget: { not: undefined }
      },
      _avg: { budget: true }
    });

    const avgBudget = budgetStats._avg?.budget ?? 0;
    const highBudgetThreshold = avgBudget * 1.5; // 50% above average

    const { items: tasks } = await DatabaseQueryBuilder.findMany(
      models.task,
      {
        where: {
          status: TaskStatus.OPEN,
          createdAt: { gte: thirtyDaysAgo },
          OR: [
            {
              AND: [
                { budget: { not: undefined } },
                { budget: { gte: highBudgetThreshold } }
              ]
            },
            { priority: { in: [TaskPriority.HIGH, TaskPriority.URGENT] } }
          ],
          description: { not: undefined },
          title: { not: undefined }
        },
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          priority: true,
          location: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              averageRating: true
            }
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { budget: 'desc' },
          { createdAt: 'desc' }
        ],
        pagination: { page: 1, skip: 0, limit }
      },
      'Task'
    );

    logger.info('Retrieved featured tasks', { count: (tasks as any).length });
    return tasks;
  }
}

// Export singleton instance for use throughout the application
export const taskService = new TaskService();
