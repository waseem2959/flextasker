/**
 * Task Service
 * 
 * This module provides API methods for task management:
 * - Creating and updating tasks
 * - Searching and filtering tasks
 * - Managing task status
 */

import { ApiResponse, PaginatedApiResponse, Task } from '@/types';
import { apiClient } from './api-client';

/**
 * Task search parameters with string index signature to match apiClient requirements
 */
export interface TaskSearchParams extends Record<string, string | number | boolean | undefined> {
  query?: string;
  status?: string;  // We'll convert TaskStatus enum to string when calling API
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
 * Fetch all tasks with optional filtering
 * 
 * @param params - Search parameters for filtering tasks
 * @returns Promise with array of tasks and pagination info
 */
export function getTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
  return apiClient.get('/tasks', params) as Promise<PaginatedApiResponse<Task>>;
}

/**
 * Fetch a specific task by ID
 * 
 * @param id - The task ID
 * @returns Promise with the task details
 */
export function getTaskById(id: string): Promise<ApiResponse<Task>> {
  return apiClient.get(`/tasks/${id}`);
}

/**
 * Create a new task
 * 
 * @param taskData - The task data
 * @returns Promise with the created task
 */
export function createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
  return apiClient.post('/tasks', taskData);
}

/**
 * Update an existing task
 * 
 * @param id - The task ID
 * @param taskData - The updated task data
 * @returns Promise with the updated task
 */
export function updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
  return apiClient.put(`/tasks/${id}`, taskData);
}

/**
 * Delete a task
 * 
 * @param id - The task ID
 * @returns Promise indicating success or failure
 */
export function deleteTask(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/tasks/${id}`);
}

/**
 * Fetch tasks created by the current user
 * 
 * @param params - Search parameters
 * @returns Promise with array of tasks and pagination info
 */
export function getMyTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
  return apiClient.get('/tasks/my-tasks', params) as Promise<PaginatedApiResponse<Task>>;
}

/**
 * Fetch tasks created by a specific user
 * 
 * @param userId - The user ID
 * @param params - Search parameters
 * @returns Promise with array of tasks and pagination info
 */
export function getUserTasks(userId: string, params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
  return apiClient.get(`/users/${userId}/tasks`, params) as Promise<PaginatedApiResponse<Task>>;
}

/**
 * Fetch tasks assigned to the current user
 * 
 * @param params - Search parameters
 * @returns Promise with array of tasks and pagination info
 */
export function getAssignedTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
  return apiClient.get('/tasks/assigned', params) as Promise<PaginatedApiResponse<Task>>;
}

/**
 * Mark a task as completed
 * 
 * @param id - The task ID
 * @returns Promise with the updated task
 */
export function completeTask(id: string): Promise<ApiResponse<Task>> {
  return apiClient.put(`/tasks/${id}/complete`);
}

/**
 * Cancel a task
 * 
 * @param id - The task ID
 * @param reason - Optional cancellation reason
 * @returns Promise with the updated task
 */
export function cancelTask(id: string, reason?: string): Promise<ApiResponse<Task>> {
  return apiClient.put(`/tasks/${id}/cancel`, { reason });
}

/**
 * Fetch featured tasks
 * 
 * @param limit - Maximum number of tasks to return
 * @returns Promise with array of featured tasks
 */
export function getFeaturedTasks(limit: number = 5): Promise<ApiResponse<Task[]>> {
  return apiClient.get('/tasks/featured', { limit });
}

// Export all functions individually to support tree shaking
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
