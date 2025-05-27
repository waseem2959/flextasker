/**
 * WebSockets Module
 * 
 * This module exports all WebSocket-related functionality.
 */

// Export WebSocket initialization and manager
export { initializeWebSockets, getSocketManager } from './init';
export { SocketManager } from './socket-manager';

// Export event handlers
export { createNotification } from './handlers/notification-handlers';

// Export utility to create WebSocket events in other parts of the application
import { getSocketManager } from './init';
import { NotificationType } from '../../../shared/types/enums';

/**
 * Utility functions to emit WebSocket events from anywhere in the application
 */
export const socketEvents = {
  /**
   * Emits a notification to a specific user
   */
  emitNotification: async (
    userId: string,
    type: NotificationType,
    message: string,
    relatedId?: string
  ) => {
    try {
      const { createNotification } = await import('./handlers/notification-handlers');
      const socketManager = getSocketManager();
      
      return createNotification(socketManager, userId, type, message, relatedId);
    } catch (error) {
      console.error('Failed to emit notification', error);
    }
  },
  
  /**
   * Emits a task update to all users in a task room
   */
  emitTaskUpdate: (taskId: string, data: any) => {
    try {
      const socketManager = getSocketManager();
      socketManager.sendToTask(taskId, 'task:updated', data);
    } catch (error) {
      console.error('Failed to emit task update', error);
    }
  },
  
  /**
   * Emits a bid update to a task room
   */
  emitBidUpdate: (taskId: string, bidId: string, status: string) => {
    try {
      const socketManager = getSocketManager();
      socketManager.sendToTask(taskId, 'task:bidUpdated', {
        taskId,
        bidId,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit bid update', error);
    }
  },
  
  /**
   * Broadcasts a system-wide notification to all users
   */
  broadcastSystemNotification: (message: string) => {
    try {
      const socketManager = getSocketManager();
      socketManager.broadcast('system:notification', {
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to broadcast system notification', error);
    }
  }
};
