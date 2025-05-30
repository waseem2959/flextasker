/**
 * Task Service
 * 
 * This module provides a comprehensive implementation of all task-related functionality.
 */

import { prisma } from '../utils/database-utils';
import { TaskStatus } from '../../../shared/types/enums';
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
    if (!taskData.title) {
      throw new ValidationError('Task title is required');
    }

    if (!taskData.description) {
      throw new ValidationError('Task description is required');
    }

    if (!taskData.userId) {
      throw new ValidationError('User ID is required');
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        userId: taskData.userId,
        location: taskData.location,
        budget: taskData.budget,
        budgetType: taskData.budgetType,
        category: taskData.category,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        status: TaskStatus.OPEN
      }
    });

    logger.info('Task created', { taskId: task.id, userId: task.userId });
    return task;
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
}

// Export singleton instance for use throughout the application
export const taskService = new TaskService();
