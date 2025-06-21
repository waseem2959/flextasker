/**
 * Notification Routes
 * 
 * These routes handle all notification-related operations including:
 * - Retrieving user notifications
 * - Marking notifications as read
 * - Managing notification preferences
 * - Notification subscriptions
 */

import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth-middleware';
import { notificationController } from '../controllers/notification-controller';

const router = Router();

/**
 * Get User Notifications
 * GET /api/v1/notifications
 */
router.get('/',
  authenticateToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    
    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('unreadOnly must be a boolean')
  ],
  notificationController.getUserNotifications
);

/**
 * Mark Notification as Read
 * PATCH /api/v1/notifications/:id/read
 */
router.patch('/:id/read',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],
  notificationController.markAsRead
);

/**
 * Mark All Notifications as Read
 * PATCH /api/v1/notifications/read-all
 */
router.patch('/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

/**
 * Update Notification Preferences
 * PUT /api/v1/notifications/preferences
 */
router.put('/preferences',
  authenticateToken,
  [
    body('email').optional().isBoolean().withMessage('Email must be a boolean'),
    body('push').optional().isBoolean().withMessage('Push must be a boolean'),
    body('inApp').optional().isBoolean().withMessage('InApp must be a boolean'),
    body('types').optional().isObject().withMessage('Types must be an object')
  ],
  notificationController.updatePreferences
);

/**
 * Get Notification Count
 * GET /api/v1/notifications/count
 */
router.get('/count',
  authenticateToken,
  notificationController.getUnreadCount
);

/**
 * Delete Notification
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],
  notificationController.deleteNotification
);

export default router;
