/**
 * WebSocket Service for Real-time Synchronization
 * 
 * This service provides real-time data synchronization across devices using WebSockets.
 * It handles connection management, reconnection, event handling, and message dispatch.
 */

import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenManager } from '../api/token-manager';

// Event types for real-time updates
export enum SocketEventType {
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_CREATED = 'TASK_CREATED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_UPDATED = 'BID_UPDATED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED'
}

// Interface for socket events
export interface SocketEvent<T = any> {
  type: SocketEventType;
  data: T;
  timestamp: string;
}

// Socket connection states
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING'
}

// WebSocket service class
export class SocketService {
  private socket: WebSocket | null = null;
  private eventHandlers: Map<SocketEventType, Set<(data: any) => void>> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private reconnectTimer: number | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private socketUrl: string;
  private pingInterval: number | null = null;
  
  constructor(socketUrl: string) {
    this.socketUrl = socketUrl;
  }
  
  // Connect to the WebSocket server
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('Socket is already connected or connecting');
      return;
    }
    
    this.setConnectionState(ConnectionState.CONNECTING);
    
    try {
      // Add authentication token to the WebSocket connection
      const token = tokenManager.getToken();
      const url = token ? `${this.socketUrl}?token=${token}` : this.socketUrl;
      
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.scheduleReconnect();
    }
  }
  
  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (!this.socket) {
      return;
    }
    
    // Clear timers
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close the connection
    this.socket.close();
    this.socket = null;
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }
  
  // Subscribe to a specific event type
  public on<T>(eventType: SocketEventType, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    
    // Return an unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }
  
  // Subscribe to connection state changes
  public onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.add(handler);
    
    // Immediately call the handler with the current state
    handler(this.connectionState);
    
    // Return an unsubscribe function
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }
  
  // Send a message to the server
  public send(eventType: SocketEventType, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, socket is not open');
      return;
    }
    
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
    
    this.socket.send(message);
  }
  
  // Get the current connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  // Handle WebSocket open event
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Start sending ping messages to keep the connection alive
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }
  
  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as SocketEvent;
      
      // Handle ping/pong messages for connection keepalive
      if (message.type === 'pong') {
        return;
      }
      
      // Dispatch the event to registered handlers
      const handlers = this.eventHandlers.get(message.type as SocketEventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error(`Error in event handler for ${message.type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Clear ping interval
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
    
    // Don't reconnect if the close was clean (normal closure)
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    // The socket will automatically close after an error, which will trigger handleClose()
  }
  
  // Schedule a reconnect attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Maximum reconnect attempts reached');
        toast({
          title: 'Connection Lost',
          description: 'Could not reconnect to the server. Please refresh the page.',
          variant: 'destructive'
        });
      }
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.setConnectionState(ConnectionState.RECONNECTING);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  // Update connection state and notify listeners
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState === state) {
      return;
    }
    
    this.connectionState = state;
    
    // Notify all connection state handlers
    this.connectionStateHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in connection state handler:', error);
      }
    });
  }
}

// Create a singleton instance
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'wss://api.flextasker.com/socket';
export const socketService = new SocketService(SOCKET_URL);

// React hook for using the socket service
export function useSocket() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socketService.getConnectionState()
  );
  
  useEffect(() => {
    // Connect to the socket when the component mounts
    socketService.connect();
    
    // Subscribe to connection state changes
    const unsubscribe = socketService.onConnectionStateChange(setConnectionState);
    
    // Disconnect when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Return the socket service and connection state
  return {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    on: socketService.on.bind(socketService),
    send: socketService.send.bind(socketService),
    connect: socketService.connect.bind(socketService),
    disconnect: socketService.disconnect.bind(socketService)
  };
}

// React hook for subscribing to socket events
export function useSocketEvent<T>(eventType: SocketEventType, handler: (data: T) => void) {
  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = socketService.on<T>(eventType, handler);
    
    // Unsubscribe when the component unmounts or dependencies change
    return unsubscribe;
  }, [eventType, handler]);
}

// React hook for real-time data synchronization with React Query
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  
  // Setup handlers for different event types
  const setupSyncHandlers = useCallback(() => {
    // Task updates
    const taskUpdatedHandler = (data: { taskId: string; task: any }) => {
      queryClient.setQueryData(['tasks', 'detail', data.taskId], {
        success: true,
        message: 'Task updated via socket',
        data: data.task,
        timestamp: new Date().toISOString()
      });
      
      // Also update task lists
      queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'my'] });
    };
    
    // Bid updates
    const bidReceivedHandler = (data: { taskId: string; bid: any }) => {
      // Update bid lists for the task
      queryClient.setQueriesData({ queryKey: ['bids', 'task', data.taskId] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: [data.bid, ...oldData.data]
        };
      });
      
      // Update bid count on the task
      queryClient.setQueriesData({ queryKey: ['tasks', 'detail', data.taskId] }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            bidCount: (oldData.data.bidCount || 0) + 1
          }
        };
      });
    };
    
    // Notification updates
    const notificationReceivedHandler = (data: { notification: any }) => {
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
      
      // Show a toast notification
      toast({
        title: data.notification.title,
        description: data.notification.message,
        variant: 'default'
      });
    };
    
    // Subscribe to events
    const unsubscribers = [
      socketService.on(SocketEventType.TASK_UPDATED, taskUpdatedHandler),
      socketService.on(SocketEventType.TASK_CREATED, (data) => {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] });
      }),
      socketService.on(SocketEventType.BID_RECEIVED, bidReceivedHandler),
      socketService.on(SocketEventType.BID_UPDATED, (data) => {
        queryClient.invalidateQueries({ queryKey: ['bids', 'task', data.taskId] });
      }),
      socketService.on(SocketEventType.NOTIFICATION_RECEIVED, notificationReceivedHandler)
    ];
    
    // Return a cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient]);
  
  // Set up and clean up handlers
  useEffect(() => {
    const cleanup = setupSyncHandlers();
    return cleanup;
  }, [setupSyncHandlers]);
  
  // Return the connection state
  return useSocket();
}
