/**
 * Admin Routes
 * 
 * These routes handle all admin-related operations including:
 * - Dashboard statistics and monitoring
 * - User management and moderation
 * - Content moderation
 * - System configuration
 * - Verification processing
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken, requireRoles } from '../middleware/auth-middleware';
import { auditLog } from '../middleware/audit-log-middleware';
import { adminController } from '../controllers/admin-controller';
import { UserRole } from '../../../shared/types/common/enums';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(requireRoles([UserRole.ADMIN]));

/**
 * Get Dashboard Statistics
 * GET /api/v1/admin/dashboard
 */
router.get('/dashboard',
  auditLog('VIEW_DASHBOARD', 'ADMIN'),
  adminController.getDashboardStats
);

/**
 * Get Users for Moderation
 * GET /api/v1/admin/users
 */
router.get('/users',
  
    query('role')
      .optional()
      .isIn(['USER', 'TASKER', 'ADMIN'])
      .withMessage('Invalid role'),
    
    query('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('search')
      .optional()
      .isString()
      .trim()
  adminController.getUsers
);

/**
 * Get User Details
 * GET /api/v1/admin/users/:id
 */
router.get('/users/:id',
  
    param('id').isUUID().withMessage('Invalid user ID format')
  adminController.getUserDetails
);

/**
 * Update User Status
 * PATCH /api/v1/admin/users/:id/status
 */
router.patch('/users/:id/status',
  
    param('id').isUUID().withMessage('Invalid user ID format'),
    body('status')
      .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  auditLog('UPDATE_USER_STATUS', 'ADMIN'),
  adminController.updateUserStatus
);

/**
 * Get Tasks for Moderation
 * GET /api/v1/admin/tasks
 */
router.get('/tasks',
  
    query('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'])
      .withMessage('Invalid status'),
    
    query('reported')
      .optional()
      .isBoolean()
      .withMessage('Reported must be a boolean'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('search')
      .optional()
      .isString()
      .trim()
  adminController.getTasks
);

/**
 * Moderate Task
 * PATCH /api/v1/admin/tasks/:id/moderate
 */
router.patch('/tasks/:id/moderate',
  
    param('id').isUUID().withMessage('Invalid task ID format'),
    body('action')
      .isIn(['APPROVE', 'REJECT', 'HIDE'])
      .withMessage('Invalid action'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  auditLog('MODERATE_TASK', 'ADMIN'),
  adminController.moderateTask
);

/**
 * Get Reported Reviews
 * GET /api/v1/admin/reviews/reported
 */
router.get('/reviews/reported',
  
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  adminController.getReportedReviews
);

/**
 * Moderate Review
 * PATCH /api/v1/admin/reviews/:id/moderate
 */
router.patch('/reviews/:id/moderate',
  
    param('id').isUUID().withMessage('Invalid review ID format'),
    body('action')
      .isIn(['APPROVE', 'REJECT', 'HIDE'])
      .withMessage('Invalid action'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  auditLog('MODERATE_REVIEW', 'ADMIN'),
  adminController.moderateReview
);

/**
 * Get Pending Verifications
 * GET /api/v1/admin/verifications
 */
router.get('/verifications',
  
    query('type')
      .optional()
      .isIn(['IDENTITY', 'ADDRESS', 'BUSINESS'])
      .withMessage('Invalid verification type'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  adminController.getVerifications
);

/**
 * Process Verification (Approve/Reject)
 * POST /api/v1/admin/verifications/:id/process
 */
router.post('/verifications/:id/process',
  
    param('id').isUUID().withMessage('Invalid verification ID format'),
    body('action')
      .isIn(['APPROVE', 'REJECT'])
      .withMessage('Action must be either APPROVE or REJECT'),
    
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  auditLog('PROCESS_VERIFICATION', 'ADMIN'),
  adminController.processVerification
);

/**
 * Get System Metrics
 * GET /api/v1/admin/metrics
 */
router.get('/metrics',
  adminController.getSystemMetrics
);

/**
 * Get Audit Logs
 * GET /api/v1/admin/audit-logs
 */
router.get('/audit-logs',
  
    query('userId')
      .optional()
      .isUUID()
      .withMessage('Invalid user ID format'),
    
    query('action')
      .optional()
      .isString()
      .trim(),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  adminController.getAuditLogs
);

export default router;
