import { db } from '@/utils/database';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';
import { sendUserNotification } from '@/websocket/socketHandlers';
import { EmailService } from './email';
import { SMSService } from './sms';

/**
 * Notification service - this is like the communication hub that manages
 * all types of notifications across the platform. It handles email notifications,
 * SMS alerts, push notifications, and in-app notifications.
 * 
 * Think of this as having a sophisticated notification center that can send
 * the right message through the right channel at the right time.
 */

// Define notification channel types for better type safety
type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string;
  bidId?: string;
  reviewId?: string;
  paymentId?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: {
    taskUpdates: boolean;
    bidUpdates: boolean;
    paymentNotifications: boolean;
    reviewNotifications: boolean;
    marketingEmails: boolean;
    systemAlerts: boolean;
  };
}

// Define specific types for notification configurations
interface NotificationConfig {
  title: string;
  defaultChannels: readonly NotificationChannel[];
  priority: NotificationPriority;
}

// Define user data interface for better type safety
interface NotificationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

// Define notification database record interface
interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string | null;
  bidId?: string | null;
  reviewId?: string | null;
  isRead: boolean;
  createdAt: Date;
}

// Define where clause interface for database queries
interface NotificationWhereClause {
  userId: string;
  isRead?: boolean;
  id?: { in: string[] };
}

export class NotificationService {
  // Mark services as readonly since they're never reassigned
  private readonly emailService: EmailService;
  private readonly smsService: SMSService;

  // Notification type configurations with proper typing
  private readonly NOTIFICATION_CONFIGS: Record<string, NotificationConfig> = {
    // Task-related notifications
    TASK_BID_RECEIVED: {
      title: 'New Bid Received',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    TASK_BID_ACCEPTED: {
      title: 'Your Bid Was Accepted',
      defaultChannels: ['EMAIL', 'SMS', 'IN_APP'] as const,
      priority: 'HIGH' as const,
    },
    TASK_COMPLETED: {
      title: 'Task Completed',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    TASK_CANCELLED: {
      title: 'Task Cancelled',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    
    // Payment notifications
    PAYMENT_RECEIVED: {
      title: 'Payment Received',
      defaultChannels: ['EMAIL', 'SMS', 'IN_APP'] as const,
      priority: 'HIGH' as const,
    },
    PAYMENT_SENT: {
      title: 'Payment Sent',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    PAYMENT_FAILED: {
      title: 'Payment Failed',
      defaultChannels: ['EMAIL', 'SMS', 'IN_APP'] as const,
      priority: 'URGENT' as const,
    },
    
    // Review notifications
    REVIEW_RECEIVED: {
      title: 'New Review Received',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    
    // System notifications
    ACCOUNT_SUSPENDED: {
      title: 'Account Suspended',
      defaultChannels: ['EMAIL', 'SMS', 'IN_APP'] as const,
      priority: 'URGENT' as const,
    },
    VERIFICATION_APPROVED: {
      title: 'Verification Approved',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
    VERIFICATION_REJECTED: {
      title: 'Verification Rejected',
      defaultChannels: ['EMAIL', 'IN_APP'] as const,
      priority: 'MEDIUM' as const,
    },
  };

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  /**
   * Send notification through multiple channels
   * 
   * This is the main method that orchestrates sending notifications
   * across different channels based on user preferences and notification type.
   */
  async sendNotification(data: CreateNotificationData): Promise<string> {
    try {
      // Get user information and preferences with proper typing
      const user = await db.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      }) as NotificationUser | null;

      if (!user?.isActive) {
        throw new Error('User not found or inactive');
      }

      // Get notification configuration with safe access
      const config = this.NOTIFICATION_CONFIGS[data.type];
      // Use nullish coalescing instead of logical OR for safer defaults
      const channels = data.channels ?? config?.defaultChannels ?? ['IN_APP'];
      const priority = data.priority ?? config?.priority ?? 'MEDIUM';

      // Create in-app notification record
      const notification = await db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          taskId: data.taskId,
          bidId: data.bidId,
          reviewId: data.reviewId,
        },
      });

      // Send through requested channels
      const sendPromises: Promise<void>[] = [];

      if (channels.includes('EMAIL')) {
        sendPromises.push(this.sendEmailNotification(user, data));
      }

      if (channels.includes('SMS') && user.phone) {
        sendPromises.push(this.sendSMSNotification(user, data));
      }

      if (channels.includes('IN_APP')) {
        // Send real-time notification via WebSocket
        sendUserNotification(data.userId, {
          id: notification.id,
          type: data.type,
          title: data.title,
          message: data.message,
          priority,
          createdAt: notification.createdAt,
        });
      }

      // Execute all notifications concurrently
      await Promise.allSettled(sendPromises);

      logger.info('Notification sent:', {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        channels,
        priority,
      });

      return notification.id;

    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification with proper type safety
   */
  private async sendEmailNotification(
    user: NotificationUser,
    data: CreateNotificationData
  ): Promise<void> {
    try {
      // Map notification types to email methods
      switch (data.type) {
        case 'TASK_BID_RECEIVED':
          if (data.taskId) {
            const task = await db.task.findUnique({
              where: { id: data.taskId },
              select: { title: true },
            });
            await this.emailService.sendTaskNotificationEmail(
              user.email,
              user.firstName,
              task?.title ?? 'Your Task',
              'new_bid'
            );
          }
          break;

        case 'TASK_BID_ACCEPTED':
          if (data.taskId) {
            const task = await db.task.findUnique({
              where: { id: data.taskId },
              select: { title: true },
            });
            await this.emailService.sendTaskNotificationEmail(
              user.email,
              user.firstName,
              task?.title ?? 'Task',
              'bid_accepted'
            );
          }
          break;

        case 'PAYMENT_RECEIVED':
          if (data.taskId) {
            const task = await db.task.findUnique({
              where: { id: data.taskId },
              select: { title: true },
            });
            await this.emailService.sendTaskNotificationEmail(
              user.email,
              user.firstName,
              task?.title ?? 'Task',
              'payment_received'
            );
          }
          break;

        case 'REVIEW_RECEIVED':
          if (data.reviewId) {
            const review = await db.review.findUnique({
              where: { id: data.reviewId },
              include: {
                author: {
                  select: { firstName: true, lastName: true },
                },
                task: {
                  select: { title: true },
                },
              },
            });
            
            if (review) {
              await this.emailService.sendReviewNotificationEmail(
                user.email,
                user.firstName,
                `${review.author.firstName} ${review.author.lastName}`,
                review.task.title,
                review.rating
              );
            }
          }
          break;

        default:
          // Generic notification email
          logger.info('Sending generic email notification:', { type: data.type });
          break;
      }

    } catch (error) {
      logger.error('Failed to send email notification:', error);
      // Don't throw - notification should not fail if one channel fails
    }
  }

  /**
   * Send SMS notification with proper type safety
   */
  private async sendSMSNotification(
    user: NotificationUser,
    data: CreateNotificationData
  ): Promise<void> {
    try {
      // Map notification types to SMS methods
      switch (data.type) {
        case 'TASK_BID_ACCEPTED':
          if (data.taskId) {
            const task = await db.task.findUnique({
              where: { id: data.taskId },
              select: { title: true },
            });
            await this.smsService.sendTaskNotificationSMS(
              user.phone!,
              user.firstName,
              'bid_accepted',
              task?.title
            );
          }
          break;

        case 'PAYMENT_RECEIVED':
          if (data.taskId) {
            const task = await db.task.findUnique({
              where: { id: data.taskId },
              select: { title: true },
            });
            await this.smsService.sendTaskNotificationSMS(
              user.phone!,
              user.firstName,
              'payment_received',
              task?.title
            );
          }
          break;

        case 'ACCOUNT_SUSPENDED':
          await this.smsService.sendSecurityAlertSMS(
            user.phone!,
            user.firstName,
            'suspicious_activity'
          );
          break;

        default:
          logger.info('SMS notification type not implemented:', { type: data.type });
          break;
      }

    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      // Don't throw - notification should not fail if one channel fails
    }
  }

  /**
   * Get user notifications with pagination and proper typing
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: NotificationRecord[]; pagination: PaginationInfo }> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: NotificationWhereClause = { userId };
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const totalNotifications = await db.notification.count({
        where: whereClause,
      });

      const notifications = await db.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }) as NotificationRecord[];

      const pagination = createPagination(page, limit, totalNotifications);

      return {
        notifications,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read with proper type safety
   */
  async markNotificationsAsRead(
    userId: string,
    notificationIds?: string[]
  ): Promise<void> {
    try {
      const whereClause: NotificationWhereClause = { 
        userId,
        isRead: false,
      };
      
      if (notificationIds?.length) {
        whereClause.id = { in: notificationIds };
      }

      await db.notification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });

      logger.info('Notifications marked as read:', {
        userId,
        notificationIds: notificationIds ?? 'all',
      });

    } catch (error) {
      logger.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await db.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Bulk send notifications (for announcements) with proper type safety
   */
  async sendBulkNotification(
    userIds: string[],
    notificationData: Omit<CreateNotificationData, 'userId'>
  ): Promise<string[]> {
    try {
      const notificationIds: string[] = [];

      // Send notifications in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(userId =>
          this.sendNotification({ ...notificationData, userId })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            notificationIds.push(result.value);
          } else {
            logger.warn('Failed to send notification to user:', {
              userId: batch[index],
              error: result.reason,
            });
          }
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('Bulk notifications sent:', {
        totalUsers: userIds.length,
        successfulNotifications: notificationIds.length,
        type: notificationData.type,
      });

      return notificationIds;

    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (run periodically)
   */
  async cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      logger.info('Old notifications cleaned up:', {
        deletedCount: result.count,
        olderThanDays,
      });

      return result.count;

    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }
}

// Helper functions for common notification scenarios with proper typing
export async function notifyNewBid(taskId: string, bidderId: string): Promise<void> {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { ownerId: true, title: true },
    });

    if (task) {
      const notificationService = new NotificationService();
      await notificationService.sendNotification({
        userId: task.ownerId,
        type: 'TASK_BID_RECEIVED',
        title: 'New Bid Received',
        message: `You received a new bid on your task "${task.title}"`,
        taskId,
        bidId: bidderId,
      });
    }
  } catch (error) {
    logger.error('Failed to notify new bid:', error);
  }
}

export async function notifyBidAccepted(bidId: string): Promise<void> {
  try {
    const bid = await db.bid.findUnique({
      where: { id: bidId },
      include: {
        task: { select: { title: true } },
      },
    });

    if (bid) {
      const notificationService = new NotificationService();
      await notificationService.sendNotification({
        userId: bid.bidderId,
        type: 'TASK_BID_ACCEPTED',
        title: 'Your Bid Was Accepted!',
        message: `Your bid for "${bid.task.title}" has been accepted. You can start working on the task.`,
        taskId: bid.taskId,
        bidId: bid.id,
      });
    }
  } catch (error) {
    logger.error('Failed to notify bid accepted:', error);
  }
}

export async function notifyPaymentReceived(paymentId: string): Promise<void> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        task: {
          select: { title: true, assigneeId: true },
        },
      },
    });

    // Use optional chaining for safer access
    if (payment?.task.assigneeId) {
      const notificationService = new NotificationService();
      await notificationService.sendNotification({
        userId: payment.task.assigneeId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `You received payment for "${payment.task.title}"`,
        taskId: payment.taskId,
        paymentId: payment.id,
      });
    }
  } catch (error) {
    logger.error('Failed to notify payment received:', error);
  }
}