import { useCallback, useEffect, useState } from 'react';
import { realtimeService } from '../services/realtime/socket-service';
import { ConnectionState } from '../services/realtime/types';

/**
 * Custom hook to manage realtime connection state and provide realtime functionality
 */
export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeService.getConnectionState()
  );

  // Subscribe to connection state changes
  useEffect(() => {
    const handleConnectionStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      setIsConnected(state === ConnectionState.CONNECTED);
    };

    // Set initial state
    handleConnectionStateChange(realtimeService.getConnectionState());

    // Subscribe to future changes
    const unsubscribe = realtimeService.onConnectionStateChange(handleConnectionStateChange);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  // Helper to get the current connection state
  const getConnectionState = useCallback(() => {
    return realtimeService.getConnectionState();
  }, []);

  // Helper to check if connected
  const checkConnected = useCallback((): boolean => {
    return realtimeService.isConnected();
  }, []);

  // Reconnect if disconnected
  const ensureConnected = useCallback(async (): Promise<boolean> => {
    if (realtimeService.isConnected()) return true;
    
    try {
      realtimeService.reconnect();
      return true;
    } catch (error) {
      console.error('Failed to reconnect to realtime service:', error);
      return false;
    }
  }, []);

  return {
    // State
    isConnected,
    connectionState,
    
    // Methods
    getConnectionState,
    checkConnected,
    ensureConnected,
  };
}

/**
 * Hook to subscribe to a realtime event
 */
export function useRealtimeEvent<T = any>(
  eventName: string,
  handler: (data: T) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = realtimeService.on(eventName, handler);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [eventName, ...deps]);
}

export default useRealtime;
