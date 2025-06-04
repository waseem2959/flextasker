/**
 * Context Instances
 * 
 * This file creates the React Context instances for the application
 * Separating this into its own file prevents circular dependency issues
 */

import { createContext } from 'react';
import { AuthContextType } from '../types';
import { Notification } from './notification-context';

/**
 * Notification context interface
 */
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

/**
 * Creates the React Context instance for authentication state management
 * 
 * This context provides authentication state and methods throughout the component tree.
 * The default value is undefined, which helps catch cases where components try to use
 * the context without being wrapped in an AuthProvider.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Creates the React Context instance for notification state management
 * 
 * This context provides notification state and methods throughout the component tree.
 */
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
