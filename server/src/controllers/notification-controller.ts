/**
 * Notification Controller
 * 
 * Handles HTTP requests related to notifications, delegating business logic
 * to the notification service and formatting responses.
 */

import { Request, Response } from 'express';
import { NotificationService } from '../services/notification-service';
import { logger } from '../utils/logger';
import { BaseController } from './base-controller';

const notificationService = new NotificationService();

class NotificationController extends BaseController {
  /**
   * Get user notifications with pagination and filtering
   */
  getUserNotifications = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    logger.info('Retrieving notifications', { userId, page, limit, unreadOnly });
    const result = await notificationService.getNotificationsForUser(userId, {
      page,
      limit,
      unreadOnly
    });
    
    return this.sendSuccess(res, result, 'Notifications retrieved successfully');
  });

  /**
   * Mark a notification as read
   */
  markAsRead = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const notificationId = req.params.id;
    const userId = req.user!.id;

    logger.info('Marking notification as read', { notificationId, userId });
    await notificationService.markAsRead(notificationId, userId);
    
    return this.sendSuccess(res, null, 'Notification marked as read');
  });

  /**
   * Mark all notifications as read for the current user
   */
  markAllAsRead = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    logger.info('Marking all notifications as read', { userId });
    await notificationService.markAllAsRead(userId);
    
    return this.sendSuccess(res, null, 'All notifications marked as read');
  });

  /**
   * Update notification preferences
   */
  updatePreferences = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const preferences = req.body;

    logger.info('Updating notification preferences', { userId, preferences });
    const updatedPreferences = await notificationService.updateNotificationPreferences(userId, preferences);
    
    return this.sendSuccess(res, updatedPreferences, 'Notification preferences updated');
  });

  /**
   * Get unread notification count
   */
  getUnreadCount = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    logger.info('Getting unread notification count', { userId });
    // Get notifications with unreadOnly flag to get the unread count
    const result = await notificationService.getNotificationsForUser(userId, {
      page: 1,
      limit: 1, // We only need the metadata
      unreadOnly: true
    });
    
    return this.sendSuccess(res, { count: result.unreadCount }, 'Unread notification count retrieved');
  });

  /**
   * Delete a notification
   */
  deleteNotification = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const notificationId = req.params.id;
    const userId = req.user!.id;

    logger.info('Deleting notification', { notificationId, userId });
    await notificationService.deleteNotification(notificationId, userId);
    
    return this.sendSuccess(res, null, 'Notification deleted successfully');
  });
}

// Export controller instance
export const notificationController = new NotificationController();
