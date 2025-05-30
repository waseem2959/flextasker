/**
 * API Services Index
 * 
 * This file exports all API services with enhanced TypeScript patterns
 * to provide better type safety and error handling throughout the application.
 * 
 * Example usage:
 * ```tsx
 * // Using API services:
 * import { apiServices } from '@/services/api';
 * 
 * const fetchTasks = async () => {
 *   const response = await apiServices.task.getTasks();
 *   setTasks(response.data);
 * };
 * 
 * // Using specific service directly:
 * import { taskService } from '@/services/api';
 * 
 * const fetchTask = async (id) => {
 *   const response = await taskService.getTaskById(id);
 *   setTask(response.data);
 * };
 * 
 * // Using API client directly:
 * import { apiClient } from '@/services/api';
 * 
 * const createTask = async (taskData) => {
 *   const response = await apiClient.post('/tasks', taskData);
 *   if (response.success) {
 *     return response.data;
 *   }
 * };
 * ```
 * 
 * Key features:
 * - Consolidated API client with improved error handling
 * - Type-safe request and response handling
 * - Consistent response format across all API calls
 * - Performance monitoring and debugging capabilities
 */

// Import API client from the consolidated implementation
import { consolidatedApiClient } from './client';
export { consolidatedApiClient as apiClient };
export type { ConsolidatedApiClient, ConsolidatedApiClientConfig } from './client';

// Import API services
import { userService, taskService, bidService } from './services';
export { userService, taskService, bidService };

// Create a consolidated services object for convenience
export const apiServices = {
  user: userService,
  task: taskService,
  bid: bidService
};

// Export common API types
export type { ApiResponse, PaginatedApiResponse } from '@/types/api';



// Export type utilities
export { 
  toDiscriminatedTask,
  toRegularTask,
  ensureDiscriminatedTask,
  ensureRegularTask 
} from '@/utils/type-utils';

// Export enhanced error handling
export {
  ValidationError,
  NotFoundError,
  AuthError,
  PermissionError,
  AppError,
  NetworkError,
  handleApiError,
  isAppError
} from '@/types/errors';

// Export performance monitoring (now using consolidated implementation)
import { performanceMonitor as apiPerformanceMonitor } from '../analytics/performanceMonitor';
export { apiPerformanceMonitor };
