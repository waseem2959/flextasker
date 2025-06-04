/**
 * React Hooks for Realtime Communication
 * 
 * These hooks provide React component integration with the realtime service.
 */

import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { logger } from '../logging';
import { realtimeService } from './socket-service';
import { ConnectionState } from './socket-types';

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
        logger.error('Failed to connect to realtime service', { error });
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
 * Hook for subscribing to socket events
 */
export function useSocketEvent<T = any>(eventType: string, callback: (data: T) => void) {
  useEffect(() => {
    const unsubscribe = realtimeService.on(eventType, callback);
    return () => {
      unsubscribe();
    };
  }, [eventType, callback]);
}

/**
 * Hook for invalidating queries when socket events are received
 */
export function useSocketQueryInvalidation(queryKeys: Record<string, string[]>) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handlers: Record<string, () => void> = {};
    const unsubscribers: (() => void)[] = [];
    
    // Set up handlers for each event type
    Object.entries(queryKeys).forEach(([eventType, keys]) => {
      handlers[eventType] = () => {
        keys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      };
      
      unsubscribers.push(realtimeService.on(eventType, handlers[eventType]));
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient, queryKeys]);
}

/**
 * Hook for showing toast notifications when socket events are received
 */
export function useSocketNotifications(notifications: Record<string, {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}>) {
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // Set up handlers for each event type
    Object.entries(notifications).forEach(([eventType, config]) => {
      const handler = () => {
        toast({
          title: config.title,
          description: config.description,
          variant: config.variant ?? 'default'
        });
      };
      
      unsubscribers.push(realtimeService.on(eventType, handler));
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [notifications]);
}