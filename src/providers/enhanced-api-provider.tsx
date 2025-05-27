/**
 * Enhanced API Provider
 * 
 * A provider component that integrates all enhanced API features:
 * - Real-time synchronization via WebSockets
 * - Performance monitoring and analytics
 * - Rate limiting protection
 * - Offline request queueing
 * 
 * This component should be placed near the root of your application,
 * typically inside the QueryClientProvider.
 */

import { ReactNode, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService, SocketEventType, useSocket } from '@/services/socket/socket-service';
import { rateLimiter } from '@/services/api/rate-limiter';
import { FloatingConnectionStatus } from '@/components/status/connection-status';
import { ApiPerformancePanel } from '@/components/dev-tools/api-performance-panel';
import { toast } from '@/hooks/use-toast';
import { offlineQueueManager } from '@/utils/offline-queue';

interface EnhancedApiProviderProps {
  children: ReactNode;
  enableRealTimeSync?: boolean;
  enableRateLimiting?: boolean;
  enableOfflineSupport?: boolean;
  enableDevTools?: boolean;
  enableConnectionStatus?: boolean;
}

/**
 * Enhanced API Provider component
 */
export function EnhancedApiProvider({
  children,
  enableRealTimeSync = true,
  enableRateLimiting = true,
  enableOfflineSupport = true,
  enableDevTools = import.meta.env.DEV,
  enableConnectionStatus = true
}: EnhancedApiProviderProps) {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Log connection status changes for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`Connection status changed: ${isOnline ? 'online' : 'offline'}`);
    }
  }, [isOnline]);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'You are back online',
        description: 'Syncing your offline changes...',
        variant: 'default'
      });
      
      // Process offline queue when we come back online
      if (enableOfflineSupport) {
        // Process any queued requests
        offlineQueueManager.processQueue()
          .then(() => {
            // After processing the queue, invalidate queries to refresh data
            queryClient.invalidateQueries();
          })
          .catch(error => {
            console.error('Failed to process offline queue:', error);
          });
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be saved and synced when you reconnect.',
        variant: 'destructive'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineSupport]);
  
  // Initialize WebSocket connection and apply rate limiting config
  useEffect(() => {
    if (enableRealTimeSync) {
      socketService.connect();
    }
    
    if (enableRateLimiting) {
      // Reset rate limiter when configuration changes
      rateLimiter.reset();
    }
    
    return () => {
      if (enableRealTimeSync) {
        socketService.disconnect();
      }
    };
  }, [enableRealTimeSync, enableRateLimiting]);
  
  // Setup real-time synchronization
  useEffect(() => {
    if (!enableRealTimeSync) return;
    
    // Handle task updates
    const taskUpdatedUnsubscribe = socketService.on(
      SocketEventType.TASK_UPDATED,
      (data: { taskId: string; task: any }) => {
        queryClient.setQueryData(['tasks', 'detail', data.taskId], {
          success: true,
          message: 'Task updated via socket',
          data: data.task,
          timestamp: new Date().toISOString()
        });
        
        // Update task lists
        queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
      }
    );
    
    // Handle new bids
    const bidReceivedUnsubscribe = socketService.on(
      SocketEventType.BID_RECEIVED,
      (data: { taskId: string; bid: any }) => {
        // Update bid lists for the task
        queryClient.setQueriesData({ queryKey: ['bids', 'task', data.taskId] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: [data.bid, ...oldData.data]
          };
        });
      }
    );
    
    // Handle new notifications
    const notificationReceivedUnsubscribe = socketService.on(
      SocketEventType.NOTIFICATION_RECEIVED,
      (data: { notification: any }) => {
        // Update notification lists
        queryClient.setQueriesData({ queryKey: ['notifications', 'list'] }, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          // Avoid duplicates
          if (oldData.data.some((n: any) => n.id === data.notification.id)) {
            return oldData;
          }
          
          return {
            ...oldData,
            data: [data.notification, ...oldData.data]
          };
        });
        
        // Update unread count
        queryClient.setQueryData(['notifications', 'unread-count'], (oldData: any) => {
          if (!oldData || !oldData.data) {
            return {
              success: true,
              message: 'Unread notification count updated',
              data: { count: 1 },
              timestamp: new Date().toISOString()
            };
          }
          
          return {
            ...oldData,
            data: {
              count: oldData.data.count + 1
            }
          };
        });
        
        // Show toast notification if we're connected
        if (isConnected) {
          toast({
            title: data.notification.title || 'New Notification',
            description: data.notification.message,
            variant: 'default'
          });
        }
      }
    );
    
    // Cleanup
    return () => {
      taskUpdatedUnsubscribe();
      bidReceivedUnsubscribe();
      notificationReceivedUnsubscribe();
    };
  }, [queryClient, enableRealTimeSync, isConnected]);
  
  return (
    <>
      {children}
      
      {/* Show connection status indicator if enabled */}
      {enableConnectionStatus && <FloatingConnectionStatus />}
      
      {/* Show developer tools if enabled */}
      {enableDevTools && <ApiPerformancePanel />}
    </>
  );
}

export default EnhancedApiProvider;
