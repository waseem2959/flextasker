/**
 * React Hooks for Realtime Communication
 * 
 * These hooks provide React component integration with the realtime service.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { realtimeService } from './socket-service';
import { ConnectionState, SocketEventType } from './types';

/**
 * Hook for connecting to and using the realtime service
 */
export function useRealtimeService() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeService.getConnectionState()
  );
  
  useEffect(() => {
    // Subscribe to connection state changes
    const unsubscribe = realtimeService.onConnectionStateChange(setConnectionState);
    
    // Connect if not already connected
    if (!realtimeService.isConnected()) {
      realtimeService.connect().catch(error => {
        console.error('Failed to connect to realtime service:', error);
      });
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  const reconnect = useCallback(() => {
    return realtimeService.connect();
  }, []);
  
  return {
    connectionState,
    isConnected: realtimeService.isConnected(),
    reconnect,
    service: realtimeService
  };
}

/**
 * Hook for subscribing to realtime events
 */
export function useRealtimeEvent<T = any>(
  eventType: SocketEventType | string,
  handler: (data: T) => void
) {
  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = realtimeService.on<T>(eventType, handler);
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [eventType, handler]);
}

/**
 * Hook for automatically synchronizing React Query cache with realtime updates
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { isConnected } = useRealtimeService();
  const syncEnabledRef = useRef(true);
  
  // Handler for task updates
  const handleTaskUpdate = useCallback((task: any) => {
    if (!syncEnabledRef.current) return;
    
    // Invalidate the specific task query
    queryClient.invalidateQueries(['task', task.id]);
    
    // Update task lists that might contain this task
    queryClient.invalidateQueries(['tasks']);
    
    // Show toast notification
    toast({
      title: 'Task Updated',
      description: `Task "${task.title}" has been updated.`,
      variant: 'default',
    });
  }, [queryClient]);
  
  // Handler for bid updates
  const handleBidUpdate = useCallback((bid: any) => {
    if (!syncEnabledRef.current) return;
    
    // Invalidate the specific bid query
    queryClient.invalidateQueries(['bid', bid.id]);
    
    // Update bid lists that might contain this bid
    queryClient.invalidateQueries(['bids']);
    
    // Invalidate the related task
    if (bid.taskId) {
      queryClient.invalidateQueries(['task', bid.taskId]);
    }
    
    // Show toast notification
    toast({
      title: 'Bid Updated',
      description: `A bid for $${bid.amount} has been updated.`,
      variant: 'default',
    });
  }, [queryClient]);
  
  // Handler for new bids
  const handleNewBid = useCallback((bid: any) => {
    if (!syncEnabledRef.current) return;
    
    // Invalidate bid lists
    queryClient.invalidateQueries(['bids']);
    
    // Invalidate the related task
    if (bid.taskId) {
      queryClient.invalidateQueries(['task', bid.taskId]);
    }
    
    // Show toast notification
    toast({
      title: 'New Bid Received',
      description: `You received a new bid for $${bid.amount}.`,
      variant: 'default',
    });
  }, [queryClient]);
  
  // Handler for notifications
  const handleNotification = useCallback((notification: any) => {
    if (!syncEnabledRef.current) return;
    
    // Invalidate notifications queries
    queryClient.invalidateQueries(['notifications']);
    
    // Show toast notification
    toast({
      title: 'New Notification',
      description: notification.message,
      variant: 'default',
    });
  }, [queryClient]);
  
  // Handler for new messages
  const handleNewMessage = useCallback((message: any) => {
    if (!syncEnabledRef.current) return;
    
    // Invalidate messages and conversation queries
    queryClient.invalidateQueries(['messages']);
    queryClient.invalidateQueries(['conversations']);
    
    if (message.conversationId) {
      queryClient.invalidateQueries(['conversation', message.conversationId]);
    }
    
    // Show toast notification (could be conditional based on current route)
    toast({
      title: 'New Message',
      description: `${message.sender.firstName}: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`,
      variant: 'default',
    });
  }, [queryClient]);
  
  // Subscribe to relevant events
  useEffect(() => {
    if (!isConnected) return;
    
    const unsubscribeTaskUpdate = realtimeService.on(SocketEventType.TASK_UPDATED, handleTaskUpdate);
    const unsubscribeBidUpdate = realtimeService.on(SocketEventType.BID_UPDATED, handleBidUpdate);
    const unsubscribeNewBid = realtimeService.on(SocketEventType.BID_RECEIVED, handleNewBid);
    const unsubscribeNotification = realtimeService.on(SocketEventType.NOTIFICATION_RECEIVED, handleNotification);
    const unsubscribeMessage = realtimeService.on(SocketEventType.MESSAGE_RECEIVED, handleNewMessage);
    
    return () => {
      unsubscribeTaskUpdate();
      unsubscribeBidUpdate();
      unsubscribeNewBid();
      unsubscribeNotification();
      unsubscribeMessage();
    };
  }, [
    isConnected, 
    handleTaskUpdate, 
    handleBidUpdate, 
    handleNewBid, 
    handleNotification, 
    handleNewMessage
  ]);
  
  // Return controls for the sync
  return {
    enableSync: () => {
      syncEnabledRef.current = true;
    },
    disableSync: () => {
      syncEnabledRef.current = false;
    },
    isSyncEnabled: () => syncEnabledRef.current
  };
}
