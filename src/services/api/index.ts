/**
 * API Services Index with TypeScript Improvements
 * 
 * This file exports all API services with enhanced TypeScript patterns
 * to provide better type safety and error handling throughout the application.
 * 
 * Example usage:
 * ```tsx
 * import { taskService, enhancedApiClient } from '@/services/api';
 * import { useApiQuery, usePaginatedQuery } from '@/hooks/use-api-hooks';
 * 
 * // Using the enhanced API client:
 * const { data, isLoading, error } = useApiQuery(['tasks', id], `/tasks/${id}`);
 * 
 * // Using service directly:
 * const fetchTasks = async () => {
 *   const response = await taskService.getTasks();
 *   setTasks(response.data);
 * };
 * 
 * // Direct API client usage with offline support, real-time sync, etc.:
 * const createTask = async (taskData) => {
 *   const response = await enhancedApiClient.post('/tasks', taskData);
 *   if (response.success) {
 *     return response.data;
 *   }
 *   throw new Error(response.message);
 * };
 * ```
 */

// Export API clients
export { apiClient, BaseApiClient, IApiClient } from './base-client';
export { enhancedApiClient, EnhancedApiClient } from './enhanced-client';

// Export token manager
export { tokenManager } from './token-manager';

// Export rate limiter
export { rateLimiter } from './rate-limiter';

// Export original services (for backward compatibility)
export * from './tasks.service';
export * from './bids.service';
export * from './users.service';

// Re-export services as enhanced versions for backward compatibility
// These are now consolidated into the original service files
export { taskService as enhancedTaskService } from './tasks.service';
export { bidService as enhancedBidService } from './bids.service';
export { userService as enhancedUserService } from './users.service';

// Export enhanced API response types from consolidated services
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { AppError } from '@/services/error';

// Export bid service types
export type {
  BidSearchParams,
  CreateBidRequest,
  UpdateBidRequest
} from './bids.service';

// Export task service types
export type {
  TaskSearchParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  CancelTaskRequest
} from './tasks.service';

// Export user service types
export type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthTokenResponse,
  UserSearchParams
} from './users.service';

// Export enhanced type adapters
export { 
  toDiscriminatedTask,
  toRegularTask,
  ensureDiscriminatedTask,
  ensureRegularTask 
} from '@/utils/type-adapters';

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

// Re-export types from individual services that aren't in api.ts yet
export type { TaskBidStatistics } from './bids.service';
export type { ChangePasswordRequest } from './users.service';
