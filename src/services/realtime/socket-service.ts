/**
 * Socket Service
 * 
 * This service provides a comprehensive implementation for real-time communication,
 * supporting both WebSocket and Socket.io transports with a consistent interface.
 * It handles connection management, authentication, event handling, and data synchronization.
 */

import { io, Socket } from 'socket.io-client';
import { tokenManager } from '../auth/auth-service';
import { logger } from '../logging';
import { SocketEvent } from './socket-events';
import { ConnectionOptions, ConnectionState, SocketServiceConfig } from './socket-types';

// Default configuration
const DEFAULT_CONFIG: SocketServiceConfig = {
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  autoReconnect: true,
  transports: ['websocket', 'polling'],
  defaultQuery: {}
};

/**
 * Core socket service class that handles real-time communication
 */
class SocketService {
  // Socket instance
  private socket: Socket | null = null;
  
  // Connection state tracking
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  
  // Configuration
  private config: SocketServiceConfig;
  
  // Event handlers
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  
  // Authentication token
  private authToken: string | null = null;
  
  /**
   * Constructor
   * 
   * @param config Service configuration
   */
  constructor(config: Partial<SocketServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Connect to the socket server
   * 
   * @param options Connection options
   * @returns Promise that resolves when connected, or rejects if connection fails
   */
  public connect(options: ConnectionOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Disconnect if already connected
      if (this.socket) {
        this.disconnect();
      }
      
      // Get authentication token
      if (options.token) {
        this.authToken = options.token;
      } else if (options.autoAuthenticate !== false) {
        this.authToken = tokenManager.getToken();
      }
      
      // Update connection state
      this.updateConnectionState(ConnectionState.CONNECTING);
      
      // Socket URL
      const socketUrl = options.url ?? this.config.socketUrl;

      try {
        // Connection options
        const connectionOptions = {
          auth: this.authToken ? { token: this.authToken } : undefined,
          reconnectionAttempts: options.maxReconnectAttempts ?? this.config.maxReconnectAttempts,
          reconnectionDelay: options.reconnectDelay ?? this.config.reconnectDelay,
          transports: options.transports ?? this.config.transports,
          query: { ...this.config.defaultQuery, ...(options.query || {}) }
        };
        
        // Initialize Socket.io connection with error handling
        this.socket = io(socketUrl, connectionOptions);
      
        // Set up event handlers for connection management
        this.setupConnectionHandlers();
        
        // Handle connection events for this promise
        const onConnect = () => {
          this.socket?.off('connect_error', onError);
          resolve();
        };
        
        const onError = (error: Error) => {
          this.socket?.off('connect', onConnect);
          reject(error);
        };
        
        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onError);
      } catch (error) {
        this.updateConnectionState(ConnectionState.DISCONNECTED);
        reject(error instanceof Error ? error : new Error('Connection failed'));
      }
    });
  }
  
  /**
   * Get the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Register a handler to be notified of connection state changes
   * 
   * @param handler Function to call when connection state changes
   * @returns Function to unregister this handler
   */
  public onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.add(handler);
    
    // Immediately notify handler of current state
    handler(this.connectionState);
    
    // Return function to unregister
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }
  
  /**
   * Subscribe to an event
   * 
   * @param eventName Name of the event to listen for
   * @param handler Function to call when event is received
   * @returns Function to unsubscribe from this event
   */
  public on<T = any>(eventName: string, handler: (data: T) => void): () => void {
    // Initialize handler set if it doesn't exist
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
      
      // Set up socket listener if we have an active socket
      if (this.socket) {
        this.socket.on(eventName, (data: T) => {
          const handlers = this.eventHandlers.get(eventName);
          if (handlers) {
            handlers.forEach(h => h(data));
          }
        });
      }
    }
    
    // Add handler to the set
    const handlers = this.eventHandlers.get(eventName);
    handlers?.add(handler);
    
    // Return function to unsubscribe
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        
        // If no more handlers, remove the event listener
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventName);
          
          // Remove socket listener if we have an active socket
          if (this.socket) {
            this.socket.off(eventName);
          }
        }
      }
    };
  }
  
  /**
   * Subscribe to multiple events with the same handler
   * 
   * @param eventNames Array of event names to listen for
   * @param handler Function to call when any of the events is received
   * @returns Function to unsubscribe from all events
   */
  public onMany<T = any>(eventNames: string[], handler: (eventName: string, data: T) => void): () => void {
    const unsubscribers: (() => void)[] = [];
    
    for (const eventName of eventNames) {
      const unsubscribe = this.on<T>(eventName, (data) => {
        handler(eventName, data);
      });
      
      unsubscribers.push(unsubscribe);
    }
    
    // Return function to unsubscribe from all events
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }
  
  /**
   * Subscribe to an event for a single occurrence
   * 
   * @param eventName Name of the event to listen for
   * @param handler Function to call when event is received
   * @returns Function to unsubscribe from this event
   */
  public once<T = any>(eventName: string, handler: (data: T) => void): () => void {
    if (!this.socket) {
      const unsubscribe = this.on<T>(eventName, handler);
      return unsubscribe;
    }
    
    this.socket.once(eventName, handler);
    
    // Return function to unsubscribe
    return () => {
      if (this.socket) {
        this.socket.off(eventName, handler);
      }
    };
  }
  
  /**
   * Emit an event to the server
   * 
   * @param eventName Name of the event to emit
   * @param data Data to send with the event
   * @returns Promise that resolves when the event is acknowledged, or rejects if there is an error
   */
  public emit<T = any, R = any>(eventName: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }
      
      if (this.connectionState !== ConnectionState.CONNECTED) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      this.socket.emit(eventName, data, (response: { success: boolean; error?: string; data?: R }) => {
        if (response && response.success) {
          resolve(response.data as R);
        } else {
          reject(new Error(response?.error ?? 'Unknown error'));
        }
      });
    });
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.updateConnectionState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * Reconnect to the server
   * 
   * @returns Promise that resolves when reconnected, or rejects if reconnection fails
   */
  public reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }
  
  /**
   * Check if the socket is currently connected
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
  
  /**
   * Join a room to receive room-specific events
   * 
   * @param room Room name or ID
   * @returns Promise that resolves when joined, or rejects if there is an error
   */
  public joinRoom(room: string): Promise<void> {
    return this.emit('join_room', { room });
  }
  
  /**
   * Leave a room
   * 
   * @param room Room name or ID
   * @returns Promise that resolves when left, or rejects if there is an error
   */
  public leaveRoom(room: string): Promise<void> {
    return this.emit('leave_room', { room });
  }
  
  /**
   * Subscribe to task events
   * 
   * @param taskId Task ID
   * @param handler Function to call when a task event is received
   * @returns Function to unsubscribe from task events
   */
  public subscribeToTask<T = any>(taskId: string, handler: (event: string, data: T) => void): Promise<() => void> {
    return this.joinRoom(`task:${taskId}`)
      .then(() => {
        const taskEvents = [
          SocketEvent.TASK_UPDATE,
          SocketEvent.NEW_BID,
          SocketEvent.BID_UPDATE
        ];
        
        return this.onMany<T>(taskEvents, handler);
      });
  }
  
  /**
   * Subscribe to chat events
   * 
   * @param chatId Chat ID
   * @param handler Function to call when a chat event is received
   * @returns Function to unsubscribe from chat events
   */
  public subscribeToChat<T = any>(chatId: string, handler: (event: string, data: T) => void): Promise<() => void> {
    return this.joinRoom(`chat:${chatId}`)
      .then(() => {
        const chatEvents = [
          SocketEvent.NEW_MESSAGE,
          SocketEvent.USER_STATUS_CHANGE
        ];
        
        return this.onMany<T>(chatEvents, handler);
      });
  }
  
  /**
   * Get the current user status
   * 
   * @param userId User ID
   * @returns Promise that resolves with the user status
   */
  public getUserStatus(userId: string): Promise<{ online: boolean; lastActive?: string }> {
    return this.emit(SocketEvent.GET_USER_STATUS, { userId });
  }
  
  /**
   * Set up handlers for connection events
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;
    
    // Connection successful
    this.socket.on(SocketEvent.CONNECT, () => {
      this.reconnectAttempts = 0;
      this.updateConnectionState(ConnectionState.CONNECTED);
      
      // Re-register event handlers
      this.reregisterEventHandlers();
    });
    
    // Disconnection
    this.socket.on(SocketEvent.DISCONNECT, (reason) => {
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        this.updateConnectionState(ConnectionState.DISCONNECTED);
      } else {
        // Client-side disconnect, may reconnect
        this.updateConnectionState(ConnectionState.RECONNECTING);
      }
    });
    
    // Connection error
    this.socket.on(SocketEvent.CONNECT_ERROR, (error) => {
      logger.error('Socket connection error', { error });
      this.updateConnectionState(ConnectionState.ERROR);
      
      // Attempt reconnect if enabled
      if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.reconnectAttempts++;
        
        // Emit reconnect attempt event
        this.dispatchToHandlers(SocketEvent.RECONNECT_ATTEMPT, {
          attempt: this.reconnectAttempts,
          maxAttempts: this.config.maxReconnectAttempts
        });
      } else {
        // Max reconnect attempts reached
        this.dispatchToHandlers(SocketEvent.RECONNECT_FAILED, {
          error: 'Maximum reconnection attempts reached'
        });
      }
    });
    
    // Reconnect successful
    this.socket.on(SocketEvent.RECONNECT, (attemptNumber) => {
      this.reconnectAttempts = 0;
      this.updateConnectionState(ConnectionState.CONNECTED);
      
      // Emit reconnect event
      this.dispatchToHandlers(SocketEvent.RECONNECT, { attemptNumber });
    });
    
    // Authentication error event
    this.socket.on('auth_error', (error) => {
      logger.error('Socket authentication error', { error });
      
      // Clear invalid token
      this.authToken = null;
      
      // Emit authentication error event
      document.dispatchEvent(new CustomEvent('auth-token-invalid'));
    });
  }
  
  /**
   * Update the connection state and notify handlers
   * 
   * @param state New connection state
   */
  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      
      // Notify connection state handlers
      this.connectionStateHandlers.forEach(handler => {
        try {
          handler(state);
        } catch (error) {
          logger.error('Error in connection state handler', { error });
        }
      });
      
      // Dispatch connection state event to document
      document.dispatchEvent(new CustomEvent('socket-connection-state-change', { 
        detail: { state } 
      }));
    }
  }
  
  /**
   * Re-register event handlers after reconnection
   */
  private reregisterEventHandlers(): void {
    if (!this.socket) return;
    
    // Re-register all event handlers
    this.eventHandlers.forEach((handlers, eventName) => {
      if (handlers.size > 0) {
        this.socket?.on(eventName, (data: any) => {
          handlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              logger.error(`Error in handler for event ${eventName}`, { error, eventName });
            }
          });
        });
      }
    });
  }
  
  /**
   * Dispatch an event to all registered handlers
   * 
   * @param eventName Event name
   * @param data Event data
   */
  private dispatchToHandlers<T = any>(eventName: string, data: T): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in handler for event ${eventName}`, { error, eventName });
        }
      });
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Export alias for backward compatibility
export const realtimeService = socketService;

// Default export
export default socketService;

// Export the class for custom instances
export { SocketService };

