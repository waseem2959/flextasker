/**
 * Socket Service for Real-time Communication
 * 
 * This service provides implementation for real-time communication,
 * supporting both WebSocket and Socket.io transports with a consistent interface.
 * It handles connection management, authentication, event handling, and data synchronization.
 */

import { io, Socket } from 'socket.io-client';
import { tokenManager } from '../auth/service';

// Connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Event types
export enum SocketEventType {
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_CREATED = 'TASK_CREATED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_UPDATED = 'BID_UPDATED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  TYPING_STARTED = 'TYPING_STARTED',
  TYPING_STOPPED = 'TYPING_STOPPED'
}

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${API_URL}/socket`;

/**
 * Socket service class that handles real-time communication
 */
class SocketService {
  private socket: Socket | null = null;
  private webSocket: WebSocket | null = null;
  private transportType: 'socketio' | 'websocket' = 'socketio';
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private heartbeatInterval = 30000; // 30 seconds
  
  // Event handlers
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  
  /**
   * Initializes the socket connection
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = tokenManager.getToken();
      
      if (!token) {
        console.warn('No authentication token found, skipping socket connection');
        reject(new Error('No authentication token'));
        return;
      }
      
      this.setConnectionState(ConnectionState.CONNECTING);
      
      if (this.transportType === 'socketio') {
        this.connectSocketIO(token, resolve, reject);
      } else {
        this.connectWebSocket(token, resolve, reject);
      }
    });
  }
  
  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Check if the socket is connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
  
  /**
   * Disconnect the socket
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.connectionStateHandlers.delete(callback);
    };
  }
  
  /**
   * Subscribe to a socket event
   */
  on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(callback as any);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback as any);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }
  
  /**
   * Emit a socket event
   */
  emit(event: string | SocketEventType, data: any): void {
    if (!this.isConnected()) {
      console.warn(`Cannot emit event ${event} while disconnected`);
      return;
    }
    
    if (this.socket) {
      this.socket.emit(event, data);
    } else if (this.webSocket) {
      this.webSocket.send(JSON.stringify({ event, data }));
    }
  }
  
  /**
   * Join a conversation
   */
  joinConversation(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      this.emit('join:conversation', { conversationId });
      resolve();
    });
  }
  
  /**
   * Send a chat message
   */
  sendChatMessage(conversationId: string, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      const message = {
        conversationId,
        content,
        timestamp: new Date().toISOString()
      };
      
      this.emit('chat:message', message);
      resolve(message);
    });
  }
  
  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.isConnected()) {
      return;
    }
    
    const event = isTyping ? 'typing:start' : 'typing:stop';
    this.emit(event, { conversationId });
  }
  
  /**
   * Update user presence status
   */
  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    if (!this.isConnected()) {
      return;
    }
    
    this.emit('user:status', { status });
  }
  
  /**
   * Mark messages as read
   */
  markMessagesAsRead(messageIds: string[]): void {
    if (!this.isConnected() || !messageIds.length) {
      return;
    }
    
    this.emit('messages:read', { messageIds });
  }

  /**
   * Connect using Socket.IO
   */
  private connectSocketIO(token: string, resolve: () => void, reject: (error: Error) => void): void {
    try {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      this.setupSocketIOEvents(resolve, reject);
    } catch (error) {
      this.setConnectionState(ConnectionState.ERROR);
      reject(error instanceof Error ? error : new Error('Failed to connect to socket'));
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketIOEvents(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.setConnectionState(ConnectionState.CONNECTED);
      this.startHeartbeat();
      resolve();
    });

    this.socket.on('disconnect', () => {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.clearTimers();
    });

    this.socket.on('reconnect', () => {
      this.setConnectionState(ConnectionState.CONNECTED);
      this.startHeartbeat();
    });

    this.socket.on('reconnect_attempt', () => {
      this.setConnectionState(ConnectionState.RECONNECTING);
    });

    this.socket.on('reconnect_failed', () => {
      this.setConnectionState(ConnectionState.ERROR);
      reject(new Error('Failed to reconnect to socket'));
    });

    this.socket.on('connect_error', (error) => {
      this.setConnectionState(ConnectionState.ERROR);
      reject(error instanceof Error ? error : new Error('Socket connection error'));
    });

    // Listen for server events and dispatch to registered handlers
    this.socket.onAny((eventName, data) => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${eventName}:`, error);
          }
        });
      }
    });
  }

  /**
   * Connect using WebSocket
   */
  private connectWebSocket(token: string, resolve: () => void, reject: (error: Error) => void): void {
    try {
      const url = `${SOCKET_URL.replace(/^http/, 'ws')}?token=${token}`;
      this.webSocket = new WebSocket(url);

      this.setupWebSocketEvents(resolve, reject);
    } catch (error) {
      this.setConnectionState(ConnectionState.ERROR);
      reject(error instanceof Error ? error : new Error('Failed to connect WebSocket'));
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketEvents(resolve: () => void, reject: (error: Error) => void): void {
    if (!this.webSocket) return;

    this.webSocket.addEventListener('open', () => {
      this.setConnectionState(ConnectionState.CONNECTED);
      this.startHeartbeat();
      resolve();
    });

    this.webSocket.addEventListener('close', () => {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.clearTimers();

      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.setConnectionState(ConnectionState.RECONNECTING);

        this.reconnectTimer = window.setTimeout(() => {
          const token = tokenManager.getToken();
          if (token) {
            this.connectWebSocket(token, resolve, reject);
          }
        }, 1000 * this.reconnectAttempts);
      } else {
        this.setConnectionState(ConnectionState.ERROR);
        reject(new Error('Failed to reconnect WebSocket after maximum attempts'));
      }
    });

    this.webSocket.addEventListener('error', () => {
      this.setConnectionState(ConnectionState.ERROR);
      reject(new Error('WebSocket connection error'));
    });

    this.webSocket.addEventListener('message', (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error(`Error in event handler for ${eventName}:`, error);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
  }

  /**
   * Start heartbeat for keeping connection alive
   */
  private startHeartbeat(): void {
    this.clearTimers();

    // Send ping every heartbeatInterval
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        if (this.socket) {
          this.socket.emit('ping');
        } else if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
          this.webSocket.send(JSON.stringify({ event: 'ping' }));
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
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
export const socketService = new SocketService();

// Default export for convenience
export default socketService;
