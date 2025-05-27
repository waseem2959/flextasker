/**
 * WebSocket Client Service
 * 
 * This module provides a client-side socket.io implementation for real-time
 * communication with the server.
 */

import { io, Socket } from 'socket.io-client';
import { NotificationType } from '@/types/enums';

// Socket instance
let socket: Socket | null = null;

// Socket connection status
let isConnected = false;

// Event listeners
type EventListener = (...args: any[]) => void;
const listeners: Record<string, EventListener[]> = {};

/**
 * Initializes the WebSocket connection with the server
 * @param token JWT authentication token
 */
export function initializeSocket(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    // Close existing connection if any
    if (socket) {
      socket.close();
    }
    
    // API URL from environment or default
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Create new socket connection
    socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected');
      isConnected = true;
      resolve(socket!);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected = false;
      reject(error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      isConnected = false;
    });
    
    // Handle reconnection
    socket.on('reconnect', (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
      isConnected = true;
    });
    
    // Initialize event listeners from stored callbacks
    if (Object.keys(listeners).length > 0) {
      registerStoredListeners();
    }
  });
}

/**
 * Registers stored event listeners with the socket
 */
function registerStoredListeners(): void {
  if (!socket) return;
  
  Object.entries(listeners).forEach(([event, eventListeners]) => {
    eventListeners.forEach(listener => {
      socket!.on(event, listener);
    });
  });
}

/**
 * Checks if the socket is currently connected
 */
export function isSocketConnected(): boolean {
  return isConnected && !!socket?.connected;
}

/**
 * Subscribes to a socket event
 * @param event Event name
 * @param callback Event callback function
 */
export function on(event: string, callback: EventListener): void {
  // Store the listener
  if (!listeners[event]) {
    listeners[event] = [];
  }
  
  listeners[event].push(callback);
  
  // Register with socket if connected
  if (socket) {
    socket.on(event, callback);
  }
}

/**
 * Unsubscribes from a socket event
 * @param event Event name
 * @param callback Event callback function to remove
 */
export function off(event: string, callback?: EventListener): void {
  if (!socket) return;
  
  if (callback) {
    // Remove specific listener
    socket.off(event, callback);
    
    // Update stored listeners
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
      if (listeners[event].length === 0) {
        delete listeners[event];
      }
    }
  } else {
    // Remove all listeners for this event
    socket.off(event);
    delete listeners[event];
  }
}

/**
 * Emits an event to the server
 * @param event Event name
 * @param data Event data
 * @param callback Optional callback function
 */
export function emit(event: string, data?: any, callback?: (response: any) => void): void {
  if (!socket) {
    console.error('Socket not connected. Cannot emit event:', event);
    return;
  }
  
  if (callback) {
    socket.emit(event, data, callback);
  } else {
    socket.emit(event, data);
  }
}

/**
 * Joins a task room to receive real-time updates
 * @param taskId Task ID
 */
export function joinTaskRoom(taskId: string): void {
  if (!socket || !isConnected) return;
  emit('task:join', taskId);
}

/**
 * Leaves a task room
 * @param taskId Task ID
 */
export function leaveTaskRoom(taskId: string): void {
  if (!socket || !isConnected) return;
  emit('task:leave', taskId);
}

/**
 * Fetches user notifications
 * @returns Promise resolving to notifications
 */
export function getNotifications(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('notifications:get', null, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to fetch notifications'));
      }
    });
  });
}

/**
 * Marks a notification as read
 * @param notificationId Notification ID
 */
export function markNotificationAsRead(notificationId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('notifications:markAsRead', notificationId, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.message || 'Failed to mark notification as read'));
      }
    });
  });
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsAsRead(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('notifications:markAllAsRead', null, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.message || 'Failed to mark all notifications as read'));
      }
    });
  });
}

/**
 * Sends a chat message
 * @param receiverId Recipient user ID
 * @param content Message content
 */
export function sendChatMessage(receiverId: string, content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('chat:sendMessage', { receiverId, content }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to send message'));
      }
    });
  });
}

/**
 * Fetches chat messages with another user
 * @param otherUserId Other user ID
 */
export function getChatMessages(otherUserId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('chat:getMessages', otherUserId, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to fetch messages'));
      }
    });
  });
}

/**
 * Fetches all user conversations
 */
export function getConversations(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('chat:getConversations', null, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to fetch conversations'));
      }
    });
  });
}

/**
 * Submits a bid for a task
 * @param taskId Task ID
 * @param amount Bid amount
 * @param description Bid description
 * @param timeline Timeline estimate
 */
export function submitBid(
  taskId: string, 
  amount: number, 
  description: string, 
  timeline: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('task:submitBid', { taskId, amount, description, timeline }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to submit bid'));
      }
    });
  });
}

/**
 * Accepts a bid for a task
 * @param bidId Bid ID
 */
export function acceptBid(bidId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('task:acceptBid', { bidId }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to accept bid'));
      }
    });
  });
}

/**
 * Updates task status
 * @param taskId Task ID
 * @param status New status
 */
export function updateTaskStatus(taskId: string, status: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!socket || !isConnected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    emit('task:updateStatus', { taskId, status }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.message || 'Failed to update task status'));
      }
    });
  });
}

/**
 * Disconnects the socket
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
}
