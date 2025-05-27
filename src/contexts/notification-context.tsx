/**
 * Notification Context
 * 
 * This context provides real-time notification functionality throughout the application.
 */

import { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSocket } from '../hooks/use-socket';
import { useAuth } from '../hooks/use-auth';
import { NotificationType } from '../types/enums';

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}

// Notification context interface
interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

// Create context with default values
export const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearError: () => {}
});

// Context provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuth();
  const { isConnected, on, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !isConnected) return;
    
    setLoading(true);
    try {
      const data = await getNotifications();
      
      // Parse dates
      const parsedNotifications = data.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
      
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter((n: Notification) => !n.isRead).length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isConnected, getNotifications]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated || !isConnected) return;
    
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  }, [isAuthenticated, isConnected, markNotificationAsRead]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated || !isConnected) return;
    
    try {
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  }, [isAuthenticated, isConnected, markAllNotificationsAsRead]);
  
  // Listen for real-time notification events
  useEffect(() => {
    if (!isAuthenticated || !isConnected) return;
    
    // Handler for new notifications
    const handleNewNotification = (notification: Notification) => {
      // Parse date
      const parsedNotification = {
        ...notification,
        createdAt: new Date(notification.createdAt)
      };
      
      setNotifications(prev => [parsedNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    // Register event listener
    const cleanup = on('notifications:new', handleNewNotification);
    
    // Initial fetch
    fetchNotifications();
    
    return cleanup;
  }, [isAuthenticated, isConnected, on, fetchNotifications]);
  
  // Value object for context provider
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
