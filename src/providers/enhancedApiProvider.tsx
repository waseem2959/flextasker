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
import { realtimeService as socketService } from '@/services/realtime/socketService';
import { SocketEventType } from '@/services/realtime/types';
import { useRealtimeService } from '@/services/realtime/hooks';
import { rateLimiter } from '@/services/api/services/consolidatedRateLimiter';
import { FloatingConnectionStatus } from '@/components/status/connectionStatus';
import { ApiPerformancePanel } from '@/components/dev-tools/apiPerformancePanel';
import { toast } from '@/hooks/useToast';
import { offlineQueueManager } from '@/utils/offlineQueue';

interface EnhancedApiProviderProps {
  readonly children: ReactNode;
  readonly enableRealTimeSync?: boolean;
  readonly enableRateLimiting?: boolean;
  readonly enableOfflineSupport?: boolean;
  readonly enableDevTools?: boolean;
  readonly enableConnectionStatus?: boolean;
}

/**
 * Enhanced API Provider component
 * 
 * Adds advanced API features like real-time synchronization, performance monitoring,
 * rate limiting, and offline support to the application.
 */
function EnhancedApiProvider({
  children,
  enableRealTimeSync = true,
  enableRateLimiting = true,
  enableOfflineSupport = true,
  enableDevTools = import.meta.env.DEV,
  enableConnectionStatus = true
}: EnhancedApiProviderProps) {
  const queryClient = useQueryClient();
  const { connectToSocket, disconnectFromSocket } = useRealtimeService();
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  // Toggle development panel
  const toggleDevPanel = () => {
    setIsDevPanelOpen(prev => !prev);
  };

  // Set up realtime synchronization
  useEffect(() => {
    if (!enableRealTimeSync) return;

    // Setup WebSocket connection and event handlers
    connectToSocket();

    // Handle data invalidation on WebSocket events
    const handleTaskUpdate = (taskId: string) => {
      // Invalidate related queries when task data changes
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasks', 'detail', taskId]);
      
      toast({
        title: 'Task Updated',
        description: 'A task has been updated with new information',
        variant: 'default',
      });
    };

    const handleBidReceived = (taskId: string) => {
      // Invalidate related queries when new bid is received
      queryClient.invalidateQueries(['tasks', 'detail', taskId]);
      queryClient.invalidateQueries(['bids', 'list', { taskId }]);
      
      toast({
        title: 'New Bid Received',
        description: 'You have received a new bid on your task',
        variant: 'default',
      });
    };

    const handleNotification = () => {
      // Invalidate notifications when new ones arrive
      queryClient.invalidateQueries(['notifications']);
      
      // We don't show toast here because the notification system
      // will handle showing the notification itself
    };

    const handleReviewReceived = (taskId: string) => {
      // Invalidate related queries when new review is received
      queryClient.invalidateQueries(['tasks', 'detail', taskId]);
      queryClient.invalidateQueries(['reviews', 'list', { taskId }]);
      
      toast({
        title: 'New Review',
        description: 'You have received a new review',
        variant: 'default',
      });
    };

    const handleMessageReceived = () => {
      // Invalidate messages when new ones arrive
      queryClient.invalidateQueries(['messages']);
      
      toast({
        title: 'New Message',
        description: 'You have received a new message',
        variant: 'default',
      });
    };

    // Register event handlers for different WebSocket events
    socketService.on(SocketEventType.TASK_UPDATED, handleTaskUpdate);
    socketService.on(SocketEventType.BID_RECEIVED, handleBidReceived);
    socketService.on(SocketEventType.NOTIFICATION_RECEIVED, handleNotification);
    socketService.on(SocketEventType.REVIEW_RECEIVED, handleReviewReceived);
    socketService.on(SocketEventType.MESSAGE_RECEIVED, handleMessageReceived);

    // Cleanup event handlers on unmount
    return () => {
      socketService.off(SocketEventType.TASK_UPDATED, handleTaskUpdate);
      socketService.off(SocketEventType.BID_RECEIVED, handleBidReceived);
      socketService.off(SocketEventType.NOTIFICATION_RECEIVED, handleNotification);
      socketService.off(SocketEventType.REVIEW_RECEIVED, handleReviewReceived);
      socketService.off(SocketEventType.MESSAGE_RECEIVED, handleMessageReceived);
      disconnectFromSocket();
    };
  }, [enableRealTimeSync, queryClient, connectToSocket, disconnectFromSocket]);

  // Set up rate limiting
  useEffect(() => {
    if (!enableRateLimiting) return;

    // Setup and configure rate limiter
    rateLimiter.initialize({
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      enableQueueing: true,
      queueTimeout: 30000,
    });

    return () => {
      rateLimiter.reset();
    };
  }, [enableRateLimiting]);

  // Set up offline support
  useEffect(() => {
    if (!enableOfflineSupport) return;

    // Process offline queue when we come back online
    const handleOnlineStatus = async () => {
      if (navigator.onLine) {
        // Wait a moment for stable connection
        setTimeout(async () => {
          try {
            await offlineQueueManager.processQueue();
          } catch (error) {
            console.error('Failed to process offline queue:', error);
          }
        }, 1000);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', () => {
      toast({
        title: 'You are offline',
        description: 'Your changes will be saved and synchronized when you reconnect',
        variant: 'warning',
      });
    });

    // Initial check and queue processing
    if (navigator.onLine) {
      offlineQueueManager.processQueue().catch(error => {
        console.error('Failed to process initial offline queue:', error);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', () => {});
    };
  }, [enableOfflineSupport]);

  // Set up keyboard shortcuts for dev tools
  useEffect(() => {
    if (!enableDevTools) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D to toggle dev panel
      if (e.altKey && e.key === 'd') {
        toggleDevPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableDevTools]);

  return (
    <>
      {/* Main content */}
      {children}
      
      {/* Connection status indicator */}
      {enableConnectionStatus && <FloatingConnectionStatus />}
      
      {/* Development performance panel */}
      {enableDevTools && isDevPanelOpen && <ApiPerformancePanel onClose={toggleDevPanel} />}
    </>
  );
}

export default EnhancedApiProvider;
