/**
 * Notification Service
 * 
 * This service handles all notification-related operations including:
 * - Creating and sending notifications
 * - Retrieving user notifications
 * - Managing notification read status
 * - Handling notification preferences
 */

import { db } from '../utils/database';
import { NotFoundError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { EmailService } from './email-service';
import { PushNotificationService } from './push-notification-service';

// Define notification types for better type safety
export type NotificationType = 
  | 'TASK_CREATED'
  | 'BID_RECEIVED'
  | 'BID_ACCEPTED'
  | 'BID_REJECTED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM_ALERT';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  message: string;
  metadata?: Record<string, any>;
  isRead?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    [key in NotificationType]?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  types?: NotificationType[];
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedNotifications {
  notifications: any[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

/**
 * Notification Service Class
 * 
 * Handles creating, retrieving, and managing user notifications across
 * multiple delivery channels (in-app, email, push).
 */
export class NotificationService {
  private readonly emailService: EmailService;
  private readonly pushService: PushNotificationService;

  constructor() {
    this.emailService = new EmailService();
    this.pushService = new PushNotificationService();
  }

  /**
   * Create a notification
   */
  async createNotification(data: NotificationData): Promise<any> {
    logger.info('Creating notification', { userId: data.userId, type: data.type });

    try {
      // Create notification in database
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          message: data.message,
          metadata: data.metadata || {},
          isRead: data.isRead || false,
          createdAt: new Date()
        }
      });

      // Attempt to deliver notification through preferred channels
      this.deliverNotification(notification).catch(error => {
        // Log error but don't fail the notification creation
        logger.error('Error delivering notification', { error, notificationId: notification.id });
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification', { error, userId: data.userId });
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<any> {
    logger.info('Getting notification by ID', { notificationId });

    try {
      const notification = await db.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Error getting notification', { error, notificationId });
      throw error;
    }
  }

  /**
   * Get notifications for user with pagination and filtering
   */
  async getNotificationsForUser(userId: string, options: NotificationQueryOptions = {}): Promise<PaginatedNotifications> {
    logger.info('Getting notifications for user', { userId, options });

    try {
      const page = options.page ?? 1;
      const limit = options.limit ?? 20;
      const skip = (page - 1) * limit;

      // Build query filters
      const where: any = { userId };

      if (options.unreadOnly) {
        where.isRead = false;
      }

      if (options.types && options.types.length > 0) {
        where.type = { in: options.types };
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      // Get total count for pagination
      const totalCount = await db.notification.count({ where });

      // Get notifications with pagination
      const notifications = await db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      // Get unread count
      const unreadCount = await db.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications,
        totalCount,
        page,
        limit,
        totalPages,
        unreadCount
      };
    } catch (error) {
      logger.error('Error getting notifications for user', { error, userId });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    logger.info('Marking notification as read', { notificationId, userId });

    try {
      // Find notification and verify ownership
      const notification = await db.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new NotFoundError('Notification not found or does not belong to user');
      }

      // Update notification
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    } catch (error) {
      logger.error('Error marking notification as read', { error, notificationId, userId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    logger.info('Marking all notifications as read', { userId });

    try {
      // Update all unread notifications for the user
      const result = await db.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      return result.count;
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    logger.info('Deleting notification', { notificationId, userId });

    try {
      // Find notification and verify ownership
      const notification = await db.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });

      if (!notification) {
        throw new NotFoundError('Notification not found or does not belong to user');
      }

      // Delete notification
      await db.notification.delete({
        where: { id: notificationId }
      });
    } catch (error) {
      logger.error('Error deleting notification', { error, notificationId, userId });
      throw error;
    }
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(userId: string, type: NotificationType, message: string, metadata?: Record<string, any>): Promise<any> {
    logger.info('Sending notification', { userId, type });

    try {
      // Create notification data
      const notificationData: NotificationData = {
        userId,
        type,
        message,
        metadata,
        isRead: false
      };

      // Create notification and wait for it to complete
      return await this.createNotification(notificationData);
    } catch (error) {
      logger.error('Error sending notification', { error, userId, type });
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    logger.info('Getting user notification preferences', { userId });

    try {
      // Get user preferences from database
      const preferences = await db.notificationPreference.findUnique({
        where: { userId }
      });

      // If no preferences exist, create default preferences
      if (!preferences) {
        return this.createDefaultNotificationPreferences(userId);
      }

      return preferences;
    } catch (error) {
      logger.error('Error getting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    logger.info('Updating notification preferences', { userId });

    try {
      // Get current preferences
      const currentPreferences = await this.getUserNotificationPreferences(userId);

      // Update preferences
      const updatedPreferences = await db.notificationPreference.update({
        where: { userId },
        data: {
          email: preferences.email ?? currentPreferences.email,
          push: preferences.push ?? currentPreferences.push,
          sms: preferences.sms ?? currentPreferences.sms,
          types: preferences.types ?? currentPreferences.types
        }
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Error updating notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Create default notification preferences for a user
   */
  private async createDefaultNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    logger.info('Creating default notification preferences', { userId });

    try {
      // Define default preferences
      const defaultPreferences: NotificationPreferences = {
        userId,
        email: true,
        push: true,
        sms: false,
        types: {
          TASK_CREATED: { email: true, push: true, sms: false },
          BID_RECEIVED: { email: true, push: true, sms: false },
          BID_ACCEPTED: { email: true, push: true, sms: false },
          BID_REJECTED: { email: true, push: true, sms: false },
          TASK_STARTED: { email: true, push: true, sms: false },
          TASK_COMPLETED: { email: true, push: true, sms: false },
          PAYMENT_RECEIVED: { email: true, push: true, sms: false },
          PAYMENT_SENT: { email: true, push: true, sms: false },
          REVIEW_RECEIVED: { email: true, push: true, sms: false },
          MESSAGE_RECEIVED: { email: false, push: true, sms: false },
          SYSTEM_ALERT: { email: true, push: true, sms: false }
        }
      };

      // Create preferences in database
      return await db.notificationPreference.create({
        data: defaultPreferences
      });
    } catch (error) {
      logger.error('Error creating default notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Deliver notification through appropriate channels based on user preferences
   */
  private async deliverNotification(notification: any): Promise<void> {
    const userId = notification.userId;
    const type = notification.type as NotificationType;

    try {
      // Get user preferences
      const preferences = await this.getUserNotificationPreferences(userId);

      // Get user information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          deviceTokens: true
        }
      });

      if (!user) {
        logger.warn('User not found for notification delivery', { userId });
        return;
      }

      // Check type-specific preferences
      const typePreferences = preferences.types[type];

      // Deliver via email if enabled
      if (preferences.email && typePreferences?.email && user.email) {
        this.deliverEmailNotification(user.email, user.firstName, notification).catch(error => {
          logger.error('Error delivering email notification', { error, userId, notificationId: notification.id });
        });
      }

      // Deliver via push if enabled
      if (preferences.push && typePreferences?.push && user.deviceTokens?.length > 0) {
        this.deliverPushNotification(user.deviceTokens, notification).catch(error => {
          logger.error('Error delivering push notification', { error, userId, notificationId: notification.id });
        });
      }

      // SMS delivery would be implemented here
    } catch (error) {
      logger.error('Error in notification delivery', { error, userId, notificationId: notification.id });
    }
  }

  /**
   * Deliver notification via email
   */
  private async deliverEmailNotification(email: string, firstName: string, notification: any): Promise<void> {
    // Prepare template data
    const templateData = {
      firstName,
      taskTitle: notification.metadata?.taskTitle ?? 'Task',
      notificationType: notification.type,
      amount: notification.metadata?.amount,
      reviewerName: notification.metadata?.reviewerName,
      rating: notification.metadata?.rating,
      senderName: notification.metadata?.senderName
    };

    // Send email notification
    await this.emailService.sendTaskNotificationEmail(
      email,
      firstName,
      templateData.taskTitle,
      notification.type
    );
  }

  /**
   * Deliver notification via push notification
   */
  private async deliverPushNotification(deviceTokens: string[], notification: any): Promise<void> {
    if (!deviceTokens.length) return;
    
    // Send push notifications to all device tokens
    await this.pushService.sendPushNotifications(
      deviceTokens,
      notification.message,
      {
        notificationId: notification.id,
        type: notification.type,
        ...notification.metadata
      }
    );
  }

  /**
   * Clean up old notifications
   * 
   * This should be run periodically to remove old notifications and keep the database size manageable.
   */
  async cleanupOldNotifications(daysToKeep: number = 90): Promise<number> {
    logger.info('Cleaning up old notifications', { daysToKeep });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete notifications older than the cutoff date
      const result = await db.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Old notifications cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old notifications', { error, daysToKeep });
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
