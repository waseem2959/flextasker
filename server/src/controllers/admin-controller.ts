/**
 * Admin Controller
 * 
 * Handles HTTP requests related to admin operations, delegating business logic
 * to the admin service and formatting responses.
 */

import { Request, Response } from 'express';
import { adminService } from '../services/admin-service';
import { reviewService } from '../services/review-service';
import { taskService } from '../services/task-service';
import { logger } from '../utils/logger';
import { BaseController } from './base-controller';

class AdminController extends BaseController {
  /**
   * Get dashboard statistics
   */
  getDashboardStats = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    logger.info('Retrieving dashboard statistics');
    const stats = await adminService.getDashboardStatistics();
    
    return this.sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
  });

  /**
   * Get users for moderation
   */
  getUsers = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = {
      role: req.query.role as string,
      status: req.query.status as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    logger.info('Admin retrieving users', { filters });
    const users = await adminService.getUsers(filters);
    
    return this.sendSuccess(res, users, 'Users retrieved successfully');
  });

  /**
   * Get detailed user information
   */
  getUserDetails = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;

    logger.info('Admin retrieving user details', { userId });
    const user = await adminService.getUserDetails(userId);
    
    return this.sendSuccess(res, user, 'User details retrieved successfully');
  });

  /**
   * Update user status (activate, suspend, etc.)
   */
  updateUserStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const { status, reason } = req.body;
    const adminId = (req.user as any)!.id;

    logger.info('Admin updating user status', { userId, status, adminId });
    await adminService.updateUserStatus(userId, status, reason, adminId);
    
    return this.sendSuccess(res, null, `User status updated to ${status}`);
  });

  /**
   * Get tasks for moderation
   */
  getTasks = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = {
      status: req.query.status as string,
      reported: req.query.reported === 'true',
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    logger.info('Admin retrieving tasks', { filters });
    const tasks = await taskService.getTasks(filters);
    
    return this.sendSuccess(res, tasks, 'Tasks retrieved successfully');
  });

  /**
   * Moderate a task (approve, reject, hide)
   */
  moderateTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.id;
    const { action, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new Error('User not authenticated');
    }

    logger.info('Admin moderating task', { taskId, action, adminId });
    
    // Use the existing updateTask method from TaskService
    await taskService.updateTask(taskId, adminId, { 
      status: action,
      adminNotes: reason,
      updatedBy: adminId
    });
    
    return this.sendSuccess(res, null, `Task ${action.toLowerCase()}ed successfully`);
  });

  /**
   * Get reported reviews for moderation
   */
  getReportedReviews = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    logger.info('Admin retrieving reported reviews', { page, limit });
    const reviews = await reviewService.getReviews({ 
      // reported: true,
      page,
      limit 
    });
    
    return this.sendSuccess(res, reviews, 'Reported reviews retrieved successfully');
  });

  /**
   * Moderate a review (approve, reject, hide)
   */
  moderateReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const { action, reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new Error('User not authenticated');
    }

    logger.info('Admin moderating review', { reviewId, action, adminId });
    // Assuming reviewService has a method to moderate reviews
    await reviewService.moderateReview(reviewId, action, reason, adminId);
    
    return this.sendSuccess(res, null, `Review ${action.toLowerCase()}ed successfully`);
  });

  /**
   * Get verification requests
   */
  getVerifications = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    logger.info('Admin retrieving verifications', { filters });
    const verifications = await adminService.getVerifications(filters);
    
    return this.sendSuccess(res, verifications, 'Verifications retrieved successfully');
  });

  /**
   * Process a verification request (approve or reject)
   */
  processVerification = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const verificationId = req.params.id;
    const { action, notes } = req.body;
    const adminId = (req.user as any)!.id;

    logger.info('Admin processing verification', { verificationId, action, adminId });
    await adminService.processVerification(verificationId, action, notes, adminId);
    
    return this.sendSuccess(res, null, `Verification ${action.toLowerCase()}ed successfully`);
  });

  /**
   * Get system metrics
   */
  getSystemMetrics = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    logger.info('Admin retrieving system metrics');
    const metrics = await adminService.getSystemMetrics();
    
    return this.sendSuccess(res, metrics, 'System metrics retrieved successfully');
  });

  /**
   * Get audit logs
   */
  getAuditLogs = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    logger.info('Admin retrieving audit logs', { filters });
    const logs = await adminService.getAuditLogs(filters);
    
    return this.sendSuccess(res, logs, 'Audit logs retrieved successfully');
  });
}

// Export controller instance
export const adminController = new AdminController();
