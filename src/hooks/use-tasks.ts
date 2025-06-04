/**
 * Task Hooks with TypeScript Improvements
 * 
 * These hooks provide a clean interface for components to interact with task data
 * using React Query for efficient caching, loading states, and error handling.
 */

import { taskService } from '@/services/api';
import { CreateTaskRequest, UpdateTaskRequest } from '@/services/api/task-service';
import { AppError } from '@/services/error';
import { ApiResponse, PaginatedApiResponse, Task, TaskSearchParams, TaskStatus } from '@/types';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching a list of tasks with optional filtering
 */
export function useTasks(params?: TaskSearchParams): UseQueryResult<PaginatedApiResponse<Task>, AppError> {
  return useQuery<PaginatedApiResponse<Task>, AppError>({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getTasks(params as any),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching a specific task by ID with type discrimination
 */
export function useTask(id: string): UseQueryResult<ApiResponse<Task>, AppError> {
  return useQuery<ApiResponse<Task>, AppError>({
    queryKey: ['task', id],
    queryFn: () => taskService.getTaskById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching tasks posted by the current user
 */
export function useMyTasks(params?: TaskSearchParams): UseQueryResult<PaginatedApiResponse<Task>, AppError> {
  return useQuery<PaginatedApiResponse<Task>, AppError>({
    queryKey: ['myTasks', params],
    queryFn: () => taskService.getMyTasks(params as any),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for creating a new task with enhanced error handling
 */
export function useCreateTask(): UseMutationResult<ApiResponse<Task>, AppError, CreateTaskRequest> {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Task>, AppError, CreateTaskRequest>({
    mutationFn: (data) => taskService.createTask(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    }
  });
}

/**
 * Interface for update task mutation parameters
 */
export interface UpdateTaskParams {
  id: string;
  updates: UpdateTaskRequest;
  newStatus?: TaskStatus;
}

/**
 * Hook for updating an existing task
 */
export function useUpdateTask(): UseMutationResult<ApiResponse<Task>, AppError, UpdateTaskParams> {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Task>, AppError, UpdateTaskParams>({
    mutationFn: ({ id, updates }) => taskService.updateTask(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate specific task query
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    }
  });
}

/**
 * Hook for deleting a task
 */
export function useDeleteTask(): UseMutationResult<ApiResponse<void>, AppError, string> {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<void>, AppError, string>({
    mutationFn: (id) => taskService.deleteTask(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['task', id] });
      
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    }
  });
}

/**
 * Interface for complete task request parameters
 */
export interface CompleteTaskParams {
  taskId: string;
  rating?: number;
  feedback?: string;
}

/**
 * Hook for completing a task
 */
export function useCompleteTask(): UseMutationResult<ApiResponse<Task>, AppError, string | CompleteTaskParams> {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Task>, AppError, string | CompleteTaskParams>({
    mutationFn: (params) => {
      // Handle both simple taskId string or full params object
      const taskId = typeof params === 'string' ? params : params.taskId;
      // The completeTask service only accepts taskId, additional data should be handled separately
      return taskService.completeTask(taskId);
    },
    onSuccess: (_, params) => {
      // Get the task ID from either form
      const taskId = typeof params === 'string' ? params : params.taskId;
      
      // Invalidate specific task query
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    }
  });
}

/**
 * Interface for cancel task mutation parameters
 */
export interface CancelTaskParams {
  id: string;
  reason?: string;
}

/**
 * Hook for canceling a task
 */
export function useCancelTask(): UseMutationResult<ApiResponse<Task>, AppError, CancelTaskParams> {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Task>, AppError, CancelTaskParams>({
    mutationFn: ({ id, reason }) => taskService.cancelTask(id, reason),
    onSuccess: (_, { id }) => {
      // Invalidate specific task query
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    }
  });
}

// Export everything using consistent naming convention
export { useTask as useTaskDetails, useMyTasks as useUserTasks };

