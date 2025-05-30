/**
 * Notification WebSocket Handlers
 * 
 * This module handles WebSocket events related to notifications.
 */

import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { monitorError } from '../../utils/monitoring';
import { SocketManager } from '../socket-manager';
import { PrismaClient } from '@prisma/client';
import { NotificationType } from '../../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Registers notification-related event handlers for a socket
 */
export function registerNotificationHandlers(socket: Socket, _socketManager: SocketManager): void {
  const user = socket.data.user;
  
  // Get user notifications
  socket.on('notifications:get', async (callback) => {
    try {
      logger.debug('Socket notifications:get', { userId: user.id });
      
      // Get user's notifications from database
      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit to 50 most recent notifications
      });
      
      // Execute callback with notifications
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: notifications
        });
      }
    } catch (error) {
      monitorError(error as Error, { component: 'NotificationHandlers.get', userId: user.id });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to fetch notifications'
        });
      }
    }
  });
  
  // Mark notification as read
  socket.on('notifications:markAsRead', async (notificationId, callback) => {
    try {
      logger.debug('Socket notifications:markAsRead', { 
        userId: user.id, 
        notificationId 
      });
      
      // Update notification in database
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: user.id // Ensure user owns the notification
        },
        data: {
          isRead: true
        }
      });
      
      // Execute callback with result
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: { id: notificationId, isRead: true }
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'NotificationHandlers.markAsRead', 
        userId: user.id,
        notificationId 
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to mark notification as read'
        });
      }
    }
  });
  
  // Mark all notifications as read
  socket.on('notifications:markAllAsRead', async (callback) => {
    try {
      logger.debug('Socket notifications:markAllAsRead', { userId: user.id });
      
      // Update all user's notifications in database
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      // Execute callback with result
      if (typeof callback === 'function') {
        callback({
          success: true
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'NotificationHandlers.markAllAsRead', 
        userId: user.id 
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to mark all notifications as read'
        });
      }
    }
  });
}

/**
 * Creates a notification and sends it via WebSocket
 */
export async function createNotification(
  socketManager: SocketManager,
  userId: string,
  type: NotificationType,
  message: string,
  relatedId?: string
): Promise<void> {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedId,
        isRead: false
      }
    });
    
    // Send notification via WebSocket if user is online
    if (socketManager.isUserOnline(userId)) {
      socketManager.sendToUser(userId, 'notification:new', notification);
    }
    
    logger.debug('Notification created', { 
      userId, 
      type, 
      relatedId,
      notificationId: notification.id
    });
  } catch (error) {
    monitorError(error as Error, { 
      component: 'createNotification', 
      userId,
      type,
      relatedId
    });
    
    logger.error('Failed to create notification', {
      error,
      userId,
      type,
      message,
      relatedId
    });
  }
}
