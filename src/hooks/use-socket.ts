/**
 * Socket Hook
 * 
 * A React hook for managing WebSocket connections and events
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import * as socketClient from '../services/websocket/socket-client';
import { useAuth } from './use-auth';

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Hook for managing WebSocket connections and events
 */
export function useSocket() {
  const { token } = useAuth();
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const eventListeners = useRef<Record<string, ((...args: any[]) => void)[]>>({});

  /**
   * Connects to the WebSocket server
   */
  const connect = useCallback(async () => {
    if (!token) {
      setError(new Error('Authentication token required'));
      return;
    }

    try {
      setStatus('connecting');
      const socketInstance = await socketClient.initializeSocket(token);
      setSocket(socketInstance);
      setStatus('connected');
      setError(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to connect to socket server'));
    }
  }, [token]);

  /**
   * Subscribes to a socket event
   */
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    // Store the event listener
    if (!eventListeners.current[event]) {
      eventListeners.current[event] = [];
    }
    eventListeners.current[event].push(callback);

    // Register with socket client
    socketClient.on(event, callback);

    // Return cleanup function
    return () => {
      socketClient.off(event, callback);
      if (eventListeners.current[event]) {
        eventListeners.current[event] = eventListeners.current[event].filter(cb => cb !== callback);
      }
    };
  }, []);

  /**
   * Emits an event to the server
   */
  const emit = useCallback((event: string, data?: any, callback?: (response: any) => void) => {
    socketClient.emit(event, data, callback);
  }, []);

  /**
   * Joins a task room
   */
  const joinTaskRoom = useCallback((taskId: string) => {
    socketClient.joinTaskRoom(taskId);
  }, []);

  /**
   * Leaves a task room
   */
  const leaveTaskRoom = useCallback((taskId: string) => {
    socketClient.leaveTaskRoom(taskId);
  }, []);

  /**
   * Disconnects from the WebSocket server
   */
  const disconnect = useCallback(() => {
    socketClient.disconnect();
    setSocket(null);
    setStatus('disconnected');
  }, []);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (token && status === 'disconnected') {
      connect();
    }

    return () => {
      // Clean up all event listeners on unmount
      Object.entries(eventListeners.current).forEach(([event, callbacks]) => {
        callbacks.forEach(callback => {
          socketClient.off(event, callback);
        });
      });
      eventListeners.current = {};
    };
  }, [token, status, connect]);

  return {
    socket,
    status,
    error,
    isConnected: status === 'connected',
    connect,
    disconnect,
    on,
    emit,
    joinTaskRoom,
    leaveTaskRoom,
    getNotifications: socketClient.getNotifications,
    markNotificationAsRead: socketClient.markNotificationAsRead,
    markAllNotificationsAsRead: socketClient.markAllNotificationsAsRead,
    sendChatMessage: socketClient.sendChatMessage,
    getChatMessages: socketClient.getChatMessages,
    getConversations: socketClient.getConversations,
    submitBid: socketClient.submitBid,
    acceptBid: socketClient.acceptBid,
    updateTaskStatus: socketClient.updateTaskStatus
  };
}
