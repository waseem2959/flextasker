/**
 * Notification Service
 * 
 * This service handles all notification-related operations including:
 * - Creating and sending notifications
 * - Retrieving user notifications
 * - Managing notification read status
 * - Handling notification preferences
 */

import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
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
      // DatabaseQueryBuilder is now imported at the top

      // Create notification in database
      const notification = await DatabaseQueryBuilder.create(
        models.notification,
        {
          userId: data.userId,
          type: data.type,
          message: data.message,
          data: data.metadata || {},
          isRead: data.isRead || false
        },
        'Notification',
        {
          id: true,
          userId: true,
          type: true,
          message: true,
          data: true,
          isRead: true,
          createdAt: true
        }
      );

      // Attempt to deliver notification through preferred channels
      this.deliverNotification(notification).catch(error => {
        // Log error but don't fail the notification creation
        logger.error('Error delivering notification', { error, notificationId: (notification as any)?.id });
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

    // DatabaseQueryBuilder is now imported at the top

    return DatabaseQueryBuilder.findById(
      models.notification,
      notificationId,
      'Notification',
      {
        id: true,
        userId: true,
        type: true,
        message: true,
        data: true,
        isRead: true,
        createdAt: true
      }
    );
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

      // DatabaseQueryBuilder is now imported at the top

      // Get notifications with pagination using consolidated method
      const { items: notifications, total: totalCount } = await DatabaseQueryBuilder.findMany(
        models.notification,
        {
          where,
          select: {
            id: true,
            userId: true,
            type: true,
            message: true,
            data: true,
            isRead: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip, limit }
        },
        'Notification'
      );

      // Get unread count
      const unreadCount = await DatabaseQueryBuilder.count(
        models.notification,
        'Notification',
        {
          userId,
          isRead: false
        }
      );

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
      // DatabaseQueryBuilder is now imported at the top

      // Find notification and verify ownership
      await DatabaseQueryBuilder.findById(
        models.notification,
        notificationId,
        'Notification',
        { id: true, userId: true, isRead: true }
      );

      // Update notification
      await DatabaseQueryBuilder.update(
        models.notification,
        notificationId,
        { isRead: true },
        'Notification',
        { id: true, isRead: true }
      );
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
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Update all unread notifications for the user
      const result = await DatabaseQueryBuilder.updateMany(
        models.notification,
        {
          userId,
          isRead: false
        },
        { isRead: true },
        'Notification'
      );

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
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Find notification and verify ownership
      await DatabaseQueryBuilder.findById(
        models.notification,
        notificationId,
        'Notification',
        { id: true, userId: true }
      );

      // Delete notification
      await DatabaseQueryBuilder.delete(
        models.notification,
        notificationId,
        'Notification'
      );
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
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Get user preferences from database
      const preferences = await DatabaseQueryBuilder.findUnique(
        models.notificationPreference,
        { userId },
        'NotificationPreference',
        {
          id: true,
          userId: true,
          email: true,
          push: true,
          sms: true,
          types: true
        }
      );

      // If no preferences exist, create default preferences
      if (!preferences) {
        return this.createDefaultNotificationPreferences(userId);
      }

      // Convert the JSON types to the expected format
      const typedPreferences: NotificationPreferences = {
        userId: (preferences as any).userId,
        email: (preferences as any).email,
        push: (preferences as any).push,
        sms: (preferences as any).sms,
        types: (preferences as any).types as NotificationPreferences['types'] ?? this.getDefaultNotificationTypes()
      };

      return typedPreferences;
    } catch (error) {
      logger.error('Error getting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    logger.info('Updating notification preferences', { userId });

    try {
      // Get current preferences
      const currentPreferences = await this.getUserNotificationPreferences(userId);

      // Merge the existing types with any new types
      const updatedTypes = preferences.types
        ? { ...currentPreferences.types, ...preferences.types }
        : currentPreferences.types;

      // Update preferences in the database
      const dbPreferences = await DatabaseQueryBuilder.update(
        models.notificationPreference,
        userId,
        {
          email: preferences.email ?? currentPreferences.email,
          push: preferences.push ?? currentPreferences.push,
          sms: preferences.sms ?? currentPreferences.sms,
          types: updatedTypes as any // Prisma will handle the JSON serialization
        },
        'NotificationPreference'
      );

      // Convert and return the typed preferences
      return {
        userId: (dbPreferences as any).userId,
        email: (dbPreferences as any).email,
        push: (dbPreferences as any).push,
        sms: (dbPreferences as any).sms,
        types: (dbPreferences as any).types as NotificationPreferences['types']
      };
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
      const defaultPreferences = {
        userId,
        email: true,
        push: true,
        sms: false,
        types: this.getDefaultNotificationTypes()
      };

      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Create preferences in database
      const dbPreferences = await DatabaseQueryBuilder.create(
        models.notificationPreference,
        {
          ...defaultPreferences,
          types: defaultPreferences.types as any // Prisma will handle the JSON serialization
        },
        'NotificationPreference',
        {
          id: true,
          userId: true,
          email: true,
          push: true,
          sms: true,
          types: true,
          createdAt: true
        }
      );

      // Convert and return the typed preferences
      return {
        userId: (dbPreferences as any).userId,
        email: (dbPreferences as any).email,
        push: (dbPreferences as any).push,
        sms: (dbPreferences as any).sms,
        types: (dbPreferences as any).types as NotificationPreferences['types']
      };
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

      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Get user information
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        {
          id: true,
          email: true,
          firstName: true,
          deviceTokens: true
        }
      );

      if (!user) {
        logger.warn('User not found for notification delivery', { userId });
        return;
      }

      // Check type-specific preferences
      const typePreferences = preferences.types[type];

      // Deliver via email if enabled
      if ((preferences as any).email && typePreferences?.email && (user as any).email) {
        this.deliverEmailNotification((user as any).email, (user as any).firstName, notification).catch(error => {
          logger.error('Error delivering email notification', { error, userId, notificationId: notification.id });
        });
      }

      // Deliver via push if enabled
      if ((preferences as any).push && typePreferences?.push && (user as any).deviceTokens?.length > 0) {
        this.deliverPushNotification((user as any).deviceTokens, notification).catch(error => {
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
      const result = await DatabaseQueryBuilder.deleteMany(
        models.notification,
        {
          createdAt: {
            lt: cutoffDate
          }
        },
        'Notification'
      );

      logger.info('Old notifications cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old notifications', { error, daysToKeep });
      throw error;
    }
  }

  /**
   * Get default notification types
   */
  private getDefaultNotificationTypes(): NotificationPreferences['types'] {
    return {
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
    };
  }
}


