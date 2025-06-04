/**
 * Notification Context
 * 
 * This context provides real-time notification functionality throughout the application.
 */

import { useRealtime } from '@/hooks/use-realtime';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import apiClient from '../services/api/client';
import { SocketEvent } from '../services/realtime/socket-events';
import { realtimeService } from '../services/realtime/socket-service';

// Create the context with a default value
const NotificationContext = createContext<{
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearError: () => {},
});

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: string; // Using string instead of enum for flexibility
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

/**
 * Context provider component for notifications
 */
interface NotificationProviderProps {
  readonly children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { isConnected } = useRealtime();
  
  // Handle new notification events
  const handleNewNotification = useCallback((notification: any) => {
    setNotifications(prev => [{
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message ?? notification.content,
      isRead: notification.read ?? false,
      relatedId: notification.relatedId ?? notification.taskId ?? notification.bidId,
      createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date()
    }, ...prev]);
  }, []);
  
  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      setNotifications((response as any).data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Handle notification read events
  const handleNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Realtime service simplified - using API call instead
      await apiClient.put(`/notifications/${notificationId}/read`);
      handleNotificationRead(notificationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  }, [handleNotificationRead]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        // Realtime service simplified - using API call instead
        await apiClient.put('/notifications/mark-all-read');
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  }, [notifications]);

  // Subscribe to socket events
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up event listeners
    // Realtime notifications simplified - using polling instead
    const pollInterval = setInterval(() => {
      if (!loading) {
        fetchNotifications();
      }
    }, 30000); // Poll every 30 seconds
    
    // For read notifications
    const readNotificationUnsub = realtimeService.on(SocketEvent.MARK_NOTIFICATIONS_READ, 
      ({ notificationIds }: { notificationIds: string[] }) => {
        notificationIds.forEach(id => handleNotificationRead(id));
      }
    );

    // Clean up event listeners and polling
    return () => {
      clearInterval(pollInterval);
      if (readNotificationUnsub) readNotificationUnsub();
    };
  }, [isAuthenticated, handleNewNotification, handleNotificationRead]);

  // Fetch notifications on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);
  
  // Refetch notifications when socket reconnects
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      fetchNotifications();
    }
  }, [isConnected, isAuthenticated, fetchNotifications]);
  
  // Context value
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  }), [notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead, clearError]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
