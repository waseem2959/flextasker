/**
 * Socket Communication Hooks
 * 
 * This file provides React hooks for integrating with the socket communication service.
 * It provides a clean, simplified interface for real-time features.
 */

import { showErrorNotification } from '@/services/error/error-service';
import { SocketEventType } from '@/services/realtime/socket-events';
import { realtimeService } from '@/services/realtime/socket-service';
import { ConnectionState } from '@/services/realtime/socket-types';
import { Message, Task, User } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './use-auth';

/**
 * Hook for managing socket communication connections
 */
export function useSocket() {
  const { token } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    realtimeService.getConnectionState()
  );
  const [error, setError] = useState<Error | null>(null);
  
  // Connect to socket service when auth token is available
  useEffect(() => {
    if (!token) {
      return;
    }
    
    const connect = async () => {
      try {
        await realtimeService.connect();
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to connect to socket service');
        setError(error);
        showErrorNotification(error.message);
      }
    };
    
    // Subscribe to connection state changes
    const unsubscribe = realtimeService.onConnectionStateChange(setConnectionState);
    
    // Connect if not already connected
    if (!realtimeService.isConnected()) {
      connect();
    }
    
    // Cleanup on unmount or token change
    return () => {
      unsubscribe();
      // Don't disconnect on unmount as other components may be using the socket
      // Only disconnect when the user logs out, which is handled in auth service
    };
  }, [token]);
  
  // Function to manually reconnect
  const reconnect = useCallback(async () => {
    if (connectionState !== ConnectionState.CONNECTED) {
      try {
        await realtimeService.connect();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to reconnect'));
        showErrorNotification('Failed to reconnect to real-time service');
        return false;
      }
    }
    return true;
  }, [connectionState]);
  
  return {
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    connectionState,
    error,
    reconnect
  };
}

/**
 * Hook for subscribing to socket events
 */
export function useSocketEvent<T = any>(
  eventType: SocketEventType | string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = realtimeService.on(eventType, callback);
    
    // Cleanup on unmount or deps change
    return () => {
      unsubscribe();
    };
  }, [eventType, callback, ...deps]);
}

/**
 * Hook for subscribing to task updates
 */
export function useTaskUpdates(taskId: string, onUpdate?: (task: Task) => void) {
  const [task, setTask] = useState<Task | null>(null);
  
  useSocketEvent<Task>(
    `task:${taskId}:updated`,
    (updatedTask) => {
      setTask(updatedTask);
      if (onUpdate) {
        onUpdate(updatedTask);
      }
    },
    [taskId, onUpdate]
  );
  
  return { task };
}

/**
 * Hook for chat functionality
 */
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Subscribe to new messages
  useSocketEvent<Message>(
    `conversation:${conversationId}:message`,
    (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    [conversationId]
  );
  
  // Subscribe to typing indicators
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  
  useSocketEvent<{ user: User }>(
    `conversation:${conversationId}:typing:start`,
    ({ user }) => {
      setTypingUsers((prevUsers) => {
        if (!prevUsers.some((u) => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
    },
    [conversationId]
  );
  
  useSocketEvent<{ user: User }>(
    `conversation:${conversationId}:typing:stop`,
    ({ user }) => {
      setTypingUsers((prevUsers) => 
        prevUsers.filter((u) => u.id !== user.id)
      );
    },
    [conversationId]
  );
  
  // Function to send a message
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        
        // Emit the message event
        realtimeService.emit(`conversation:${conversationId}:send`, {
          content,
          conversationId
        });
        
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        showErrorNotification(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );
  
  // Function to indicate typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      const eventName = isTyping
        ? `conversation:${conversationId}:typing:start`
        : `conversation:${conversationId}:typing:stop`;
      
      realtimeService.emit(eventName, { conversationId });
    },
    [conversationId]
  );
  
  return {
    messages,
    typingUsers,
    isLoading,
    error,
    sendMessage,
    setTyping
  };
}

// Export default useSocket for convenience
export default useSocket;
