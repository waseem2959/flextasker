/**
 * Task Service
 * 
 * This module provides a comprehensive implementation of all task-related functionality.
 */

import { TaskPriority, TaskStatus } from '../../../shared/types/enums';
import { prisma } from '../utils/database-utils';
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
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          owner: {
            connect: { id: taskData.userId }
          },
          priority: taskData.priority ?? 'NORMAL',
          location: taskData.location,
          budget: taskData.budget,
          budgetType: taskData.budgetType,
          category: taskData.category,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          status: TaskStatus.OPEN
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              averageRating: true
            }
          }
        }
      });

      logger.info('Task created', { taskId: task.id });
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
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            averageRating: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            averageRating: true
          }
        },
        bids: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                averageRating: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
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
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            averageRating: true
          }
        },
        assignedUser: {
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
      skip: (page - 1) * limit,
      take: limit
    });

    return tasks;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, userId: string, updateData: any): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to update the task
    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can update the task');
    }

    // Check if task can be updated
    if (task.status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be updated');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: updateData.title,
        description: updateData.description,
        budget: updateData.budget,
        budgetType: updateData.budgetType,
        category: updateData.category,
        location: updateData.location,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined
      }
    });

    logger.info('Task updated', { taskId });
    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to delete the task
    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can delete the task');
    }

    // Check if task can be deleted
    if (task.status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be deleted');
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId }
    });

    logger.info('Task deleted', { taskId });
    return { success: true, message: 'Task deleted successfully' };
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true, assignedUserId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to complete the task
    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can mark a task as completed');
    }

    // Check if task can be completed
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new ValidationError('Only in-progress tasks can be marked as completed');
    }

    if (!task.assignedUserId) {
      throw new ValidationError('Task must be assigned to a user before it can be completed');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    logger.info('Task completed', { taskId });
    return updatedTask;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to cancel the task
    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can cancel a task');
    }

    // Check if task can be cancelled
    if (![TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes(task.status as TaskStatus)) {
      throw new ValidationError('Only open or in-progress tasks can be cancelled');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
        cancelledAt: new Date()
      }
    });

    logger.info('Task cancelled', { taskId });
    return updatedTask;
  }

  /**
   * Assign a task to a user
   */
  async assignTask(taskId: string, assignedUserId: string, userId: string): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if user is authorized to assign the task
    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can assign a task');
    }

    // Check if task can be assigned
    if (task.status !== TaskStatus.OPEN) {
      throw new ValidationError('Only open tasks can be assigned');
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedUserId,
        status: TaskStatus.IN_PROGRESS
      }
    });

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
    
    // Execute the query with pagination
    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    return tasks;
  }

  /**
   * Update task status with optional notes
   */
  async updateTaskStatus(taskId: string, userId: string, status: TaskStatus, notes?: string): Promise<any> {
    // Get the current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true, assignedUserId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check authorization - task owner or assigned user can update status
    if (task.userId !== userId && task.assignedUserId !== userId) {
      throw new AuthorizationError('Only task owner or assigned user can update task status');
    }

    // Validate status transitions
    const currentStatus = task.status as TaskStatus;
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

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      }
    });

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

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedUser: {
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
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    logger.info('Retrieved user tasks', { userId, count: tasks.length, total });
    
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

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              averageRating: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.task.count({ where })
    ]);

    logger.info('Retrieved assigned tasks', { userId, count: tasks.length, total });
    
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
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, assignedUserId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check authorization - task owner or assigned user can add attachments
    if (task.userId !== userId && task.assignedUserId !== userId) {
      throw new AuthorizationError('Only task owner or assigned user can add attachments');
    }

    // Validate attachment data
    if (!attachmentData.filename || !attachmentData.fileUrl) {
      throw new ValidationError('Filename and file URL are required');
    }

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        task: {
          connect: { id: taskId }
        },
        fileName: attachmentData.filename,
        fileUrl: attachmentData.fileUrl,
        size: attachmentData.fileSize ?? 0,
        contentType: attachmentData.mimeType ?? 'application/octet-stream'
      }
    });

    logger.info('Task attachment added', { taskId, attachmentId: attachment.id, userId });
    return attachment;
  }

  /**
   * Remove attachment from a task
   */
  async removeTaskAttachment(taskId: string, attachmentId: string, userId: string): Promise<any> {
    // Get the attachment with task info
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          select: { id: true, userId: true, assignedUserId: true }
        }
      }
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    if (attachment.taskId !== taskId) {
      throw new ValidationError('Attachment does not belong to this task');
    }

    // Check authorization - only task owner or assigned user can remove attachments
    const canRemove = attachment.task.userId === userId || 
                     attachment.task.assignedUserId === userId;

    if (!canRemove) {
      throw new AuthorizationError('Insufficient permissions to remove this attachment');
    }

    // Remove attachment
    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

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
    const budgetStats = await prisma.task.aggregate({
      where: {
        status: TaskStatus.OPEN,
        budget: { not: undefined }
      },
      _avg: { budget: true }
    });

    const avgBudget = budgetStats._avg?.budget ?? 0;
    const highBudgetThreshold = avgBudget * 1.5; // 50% above average

    const tasks = await prisma.task.findMany({
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
      include: {
        user: {
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
      take: limit
    });

    logger.info('Retrieved featured tasks', { count: tasks.length });
    return tasks;
  }
}

// Export singleton instance for use throughout the application
export const taskService = new TaskService();
