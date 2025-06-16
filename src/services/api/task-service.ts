/**
 * Task Service
 *
 * This module provides API methods for task management:
 * - Creating and updating tasks
 * - Searching and filtering tasks
 * - Managing task status
 */

import { ApiResponse, PaginatedApiResponse, Task } from '@/types';
import { BaseApiService, BaseSearchParams } from './base-api-service';

/**
 * Task search parameters extending base search params
 */
export interface TaskSearchParams extends BaseSearchParams {
  status?: string;  // We'll convert TaskStatus enum to string when calling API
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  userId?: string;
}

/**
 * Create task request
 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  category: string;
  budget?: number;
  budgetType?: string;  // String representation of BudgetType enum
  location?: string;
  dueDate?: string;
  attachments?: string[];
  skills?: string[];
}

/**
 * Update task request
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: string;
  budget?: number;
  budgetType?: string;  // String representation of BudgetType enum
  location?: string;
  status?: string;      // String representation of TaskStatus enum
  dueDate?: string;
  attachments?: string[];
  skills?: string[];
}

/**
 * Task API Service Class
 */
class TaskApiService extends BaseApiService<Task, CreateTaskRequest, UpdateTaskRequest, TaskSearchParams> {
  constructor() {
    super('/tasks');
  }

  /**
   * Get tasks with alias for backward compatibility
   */
  async getTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    return this.getAll(params);
  }

  /**
   * Get task by ID with alias for backward compatibility
   */
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return this.getById(id);
  }

  /**
   * Create task with alias for backward compatibility
   */
  async createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return this.create(taskData);
  }

  /**
   * Update task with alias for backward compatibility
   */
  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return this.update(id, taskData);
  }

  /**
   * Delete task with alias for backward compatibility
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Get current user's tasks
   */
  async getMyTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    return this.getMy(params);
  }

  /**
   * Get tasks by user ID
   */
  async getUserTasks(userId: string, params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    return this.getByUserId(userId, params);
  }

  /**
   * Get tasks assigned to current user
   */
  async getAssignedTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    return this.customGet('/assigned', params) as Promise<PaginatedApiResponse<Task>>;
  }

  /**
   * Mark a task as completed
   */
  async completeTask(id: string): Promise<ApiResponse<Task>> {
    return this.customPut(`/${id}/complete`);
  }

  /**
   * Cancel a task
   */
  async cancelTask(id: string, reason?: string): Promise<ApiResponse<Task>> {
    return this.customPut(`/${id}/cancel`, { reason });
  }

  /**
   * Get featured tasks
   */
  async getFeaturedTasks(limit: number = 5): Promise<ApiResponse<Task[]>> {
    return this.customGet('/featured', { limit });
  }
}

// Create service instance
const taskApiService = new TaskApiService();

// Export individual functions for backward compatibility
export const getTasks = (params?: TaskSearchParams) => taskApiService.getTasks(params);
export const getTaskById = (id: string) => taskApiService.getTaskById(id);
export const createTask = (taskData: CreateTaskRequest) => taskApiService.createTask(taskData);
export const updateTask = (id: string, taskData: UpdateTaskRequest) => taskApiService.updateTask(id, taskData);
export const deleteTask = (id: string) => taskApiService.deleteTask(id);
export const getMyTasks = (params?: TaskSearchParams) => taskApiService.getMyTasks(params);
export const getUserTasks = (userId: string, params?: TaskSearchParams) => taskApiService.getUserTasks(userId, params);
export const getAssignedTasks = (params?: TaskSearchParams) => taskApiService.getAssignedTasks(params);
export const completeTask = (id: string) => taskApiService.completeTask(id);
export const cancelTask = (id: string, reason?: string) => taskApiService.cancelTask(id, reason);
export const getFeaturedTasks = (limit?: number) => taskApiService.getFeaturedTasks(limit);

// Export service object for tree shaking
export const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
  getUserTasks,
  getAssignedTasks,
  completeTask,
  cancelTask,
  getFeaturedTasks
};
