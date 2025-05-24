import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { NotificationService } from '@/services/notification';
import { validate } from '@/middleware/validation';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { sendSuccess } from '@/utils/response';

const router = Router();
const notificationService = new NotificationService();

/**
 * Get User Notifications
 * GET /api/v1/notifications
 */
router.get('/',
  authenticateToken,
  validate([
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
      .withMessage('unreadOnly must be a boolean'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationService.getUserNotifications(
        req.user!.id,
        page,
        limit,
        unreadOnly
      );
      
      sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Mark Notifications as Read
 * POST /api/v1/notifications/mark-read
 */
router.post('/mark-read',
  authenticateToken,
  validate([
    body('notificationIds')
      .optional()
      .isArray()
      .withMessage('Notification IDs must be an array'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationService.markNotificationsAsRead(
        req.user!.id,
        req.body.notificationIds
      );
      
      sendSuccess(res, null, 'Notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Unread Count
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      
      sendSuccess(res, { count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Send Bulk Notification (Admin Only)
 * POST /api/v1/notifications/bulk
 */
router.post('/bulk',
  authenticateToken,
  requireRole(['ADMIN']),
  validate([
    body('userIds')
      .isArray()
      .withMessage('User IDs must be an array'),
    
    body('type')
      .notEmpty()
      .withMessage('Notification type is required'),
    
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    
    body('message')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationIds = await notificationService.sendBulkNotification(
        req.body.userIds,
        {
          type: req.body.type,
          title: req.body.title,
          message: req.body.message,
          priority: req.body.priority,
          channels: req.body.channels,
        }
      );
      
      sendSuccess(res, { notificationIds }, 'Bulk notifications sent successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;