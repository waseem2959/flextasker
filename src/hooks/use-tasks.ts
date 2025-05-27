/**
 * Enhanced Task Hooks with TypeScript Improvements
 * 
 * These hooks provide a clean interface for components to interact with task data
 * using React Query for efficient caching, loading states, and error handling.
 * 
 * Now with improved TypeScript support using discriminated unions for task states
 * and better error handling with specialized error types.
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { taskService } from '@/services/api';
import { Task, TaskStatus } from '@/types';
import { isOpenTask, isCompletedTask } from '@/utils/type-guards';
import { AppError } from '@/types/errors';
import { invalidateQueries } from '@/lib/query-client';
import {
  TaskSearchParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  ApiResponse,
  PaginatedApiResponse
} from '@/types/api';

/**
 * Hook for fetching a list of tasks with optional filtering
 * 
 * @param params - Task search/filter parameters
 * @returns Query result with tasks data, loading state, and error
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading } = useTasks({ category: 'Home Services' });
 * 
 * // With task type discrimination
 * const { data } = useTasks();
 * if (data?.data) {
 *   const openTasks = data.data.filter(isOpenTask);
 *   // TypeScript knows openTasks is OpenTask[]  
 * }
 * ```
 */
export function useTasks(params?: TaskSearchParams): UseQueryResult<PaginatedApiResponse<Task>, AppError> {
  return useQuery({
    queryKey: ['tasks', 'list', params || {}],
    queryFn: () => taskService.getTasks(params),
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Hook for fetching a specific task by ID with type discrimination
 * 
 * @param id - The task ID
 * @returns Query result with task data, loading state, and error
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading } = useTask('task-123');
 * 
 * // With type discrimination
 * const { data } = useTask('task-123');
 * if (data?.data) {
 *   if (isOpenTask(data.data)) {
 *     // TypeScript knows this is an OpenTask
 *     console.log(data.data.bidEndDate);
 *   } else if (isCompletedTask(data.data)) {
 *     // TypeScript knows this is a CompletedTask
 *     console.log(data.data.completionDate);
 *   }
 * }
 * ```
 */
export function useTask(id: string): UseQueryResult<ApiResponse<Task>, AppError> {
  return useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => taskService.getTaskById(id),
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Hook for fetching tasks posted by the current user with type discrimination
 * 
 * @param params - Optional search/filter parameters
 * @returns Query result with task data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useMyTasks();
 * ```
 */
export function useMyTasks(params?: TaskSearchParams): UseQueryResult<PaginatedApiResponse<Task>, AppError> {
  return useQuery({
    queryKey: ['tasks', 'my', params || {}],
    queryFn: () => taskService.getMyTasks(params),
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Hook for creating a new task with enhanced error handling
 * 
 * @returns Mutation result with task data and status
 * 
 * @example
 * ```tsx
 * const createTask = useCreateTask();
 * 
 * try {
 *   await createTask.mutateAsync(taskData);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // Handle validation errors
 *     console.log(error.details);
 *   }
 * }
 * ```
 */
export function useCreateTask(): UseMutationResult<
  ApiResponse<Task>, 
  AppError, 
  CreateTaskRequest
> {
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskService.createTask(data),
    onSuccess: () => {
      // Invalidate all task-related queries to refresh the data
      invalidateQueries(['tasks']);
    },
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Interface for update task mutation parameters with strong typing
 */
export interface UpdateTaskParams {
  id: string;
  updates: UpdateTaskRequest;
  
  // Optional status-specific update params
  newStatus?: TaskStatus;
}

/**
 * Hook for updating an existing task with enhanced type safety
 * 
 * @returns Mutation result with task data and status
 * 
 * @example
 * ```tsx
 * const updateTask = useUpdateTask();
 * 
 * // Basic update
 * await updateTask.mutateAsync({ 
 *   id: 'task-123', 
 *   updates: { title: 'Updated Title' } 
 * });
 * 
 * // Update with status change
 * await updateTask.mutateAsync({ 
 *   id: 'task-123', 
 *   updates: { status: TaskStatus.IN_PROGRESS }, 
 *   newStatus: TaskStatus.IN_PROGRESS 
 * });
 * ```
 */
export function useUpdateTask(): UseMutationResult<
  ApiResponse<Task>, 
  AppError, 
  UpdateTaskParams
> {
  return useMutation({
    mutationFn: ({ id, updates }: UpdateTaskParams) => 
      taskService.updateTask(id, updates),
    onSuccess: (_, variables) => {
      // Update specific task data in the cache
      invalidateQueries(['tasks', 'detail', variables.id]);
      
      // Also refresh task lists that might include this task
      invalidateQueries(['tasks', 'list']);
      invalidateQueries(['tasks', 'my']);
    },
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Hook for deleting a task with enhanced error handling
 * 
 * @returns Mutation result with status
 */
export function useDeleteTask(): UseMutationResult<
  ApiResponse<null>, 
  AppError, 
  string
> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: (_, variables) => {
      // Remove task from cache using the queryClient directly for this operation
      queryClient.removeQueries({ queryKey: ['tasks', 'detail', variables] });
      
      // Refresh task lists
      invalidateQueries(['tasks', 'list']);
      invalidateQueries(['tasks', 'my']);
    },
    meta: {
      showErrorNotification: true
    }
  });
}

/**
 * Hook for completing a task
 * 
 * @returns Mutation result with updated task data
 * 
 * @example
 * ```tsx
 * const completeTask = useCompleteTask();
 * 
 * const handleComplete = async (id) => {
 *   await completeTask.mutateAsync(id);
 * };
 * ```
 */
// Interface for complete task request parameters
interface CompleteTaskParams {
  taskId: string;
  rating?: number;
  feedback?: string;
}

export function useCompleteTask(): UseMutationResult<
  ApiResponse<Task>, 
  Error, 
  string | CompleteTaskParams
> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (idOrParams: string | CompleteTaskParams) => {
      if (typeof idOrParams === 'string') {
        return taskService.completeTask(idOrParams);
      } else {
        // Pass only the taskId, not the additional parameters
        return taskService.completeTask(idOrParams.taskId);
      }
    },
    onSuccess: (_, idOrParams) => {
      // Extract the task ID from the parameter
      const id = typeof idOrParams === 'string' ? idOrParams : idOrParams.taskId;
      
      // Update task cache and invalidate task lists
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'detail', id],
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'list'],
      });
    },
  });
}

/**
 * Interface for cancel task mutation parameters
 */
interface CancelTaskParams {
  id: string;
  reason?: string;
}

/**
 * Hook for canceling a task
 * 
 * @returns Mutation result with updated task data
 * 
 * @example
 * ```tsx
 * const cancelTask = useCancelTask();
 * 
 * const handleCancel = async ({ id, reason }) => {
 *   await cancelTask.mutateAsync({ id, reason });
 * };
 * ```
 */
export function useCancelTask(): UseMutationResult<
  ApiResponse<Task>, 
  Error, 
  CancelTaskParams
> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: CancelTaskParams) => {
      // The taskService.cancelTask expects id and reason as separate parameters
      // If reason is not provided, use a default empty string to satisfy the type
      return taskService.cancelTask(id, reason || "");
    },
    onSuccess: (_, variables) => {
      // Update task cache and invalidate task lists
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'detail', variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks', 'list'],
      });
    },
  });
}

/**
 * Enhanced hook aliases for gradual migration
 * 
 * These aliases allow components to use the enhanced naming convention
 * while still using the original implementations.
 */

// Enhanced task hooks with the same functionality but new names
export const useEnhancedTasks = useTasks;
export const useEnhancedTask = useTask;
export const useCreateEnhancedTask = useCreateTask;
export const useUpdateEnhancedTask = useUpdateTask;
export const useCompleteEnhancedTask = useCompleteTask;
export const useCancelEnhancedTask = useCancelTask;
export const useDeleteEnhancedTask = useDeleteTask;

// Re-export interface types for enhanced naming convention
export type { UpdateTaskParams as UpdateEnhancedTaskParams };
export type { CompleteTaskParams as CompleteEnhancedTaskParams };
export type { CancelTaskParams as CancelEnhancedTaskParams };
