/**
 * Notifications Query Hook
 * 
 * React Query hooks for notification management with proper caching,
 * optimistic updates, and real-time synchronization
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Types
export type NotificationType = 'message' | 'task' | 'bid' | 'alert' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

// Mock API functions (replace with actual API calls)
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message from John Doe',
    message: 'Hi there! I wanted to ask about the task details.',
    time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    read: false,
    actionUrl: '/messages/1',
    userId: 'current-user'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task status updated',
    message: 'Your task "Website Redesign" has been marked as completed.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    actionUrl: '/tasks/123',
    userId: 'current-user'
  },
  {
    id: '3',
    type: 'bid',
    title: 'New bid on your task',
    message: 'Someone bid $250 on your "Logo Design" task.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
    actionUrl: '/tasks/456',
    userId: 'current-user'
  },
  {
    id: '4',
    type: 'alert',
    title: 'Account security',
    message: 'We noticed a login from a new device. Please verify it was you.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
    actionUrl: '/settings/security',
    userId: 'current-user'
  },
  {
    id: '5',
    type: 'system',
    title: 'System maintenance',
    message: 'Flextasker will be undergoing maintenance on Sunday from 2-4am.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: true,
    userId: 'current-user'
  }
];

// Mock API service
const notificationService = {
  async getNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...mockNotifications];
    
    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }
    
    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read);
    }
    
    if (filters.offset) {
      filtered = filtered.slice(filters.offset);
    }
    
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return filtered;
  },

  async getNotificationStats(): Promise<NotificationStats> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stats: NotificationStats = {
      total: mockNotifications.length,
      unread: mockNotifications.filter(n => !n.read).length,
      byType: {
        message: mockNotifications.filter(n => n.type === 'message').length,
        task: mockNotifications.filter(n => n.type === 'task').length,
        bid: mockNotifications.filter(n => n.type === 'bid').length,
        alert: mockNotifications.filter(n => n.type === 'alert').length,
        system: mockNotifications.filter(n => n.type === 'system').length,
      }
    };
    
    return stats;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.read = true;
    return notification;
  },

  async markAllAsRead(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    mockNotifications.forEach(n => {
      n.read = true;
    });
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index === -1) {
      throw new Error('Notification not found');
    }
    
    mockNotifications.splice(index, 1);
  }
};

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch notifications with filtering
 */
export function useNotificationsQuery(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch notification statistics
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: notificationService.getNotificationStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Snapshot previous values
      const previousData = queryClient.getQueriesData({ queryKey: notificationKeys.all });

      // Optimistically update notifications
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          );
        }
      );

      // Update stats optimistically
      queryClient.setQueryData(
        notificationKeys.stats(),
        (oldStats: NotificationStats | undefined) => {
          if (!oldStats) return oldStats;
          return {
            ...oldStats,
            unread: Math.max(0, oldStats.unread - 1)
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueriesData({ queryKey: notificationKeys.all });

      // Mark all as read optimistically
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(notification => ({ ...notification, read: true }));
        }
      );

      // Update stats
      queryClient.setQueryData(
        notificationKeys.stats(),
        (oldStats: NotificationStats | undefined) => {
          if (!oldStats) return oldStats;
          return { ...oldStats, unread: 0 };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueriesData({ queryKey: notificationKeys.all });

      // Remove notification optimistically
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(notification => notification.id !== notificationId);
        }
      );

      // Update stats
      queryClient.setQueryData(
        notificationKeys.stats(),
        (oldStats: NotificationStats | undefined) => {
          if (!oldStats) return oldStats;
          const notification = mockNotifications.find(n => n.id === notificationId);
          const unreadDelta = notification && !notification.read ? 1 : 0;
          return {
            ...oldStats,
            total: Math.max(0, oldStats.total - 1),
            unread: Math.max(0, oldStats.unread - unreadDelta)
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Combined hook for all notification operations
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const notificationsQuery = useNotificationsQuery(filters);
  const statsQuery = useNotificationStats();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return {
    // Data
    notifications: notificationsQuery.data ?? [],
    stats: statsQuery.data,
    
    // Loading states
    isLoading: notificationsQuery.isLoading || statsQuery.isLoading,
    isError: notificationsQuery.isError || statsQuery.isError,
    error: notificationsQuery.error || statsQuery.error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Refetch
    refetch: () => {
      notificationsQuery.refetch();
      statsQuery.refetch();
    }
  };
}

export default useNotifications;