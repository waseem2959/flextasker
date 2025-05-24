import { auditLog } from '@/middleware/auditLog';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { AdminService } from '@/services/admin';
import { sendSuccess } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';

/**
 * Admin routes - these are like different management offices where
 * administrators can oversee platform operations, moderate users,
 * review verifications, and monitor system health.
 */

const router = Router();
const adminService = new AdminService();

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

/**
 * Get Dashboard Statistics
 * GET /api/v1/admin/dashboard
 * 
 * This is like viewing the main control panel - provides comprehensive
 * statistics about platform health and activity.
 */
router.get('/dashboard',
  auditLog('VIEW_DASHBOARD', 'ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getDashboardStatistics();
      
      sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Users for Moderation
 * GET /api/v1/admin/users
 * 
 * This is like viewing a user management interface - shows users
 * with detailed information for moderation purposes.
 */
router.get('/users',
  validate([
    query('role')
      .optional()
      .isIn(['USER', 'TASKER', 'ADMIN'])
      .withMessage('Invalid role'),
    
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    
    query('emailVerified')
      .optional()
      .isBoolean()
      .withMessage('emailVerified must be a boolean'),
    
    query('flaggedOnly')
      .optional()
      .isBoolean()
      .withMessage('flaggedOnly must be a boolean'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        role: req.query.role as string,
        isActive: req.query.isActive === 'true',
        emailVerified: req.query.emailVerified === 'true',
        flaggedOnly: req.query.flaggedOnly === 'true',
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await adminService.getUsersForModeration(filters, page, limit);
      
      sendSuccess(res, result, 'Users for moderation retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Moderate User (Suspend/Reactivate)
 * POST /api/v1/admin/users/:id/moderate
 * 
 * This is like taking disciplinary action - administrators can
 * suspend or reactivate user accounts with proper documentation.
 */
router.post('/users/:id/moderate',
  validate([
    param('id')
      .notEmpty()
      .withMessage('User ID is required'),
    
    body('action')
      .isIn(['SUSPEND', 'REACTIVATE'])
      .withMessage('Action must be SUSPEND or REACTIVATE'),
    
    body('reason')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters'),
  ]),
  auditLog('MODERATE_USER', 'USER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.moderateUser(
        req.user!.id,
        req.params.id,
        req.body.action,
        req.body.reason
      );
      
      sendSuccess(res, null, `User ${req.body.action.toLowerCase()}ed successfully`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Pending Verifications
 * GET /api/v1/admin/verifications/pending
 * 
 * This is like reviewing approval requests - shows all pending
 * identity verifications that need admin review.
 */
router.get('/verifications/pending',
  validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getPendingVerifications(page, limit);
      
      sendSuccess(res, result, 'Pending verifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Process Verification (Approve/Reject)
 * POST /api/v1/admin/verifications/:id/process
 * 
 * This is like making approval decisions - administrators can
 * approve or reject identity verification requests.
 */
router.post('/verifications/:id/process',
  validate([
    param('id')
      .notEmpty()
      .withMessage('Verification ID is required'),
    
    body('action')
      .isIn(['APPROVE', 'REJECT'])
      .withMessage('Action must be APPROVE or REJECT'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
  ]),
  auditLog('PROCESS_VERIFICATION', 'VERIFICATION'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.processVerification(
        req.user!.id,
        req.params.id,
        req.body.action,
        req.body.notes
      );
      
      sendSuccess(res, null, `Verification ${req.body.action.toLowerCase()}ed successfully`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get System Analytics
 * GET /api/v1/admin/analytics
 * 
 * This is like viewing business intelligence reports - provides
 * detailed analytics about platform performance and trends.
 */
router.get('/analytics',
  validate([
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ]),
  auditLog('VIEW_ANALYTICS', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const analytics = await adminService.getSystemAnalytics(startDate, endDate);
      
      sendSuccess(res, analytics, 'System analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Dispute Cases
 * GET /api/v1/admin/disputes
 * 
 * This is like viewing a case management system - shows all disputes
 * that need admin attention and resolution.
 */
router.get('/disputes',
  validate([
    query('status')
      .optional()
      .isIn(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'])
      .withMessage('Invalid status'),
    
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getDisputeCases(status, priority, page, limit);
      
      sendSuccess(res, result, 'Dispute cases retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get System Health Report
 * GET /api/v1/admin/health
 * 
 * This is like checking system vitals - provides a comprehensive
 * health report about platform performance and any issues.
 */
router.get('/health',
  auditLog('VIEW_HEALTH_REPORT', 'ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const healthReport = await adminService.generateHealthReport();
      
      sendSuccess(res, healthReport, 'System health report generated successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;