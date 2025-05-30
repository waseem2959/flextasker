/**
 * WebSockets Module
 * 
 * This module exports all WebSocket-related functionality in a consolidated approach.
 * It provides utilities for real-time communication including notifications, chat,
 * task updates, and user presence features.
 */

// Export WebSocket initialization and manager
export { initializeWebSockets, getSocketManager } from './init';
export { SocketManager } from './socket-manager';

// Export event handlers
export { createNotification } from './handlers/notification-handlers';
export { updateUserOnlineStatus } from './handlers/user-handlers';
export { registerChatHandlers } from './handlers/chat-handlers';
export { registerTaskHandlers } from './handlers/task-handlers';

// Export utility to create WebSocket events in other parts of the application
import { getSocketManager } from './init';
import { NotificationType, BidStatus } from '../../../shared/types/enums';

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
   * Emits a bid update to relevant users and rooms
   */
  emitBidUpdate: (taskId: string, bidId: string, status: BidStatus, bidderId: string, taskOwnerId: string) => {
    try {
      const socketManager = getSocketManager();
      
      // Emit to the task room
      socketManager.sendToTask(taskId, 'bid:updated', {
        bidId,
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Emit to specific users based on status
      switch(status) {
        case BidStatus.ACCEPTED:
          socketManager.sendToUser(bidderId, 'bid:accepted', {
            bidId,
            taskId,
            acceptedAt: new Date().toISOString()
          });
          break;
        case BidStatus.REJECTED:
          socketManager.sendToUser(bidderId, 'bid:rejected', {
            bidId,
            taskId,
            rejectedAt: new Date().toISOString()
          });
          break;
        case BidStatus.WITHDRAWN:
          socketManager.sendToUser(taskOwnerId, 'bid:withdrawn', {
            bidId,
            taskId,
            bidderId,
            withdrawnAt: new Date().toISOString()
          });
          break;
      }
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
