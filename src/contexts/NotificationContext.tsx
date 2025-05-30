/**
 * Notification Context
 * 
 * This context provides real-time notification functionality throughout the application.
 */

import { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useSocket, useSocketEvent } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { SocketEventType } from '../services/socket';
import apiClient from '../services/api/client';
import { NotificationContext } from './contextInstance';

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
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isConnected } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);
  
  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      setNotifications(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`, {});
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
      console.error('Error marking notification as read:', err);
    }
  }, [isAuthenticated]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await apiClient.post('/notifications/read-all', {});
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
      console.error('Error marking all notifications as read:', err);
    }
  }, [isAuthenticated]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch notifications on auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);
  
  // Handle real-time notification events
  useSocketEvent(SocketEventType.NOTIFICATION_RECEIVED, (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  });
  
  // Handle notification read events
  useSocketEvent(SocketEventType.NOTIFICATION_RECEIVED, (readNotification: { id: string }) => {
    // We're reusing the NOTIFICATION_RECEIVED event for marking as read
    // In a real implementation, we'd have separate event types
    if (readNotification && 'isRead' in readNotification && readNotification.isRead) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === readNotification.id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    }
  });
  
  // Handle clear notifications events - we'd use a custom event in a real implementation
  useSocketEvent(SocketEventType.NOTIFICATION_RECEIVED, (notification: any) => {
    // Look for a special clear action in the notification
    if (notification && notification.type === 'clear_all') {
      setNotifications([]);
    }
  });
  
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
    clearError
  }), [
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError
  ]);
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
