// src/hooks/useTasks.ts
import { apiClient } from "@/services/api/client";
import { ApiResponse, Task } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "./useQuery";

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaskFilters {
  status?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery(
    // Query key must be an array
    ["tasks", filters] as const,
    async () => {
      const response = await apiClient.get<ApiResponse<TasksResponse>>(
        "/tasks/search",
        { params: filters }
      );
      return response.data.data!;
    },
    {
      // Keep this query fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Add metadata for error handling
      meta: {
        showErrorNotification: true,
      },
    }
  );
}

export function useTask(taskId: string | undefined) {
  return useQuery(
    ["task", taskId] as const,
    async () => {
      const response = await apiClient.get<ApiResponse<Task>>(
        `/tasks/${taskId}`
      );
      return response.data.data!;
    },
    {
      // Only run this query if we have a taskId
      enabled: !!taskId,
      // Cache individual tasks for longer
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }
  );
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Partial<Task>) => {
      const response = await apiClient.post<ApiResponse<Task>>("/tasks", data);
      return response.data.data!;
    },
    {
      onSuccess: (newTask) => {
        // Invalidate and refetch tasks list
        queryClient.invalidateQueries({ queryKey: ["tasks"] });

        // Optionally, add the new task to the cache immediately
        queryClient.setQueryData(["task", newTask.id], newTask);
      },
      onError: (error) => {
        console.error("Failed to create task:", error);
      },
      // Mutation-specific options
      meta: {
        showErrorNotification: true,
      },
    }
  );
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    async (data: Partial<Task>) => {
      const response = await apiClient.put<ApiResponse<Task>>(
        `/tasks/${taskId}`,
        data
      );
      return response.data.data!;
    },
    {
      // Optimistic update
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["task", taskId] });

        // Snapshot the previous value
        const previousTask = queryClient.getQueryData<Task>(["task", taskId]);

        // Optimistically update to the new value
        if (previousTask) {
          queryClient.setQueryData(["task", taskId], {
            ...previousTask,
            ...newData,
          });
        }

        // Return a context object with the snapshotted value
        return { previousTask };
      },
      // If the mutation fails, use the context to roll back
      onError: (_error, _variables, context) => {
        if (context?.previousTask) {
          queryClient.setQueryData(["task", taskId], context.previousTask);
        }
      },
      // Always refetch after error or success
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["task", taskId] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
    }
  );
}
