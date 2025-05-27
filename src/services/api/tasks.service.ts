/**
 * Enhanced Task API Service
 * 
 * This service handles all API requests related to tasks, including
 * creating, updating, fetching, and searching tasks. It uses the centralized
 * API client for making HTTP requests with improved TypeScript patterns,
 * error handling, and proper type checking.
 */

import { apiClient } from './base-client';
import { Task } from '@/types';
import {
  ApiResponse,
  PaginatedApiResponse,
  TaskSearchParams,
  CreateTaskRequest,
  UpdateTaskRequest
} from '@/types/api';

/**
 * Enhanced Task API Service Class
 * Provides methods for interacting with task-related endpoints
 * with improved TypeScript patterns and error handling
 */
class TaskService {
  private readonly baseUrl = '/api/v1/tasks';

  /**
   * Fetch all tasks with optional filtering
   * 
   * @param params - Search parameters for filtering tasks
   * @returns Promise with array of tasks and pagination info
   */
  async getTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Fetch a specific task by ID
   * 
   * @param id - The task ID
   * @returns Promise with the task details
   */
  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new task
   * 
   * @param taskData - The data for the new task
   * @returns Promise with the created task
   */
  async createTask(taskData: CreateTaskRequest): Promise<ApiResponse<Task>> {
    const response = await apiClient.post(this.baseUrl, taskData);
    return response.data;
  }

  /**
   * Update an existing task
   * 
   * @param id - The task ID to update
   * @param taskData - The data to update
   * @returns Promise with the updated task
   */
  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, taskData);
    return response.data;
  }

  /**
   * Delete a task
   * 
   * @param id - The task ID to delete
   * @returns Promise with success message
   */
  async deleteTask(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Fetch tasks posted by the current user
   * 
   * @param params - Optional filtering parameters
   * @returns Promise with array of tasks and pagination info
   */
  async getMyTasks(params?: TaskSearchParams): Promise<PaginatedApiResponse<Task>> {
    const response = await apiClient.get(`${this.baseUrl}/my`, { params });
    return response.data;
  }

  /**
   * Mark a task as completed
   * 
   * @param id - The task ID to mark as completed
   * @returns Promise with the updated task
   */
  async completeTask(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/complete`);
    return response.data;
  }

  /**
   * Cancel a task
   * 
   * @param id - The task ID to cancel
   * @param reason - Reason for cancellation
   * @returns Promise with the updated task
   */
  async cancelTask(id: string, reason: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/cancel`, { reason });
    return response.data;
  }
}

// Export a singleton instance
export const taskService = new TaskService();
