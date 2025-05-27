/**
 * Notifications Hook
 * 
 * A React hook for accessing the notification context
 */

import { useContext } from 'react';
import { NotificationContext } from '../contexts/notification-context';

/**
 * Hook for accessing notification functionality
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}
