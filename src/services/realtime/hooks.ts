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
 * Helper function to create query invalidation handler
 */
const createQueryInvalidationHandler = (
  queryClient: ReturnType<typeof useQueryClient>,
  keys: string[]
) => {
  return () => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };
};

/**
 * Helper function to setup event handlers for query invalidation
 */
const setupQueryInvalidationHandlers = (
  queryKeys: Record<string, string[]>,
  queryClient: ReturnType<typeof useQueryClient>
): (() => void)[] => {
  const unsubscribers: (() => void)[] = [];

  Object.entries(queryKeys).forEach(([eventType, keys]) => {
    const handler = createQueryInvalidationHandler(queryClient, keys);
    unsubscribers.push(realtimeService.on(eventType, handler));
  });

  return unsubscribers;
};

/**
 * Hook for invalidating queries when socket events are received
 */
export function useSocketQueryInvalidation(queryKeys: Record<string, string[]>) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribers = setupQueryInvalidationHandlers(queryKeys, queryClient);

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient, queryKeys]);
}

/**
 * Helper function to create notification handler
 */
const createNotificationHandler = (config: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => {
  return () => {
    toast({
      title: config.title,
      description: config.description,
      variant: config.variant ?? 'default'
    });
  };
};

/**
 * Helper function to setup notification handlers
 */
const setupNotificationHandlers = (
  notifications: Record<string, {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }>
): (() => void)[] => {
  const unsubscribers: (() => void)[] = [];

  Object.entries(notifications).forEach(([eventType, config]) => {
    const handler = createNotificationHandler(config);
    unsubscribers.push(realtimeService.on(eventType, handler));
  });

  return unsubscribers;
};

/**
 * Hook for showing toast notifications when socket events are received
 */
export function useSocketNotifications(notifications: Record<string, {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}>) {
  useEffect(() => {
    const unsubscribers = setupNotificationHandlers(notifications);

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [notifications]);
}