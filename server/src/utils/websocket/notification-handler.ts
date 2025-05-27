/**
 * Notification WebSocket Handler
 * 
 * Manages real-time notification events via WebSocket.
 * Handles notification creation, delivery, and status updates.
 */

import { Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket, SocketEvent, SocketRoom, socketManager } from './socket-manager';
import { logger } from '../logger';
import { cacheService, CachePrefix } from '../cache';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL for notifications (in seconds)
const NOTIFICATION_CACHE_TTL = 60 * 60; // 1 hour

/**
 * Notification types for the application
 */
export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SYSTEM_NOTICE = 'SYSTEM_NOTICE'
}

/**
 * Notification data structure
 */
export interface NotificationData {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read?: boolean;
  data?: any;
  createdAt?: Date;
}

/**
 * Notification handler for WebSocket events
 */
export class NotificationHandler {
  /**
   * Set up notification event handlers for a socket
   */
  public setupEvents(socket: AuthenticatedSocket): void {
    if (!socket.user) return;
    
    // Mark notification as read
    socket.on(SocketEvent.NOTIFICATION_READ, async (data: { notificationId: string }) => {
      await this.markNotificationRead(socket, data.notificationId);
    });
    
    // Delete notification
    socket.on(SocketEvent.NOTIFICATION_DELETE, async (data: { notificationId: string }) => {
      await this.deleteNotification(socket, data.notificationId);
    });
    
    logger.debug('Notification event handlers set up', { userId: socket.user.id });
  }
  
  /**
   * Create and send a notification
   */
  public async createNotification(notificationData: NotificationData): Promise<any> {
    try {
      const { userId, type, title, message, data = {} } = notificationData;
      
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: JSON.stringify(data),
          read: false
        }
      });
      
      // Invalidate notifications cache for this user
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}:notifications*`);
      
      // Send real-time notification if user is online
      socketManager.emitToUser(userId, SocketEvent.NOTIFICATION_NEW, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: JSON.parse(notification.data as string),
        read: notification.read,
        createdAt: notification.createdAt
      });
      
      logger.debug('Notification created and sent', { notificationId: notification.id, userId });
      
      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { error, notificationData });
      throw error;
    }
  }
  
  /**
   * Get user notifications with caching
   */
  public async getUserNotifications(userId: string, page = 1, limit = 20): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:notifications:${page}:${limit}`;
      
      // Try to get from cache first
      const cachedNotifications = await cacheService.get<any>(cacheKey);
      if (cachedNotifications) {
        logger.debug('Cache hit for user notifications', { userId });
        return cachedNotifications;
      }
      
      // Cache miss, fetch from database
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where: { userId } })
      ]);
      
      // Parse JSON data field
      const parsedNotifications = notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data as string) : {}
      }));
      
      const result = {
        notifications: parsedNotifications,
        total,
        unread: await prisma.notification.count({ where: { userId, read: false } }),
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result, NOTIFICATION_CACHE_TTL);
      logger.debug('Cached user notifications', { userId, count: notifications.length });
      
      return result;
    } catch (error) {
      logger.error('Failed to get user notifications', { userId, error });
      throw error;
    }
  }
  
  /**
   * Mark a notification as read
   */
  private async markNotificationRead(socket: AuthenticatedSocket, notificationId: string): Promise<void> {
    if (!socket.user) return;
    
    try {
      const userId = socket.user.id;
      
      // Verify ownership
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      
      if (!notification || notification.userId !== userId) {
        socket.emit(SocketEvent.ERROR, { message: 'Notification not found' });
        return;
      }
      
      // Update notification
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      
      // Invalidate cache
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}:notifications*`);
      
      logger.debug('Notification marked as read', { notificationId, userId });
      
      // Confirm to client
      socket.emit(SocketEvent.NOTIFICATION_READ, { notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read', { notificationId, error });
      socket.emit(SocketEvent.ERROR, { message: 'Failed to mark notification as read' });
    }
  }
  
  /**
   * Delete a notification
   */
  private async deleteNotification(socket: AuthenticatedSocket, notificationId: string): Promise<void> {
    if (!socket.user) return;
    
    try {
      const userId = socket.user.id;
      
      // Verify ownership
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      
      if (!notification || notification.userId !== userId) {
        socket.emit(SocketEvent.ERROR, { message: 'Notification not found' });
        return;
      }
      
      // Delete notification
      await prisma.notification.delete({
        where: { id: notificationId }
      });
      
      // Invalidate cache
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}:notifications*`);
      
      logger.debug('Notification deleted', { notificationId, userId });
      
      // Confirm to client
      socket.emit(SocketEvent.NOTIFICATION_DELETE, { notificationId });
    } catch (error) {
      logger.error('Failed to delete notification', { notificationId, error });
      socket.emit(SocketEvent.ERROR, { message: 'Failed to delete notification' });
    }
  }
  
  /**
   * Bulk mark notifications as read
   */
  public async markAllRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      });
      
      // Invalidate cache
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}:notifications*`);
      
      // Notify user if online
      socketManager.emitToUser(userId, SocketEvent.NOTIFICATION_READ, { all: true });
      
      logger.debug('All notifications marked as read', { userId });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { userId, error });
      throw error;
    }
  }
  
  /**
   * Create a task notification
   */
  public async notifyTaskCreated(task: any): Promise<void> {
    // Find relevant users to notify (e.g., users who match the task category)
    const matchingUsers = await prisma.user.findMany({
      where: {
        role: 'TASKER',
        skills: {
          hasSome: [task.categoryId]
        }
      },
      select: { id: true }
    });
    
    // Notify each matching user
    for (const user of matchingUsers) {
      await this.createNotification({
        userId: user.id,
        type: NotificationType.TASK_CREATED,
        title: 'New Task Available',
        message: `A new task "${task.title}" matches your skills!`,
        data: {
          taskId: task.id,
          title: task.title,
          budget: task.budget,
          category: task.categoryId
        }
      });
    }
  }
  
  /**
   * Notify about a bid
   */
  public async notifyBidReceived(bid: any, task: any): Promise<void> {
    await this.createNotification({
      userId: task.ownerId,
      type: NotificationType.BID_RECEIVED,
      title: 'New Bid Received',
      message: `You received a new bid on your task "${task.title}"`,
      data: {
        bidId: bid.id,
        taskId: task.id,
        taskTitle: task.title,
        bidAmount: bid.amount,
        bidderId: bid.bidderId
      }
    });
  }
  
  /**
   * Notify about bid acceptance
   */
  public async notifyBidAccepted(bid: any, task: any): Promise<void> {
    await this.createNotification({
      userId: bid.bidderId,
      type: NotificationType.BID_ACCEPTED,
      title: 'Bid Accepted',
      message: `Your bid on "${task.title}" was accepted!`,
      data: {
        bidId: bid.id,
        taskId: task.id,
        taskTitle: task.title,
        bidAmount: bid.amount
      }
    });
  }
  
  /**
   * Notify about task status change
   */
  public async notifyTaskStatusChanged(task: any, previousStatus: string): Promise<void> {
    // Determine who to notify based on the task status
    const notifyUserId = task.status === 'COMPLETED' ? task.ownerId : task.assigneeId;
    
    if (!notifyUserId) return;
    
    let title = 'Task Status Updated';
    let message = `Task "${task.title}" status changed from ${previousStatus} to ${task.status}`;
    let type = NotificationType.TASK_UPDATED;
    
    // Customize message based on status
    if (task.status === 'COMPLETED') {
      title = 'Task Completed';
      message = `Task "${task.title}" has been marked as completed`;
      type = NotificationType.TASK_COMPLETED;
    } else if (task.status === 'ASSIGNED' && previousStatus === 'OPEN') {
      title = 'Task Assigned';
      message = `Task "${task.title}" has been assigned to you`;
      type = NotificationType.TASK_ASSIGNED;
    }
    
    await this.createNotification({
      userId: notifyUserId,
      type,
      title,
      message,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        previousStatus,
        newStatus: task.status
      }
    });
  }
}

// Export singleton instance
export const notificationHandler = new NotificationHandler();

export default notificationHandler;
