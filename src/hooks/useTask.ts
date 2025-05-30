/**
 * Task Hook
 * 
 * This hook provides functionality for working with tasks including:
 * - Loading task details
 * - Real-time task updates
 * - Task actions (update, complete, cancel)
 */

import { useState, useEffect, useCallback } from 'react';
import { socketService } from '@/services/socket';
import { taskService } from '@/services/api/services';
import { Task } from '@/types';
import { showErrorNotification, showSuccessNotification } from '@/services/error';

/**
 * Hook for working with a specific task
 */
export function useTask(taskId: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load task data on mount
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setIsLoading(true);
        const response = await taskService.getTaskById(taskId);
        if (response.success && response.data) {
          setTask(response.data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load task');
        setError(error);
        showErrorNotification(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId]);
  
  // Subscribe to real-time task updates
  useEffect(() => {
    // Subscribe to task update events
    const unsubscribe = socketService.on(
      `task:${taskId}:updated`,
      (updatedTask: Task) => {
        setTask(updatedTask);
      }
    );
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [taskId]);
  
  // Function to update a task
  const updateTask = useCallback(
    async (updates: Partial<Task>) => {
      try {
        setIsLoading(true);
        const response = await taskService.updateTask(taskId, updates);
        if (response.success && response.data) {
          setTask(response.data);
          showSuccessNotification('Task updated successfully');
        }
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update task');
        setError(error);
        showErrorNotification(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId]
  );
  
  // Function to mark a task as completed
  const completeTask = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const response = await taskService.completeTask(taskId);
        if (response.success && response.data) {
          setTask(response.data);
          showSuccessNotification('Task marked as completed');
        }
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to complete task');
        setError(error);
        showErrorNotification(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId]
  );
  
  // Function to cancel a task
  const cancelTask = useCallback(
    async (reason?: string) => {
      try {
        setIsLoading(true);
        const response = await taskService.cancelTask(taskId, reason);
        if (response.success && response.data) {
          setTask(response.data);
          showSuccessNotification('Task cancelled successfully');
        }
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to cancel task');
        setError(error);
        showErrorNotification(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [taskId]
  );
  
  return {
    task,
    isLoading,
    error,
    updateTask,
    completeTask,
    cancelTask
  };
}

/**
 * Hook for working with task listings
 */
export function useTaskList(initialFilters = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Load tasks based on filters
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await taskService.getTasks({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success && response.data) {
        setTasks(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tasks');
      setError(error);
      showErrorNotification(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);
  
  // Load tasks when filters or pagination changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  
  // Function to update filters
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, []);
  
  // Function to change page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  }, []);
  
  // Subscribe to real-time updates for all visible tasks
  useEffect(() => {
    // No need to subscribe if there are no tasks
    if (!tasks.length) return;
    
    // Create an array to store all unsubscribe functions
    const unsubscribeFunctions: (() => void)[] = [];
    
    // Subscribe to updates for each task
    tasks.forEach(task => {
      const unsubscribe = socketService.on(
        `task:${task.id}:updated`,
        (updatedTask: Task) => {
          setTasks(prevTasks => 
            prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
          );
        }
      );
      
      unsubscribeFunctions.push(unsubscribe);
    });
    
    // Also subscribe to task created events based on filters
    const handleNewTask = (newTask: Task) => {
      // Check if the new task matches our filters
      // This is a simplified check - in a real app, you'd need more complex logic
      const matches = Object.entries(filters).every(([key, value]) => {
        // @ts-ignore - We don't know the exact structure of filters or Task
        return !value || newTask[key] === value;
      });
      
      if (matches) {
        setTasks(prevTasks => [newTask, ...prevTasks]);
      }
    };
    
    const unsubscribeNewTask = socketService.on('task:created', handleNewTask);
    unsubscribeFunctions.push(unsubscribeNewTask);
    
    // Cleanup on unmount or when tasks change
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [tasks, filters]);
  
  return {
    tasks,
    isLoading,
    error,
    filters,
    pagination,
    updateFilters,
    setPage,
    refreshTasks: loadTasks
  };
}

export default useTask;
