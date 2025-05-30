/**
 * Unified Socket Service for Real-time Communication
 * 
 * This service provides a consolidated implementation for real-time communication,
 * supporting both WebSocket and Socket.io transports with a consistent interface.
 * It handles connection management, authentication, event handling, and data synchronization.
 */

import { io, Socket } from 'socket.io-client';
import { tokenManager } from '../auth/service';
import { ConnectionState, BidSubmission, Notification } from './types';
import { SocketEvent } from './socketEvents';

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${API_URL}/socket`;

/**
 * Core socket service class that handles real-time communication
 */
class RealtimeService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private connectionStateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private authToken: string | null = null;
  
  /**
   * Initialize the socket connection
   * 
   * @param token Optional authentication token (otherwise uses stored token)
   */
  public initialize(token?: string): void {
    if (this.socket) {
      this.disconnect();
    }
    
    if (token) {
      this.authToken = token;
    } else {
      this.authToken = tokenManager.getToken();
    }
    
    this.updateConnectionState(ConnectionState.CONNECTING);
    
    // Initialize Socket.io connection
    this.socket = io(SOCKET_URL, {
      auth: {
        token: this.authToken
      },
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      transports: ['websocket', 'polling']
    });
    
    // Set up event handlers for connection management
    this.setupConnectionHandlers();
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
        if (response.success) {
          resolve(response.data as R);
        } else {
          reject(new Error(response.error || 'Unknown error'));
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
   */
  public reconnect(): void {
    this.disconnect();
    this.initialize();
  }
  
  /**
   * Check if the socket is currently connected
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }
  
  /**
   * Set up handlers for connection events
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.updateConnectionState(ConnectionState.CONNECTED);
      
      // Re-register event handlers
      this.reregisterEventHandlers();
    });
    
    this.socket.on('disconnect', () => {
      this.updateConnectionState(ConnectionState.DISCONNECTED);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.updateConnectionState(ConnectionState.ERROR);
      
      // Attempt to reconnect manually
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.updateConnectionState(ConnectionState.ERROR);
    });
    
    this.socket.on('reconnecting', () => {
      this.updateConnectionState(ConnectionState.CONNECTING);
    });
    
    this.socket.on('reconnect_failed', () => {
      this.updateConnectionState(ConnectionState.ERROR);
    });
  }
  
  /**
   * Re-register all event handlers after reconnection
   */
  private reregisterEventHandlers(): void {
    if (!this.socket) return;
    
    // For each event, register the socket listener
    this.eventHandlers.forEach((handlers, eventName) => {
      if (this.socket) {
        this.socket.on(eventName, (data: any) => {
          handlers.forEach(handler => handler(data));
        });
      }
    });
  }
  
  /**
   * Update the connection state and notify handlers
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    
    // Notify all connection state handlers
    this.connectionStateHandlers.forEach(handler => {
      handler(state);
    });
  }
  
  // Specialized methods for application-specific events
  
  /**
   * Get notified when a new task is posted
   */
  public onNewTask(handler: (task: any) => void): () => void {
    return this.on(SocketEvent.NEW_TASK, handler);
  }
  
  /**
   * Get notified when a task is updated
   */
  public onTaskUpdate(handler: (task: any) => void): () => void {
    return this.on(SocketEvent.TASK_UPDATE, handler);
  }
  
  /**
   * Get notified when a new bid is submitted
   */
  public onNewBid(handler: (bid: BidSubmission) => void): () => void {
    return this.on(SocketEvent.NEW_BID, handler);
  }
  
  /**
   * Get notified when a bid is updated
   */
  public onBidUpdate(handler: (bid: BidSubmission) => void): () => void {
    return this.on(SocketEvent.BID_UPDATE, handler);
  }
  
  /**
   * Get notified when a new notification is received
   */
  public onNotification(handler: (notification: Notification) => void): () => void {
    return this.on(SocketEvent.NOTIFICATION, handler);
  }
  
  /**
   * Join a specific task room to receive updates about that task
   */
  public joinTaskRoom(taskId: string): Promise<void> {
    return this.emit<{ taskId: string }, void>(SocketEvent.JOIN_TASK_ROOM, { taskId });
  }
  
  /**
   * Leave a specific task room
   */
  public leaveTaskRoom(taskId: string): Promise<void> {
    return this.emit<{ taskId: string }, void>(SocketEvent.LEAVE_TASK_ROOM, { taskId });
  }
  
  /**
   * Submit a bid for a task
   */
  public submitBid(bid: BidSubmission): Promise<BidSubmission> {
    return this.emit<BidSubmission, BidSubmission>(SocketEvent.SUBMIT_BID, bid);
  }
  
  /**
   * Update a bid for a task
   */
  public updateBid(bid: BidSubmission): Promise<BidSubmission> {
    return this.emit<BidSubmission, BidSubmission>(SocketEvent.UPDATE_BID, bid);
  }
  
  /**
   * Join a chat room
   */
  public joinChatRoom(roomId: string): Promise<void> {
    return this.emit<{ roomId: string }, void>(SocketEvent.JOIN_CHAT_ROOM, { roomId });
  }
  
  /**
   * Leave a chat room
   */
  public leaveChatRoom(roomId: string): Promise<void> {
    return this.emit<{ roomId: string }, void>(SocketEvent.LEAVE_CHAT_ROOM, { roomId });
  }
  
  /**
   * Send a message to a chat room
   */
  public sendMessage(roomId: string, message: string): Promise<any> {
    return this.emit(SocketEvent.SEND_MESSAGE, { roomId, message });
  }
  
  /**
   * Mark notifications as read
   */
  public markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    return this.emit<{ notificationIds: string[] }, void>(
      SocketEvent.MARK_NOTIFICATIONS_READ,
      { notificationIds }
    );
  }
  
  /**
   * Get online status for a user
   */
  public getUserStatus(userId: string): Promise<{ userId: string; online: boolean; lastSeen?: Date }> {
    return this.emit<{ userId: string }, { userId: string; online: boolean; lastSeen?: Date }>(
      SocketEvent.GET_USER_STATUS,
      { userId }
    );
  }
  
  /**
   * Listen for user presence changes
   */
  public onUserStatusChange(handler: (status: { userId: string; online: boolean; lastSeen?: Date }) => void): () => void {
    return this.on(SocketEvent.USER_STATUS_CHANGE, handler);
  }
}

// Create a singleton instance
export const realtimeService = new RealtimeService();

// Default export for convenience
export default realtimeService;
