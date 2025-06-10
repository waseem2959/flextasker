/**
 * Admin Service
 * 
 * This service handles all administrative operations including:
 * - User moderation and management
 * - Platform statistics and analytics
 * - Verification processing
 * - Dispute resolution
 * - System health monitoring
 */

import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { createPagination, PaginationInfo } from '../utils/response-utils';

// Define proper interfaces for type safety
interface PaymentStatusCount {
  status: string;
  _count: { id: number };
}



interface TopCategoryData {
  categoryId: string;
  _count: { id: number };
}

// interface CategoryInfo {
//   id: string;
//   name: string;
// }

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    verified: number;
    newToday: number;
    byRole: Record<string, number>;
  };
  tasks: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    disputed: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  payments: {
    totalVolume: number;
    todayVolume: number;
    successRate: number;
    byStatus: Record<string, number>;
  };
  platform: {
    activeUsers24h: number;
    taskSuccessRate: number;
    averageRating: number;
    topCategories: Array<{ name: string; count: number }>;
  };
}

export interface UserModeration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  trustScore: number;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  lastActive: Date;
  stats: {
    tasksPosted: number;
    tasksCompleted: number;
    totalEarnings: number;
    totalSpent: number;
    reviewsReceived: number;
    averageRating: number;
  };
  flags: {
    hasDisputes: boolean;
    lowRating: boolean;
    inactiveAccount: boolean;
    unverifiedEmail: boolean;
  };
}

export interface DisputeCase {
  id: string;
  taskId: string;
  taskTitle: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reportedUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reason: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  resolvedAt?: Date;
  assignedAdmin?: string;
}

/**
 * Admin Service Class
 * 
 * Provides administrative functionality for platform management including
 * user moderation, verification processing, and system analytics.
 */
export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   * 
   * This provides a high-level overview of platform health and activity.
   */
  async getDashboardStatistics(): Promise<AdminDashboardStats> {
    logger.info('Generating admin dashboard statistics');
    
    try {
      // In a real implementation, these would be actual database queries
      // For now, we'll return mock data
      
      // Get user statistics
      const totalUsers = await DatabaseQueryBuilder.count(models.user, 'User');
      const activeUsers = await DatabaseQueryBuilder.count(
        models.user,
        'User',
        { isActive: true }
      );
      const verifiedUsers = await DatabaseQueryBuilder.count(
        models.user,
        'User',
        { emailVerified: true }
      );
      
      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await DatabaseQueryBuilder.count(
        models.user,
        'User',
        { createdAt: { gte: today } }
      );

      // Get user counts by role
      const usersByRole = await DatabaseQueryBuilder.groupBy(
        models.user,
        ['role'],
        { _count: { id: true } },
        'User'
      );
      
      const roleCountMap: Record<string, number> = {};
      usersByRole.forEach((role: { role: string; _count: { id: number } }) => {
        roleCountMap[role.role] = role._count.id;
      });
      
      // Get task statistics
      const tasks = await DatabaseQueryBuilder.count(models.task, 'Task');
      const openTasks = await DatabaseQueryBuilder.count(
        models.task,
        'Task',
        { status: 'OPEN' }
      );
      const inProgressTasks = await DatabaseQueryBuilder.count(
        models.task,
        'Task',
        { status: 'IN_PROGRESS' }
      );
      const { items: completedTasksWithDuration } = await DatabaseQueryBuilder.findMany(
        models.task,
        {
          where: { status: 'COMPLETED' },
          select: { id: true, status: true, createdAt: true, completedAt: true }
        },
        'Task'
      );
      const disputedTasks = await DatabaseQueryBuilder.count(
        models.task,
        'Task',
        { status: 'DISPUTED' }
      );
      
      // Calculate task completion rate
      const completionRate = tasks > 0 
        ? (completedTasksWithDuration.length / tasks) * 100 
        : 0;
      
      // Get payment statistics
      const { items: payments } = await DatabaseQueryBuilder.findMany(
        models.payment,
        {
          select: {
            amount: true,
            status: true,
            createdAt: true
          }
        },
        'Payment'
      );
      
      // interface Payment {
      //   amount: number | null;
      //   status: string;
      //   createdAt: Date;
      // }
      
      const totalVolume = (payments as any[]).reduce((sum: number, payment: any) => sum + (payment.amount ?? 0), 0);
      
      // Get payments made today
      const todayPayments = (payments as any[]).filter((payment: any) => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= today;
      });
      
      const todayVolume = (todayPayments as any[]).reduce((sum: number, payment: any) => sum + (payment.amount ?? 0), 0);
      
      // Get payment counts by status
      const paymentsByStatus = await DatabaseQueryBuilder.groupBy(
        models.payment,
        ['status'],
        { _count: { id: true } },
        'Payment'
      );
      
      const paymentStatusMap: Record<string, number> = {};
      paymentsByStatus.forEach((status: PaymentStatusCount) => {
        paymentStatusMap[status.status] = status._count.id;
      });
      
      // Calculate payment success rate
      const successfulPayments = (payments as any[]).filter((payment: any) => payment.status === 'COMPLETED').length;
      const paymentSuccessRate = payments.length > 0 
        ? (successfulPayments / payments.length) * 100 
        : 0;
      
      // Get platform statistics
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      
      const activeUsers24h = await DatabaseQueryBuilder.count(
        models.user,
        'User',
        { lastActive: { gte: last24Hours } }
      );

      // Get average task rating
      const { items: reviews } = await DatabaseQueryBuilder.findMany(
        models.review,
        {
          select: {
            rating: true
          }
        },
        'Review'
      );
      
      // Calculate average rating
      const averageRating = reviews.length > 0
        ? (reviews as any[]).reduce((sum: number, review: any) => sum + (review.rating ?? 0), 0) / (reviews as any[]).length
        : 0;
      
      // Get top categories
      const topCategoriesData = await DatabaseQueryBuilder.groupBy(
        models.task,
        ['categoryId'],
        { _count: { id: true } },
        'Task',
        undefined // no where clause
      );
      
      // Get category names
      const categoryIds = topCategoriesData.map((cat: TopCategoryData) => cat.categoryId);
      const { items: categories } = await DatabaseQueryBuilder.findMany(
        models.category,
        {
          where: {
            id: { in: categoryIds }
          },
          select: {
            id: true,
            name: true
          }
        },
        'Category'
      );
      
      // Map category IDs to names
      const categoryMap: Record<string, string> = {};
      (categories as any[]).forEach((cat: any) => {
        categoryMap[cat.id] = cat.name;
      });
      
      const topCategories = topCategoriesData.map((cat: TopCategoryData) => ({
        name: categoryMap[cat.categoryId] || 'Unknown Category',
        count: cat._count.id
      }));
      
      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          newToday: newUsersToday,
          byRole: roleCountMap
        },
        tasks: {
          total: tasks,
          open: openTasks,
          inProgress: inProgressTasks,
          completed: completedTasksWithDuration.length,
          disputed: disputedTasks,
          completionRate: parseFloat(completionRate.toFixed(2)),
          averageCompletionTime: 48 // Mock data: average 48 hours to complete
        },
        payments: {
          totalVolume: parseFloat((totalVolume as number).toFixed(2)),
          todayVolume: parseFloat((todayVolume as number).toFixed(2)),
          successRate: parseFloat(paymentSuccessRate.toFixed(2)),
          byStatus: paymentStatusMap
        },
        platform: {
          activeUsers24h,
          taskSuccessRate: parseFloat(completionRate.toFixed(2)),
          averageRating: parseFloat(averageRating.toFixed(1)),
          topCategories
        }
      };
    } catch (error) {
      logger.error('Error generating admin dashboard statistics', { error });
      throw error;
    }
  }

  /**
   * Get users for moderation with detailed information
   */
  async getUsers(filters: any = {}, page: number = 1, limit: number = 50): Promise<{ users: UserModeration[]; pagination: PaginationInfo }> {
    logger.info('Retrieving users for admin moderation', { filters, page, limit });
    
    try {
      // Build query conditions based on filters
      const where: any = {};
      
      if (filters.role) {
        where.role = filters.role;
      }
      
      if (filters.status) {
        where.isActive = filters.status === 'ACTIVE';
      }
      
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Count total matching records for pagination
      const total = await DatabaseQueryBuilder.count(models.user, 'User', where);
      
      // Create pagination info
      const pagination = createPagination(total, page, limit);
      
      // Get users with pagination
      const { items: users } = await DatabaseQueryBuilder.findMany(
        models.user,
        {
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            trustScore: true,
            isActive: true,
            emailVerified: true,
            phoneVerified: true,
            createdAt: true,
            lastActive: true,
            tasksPosted: { select: { id: true } },
            tasksCompleted: { select: { id: true } },
            reviewsReceived: {
              select: {
                rating: true
              }
            },
            payments: {
              select: {
                amount: true,
                status: true
              }
            },
            disputes: {
              select: { id: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip: (page - 1) * limit, limit }
        },
        'User'
      );
      
      // Transform data for the admin interface
      const moderationUsers: UserModeration[] = users.map((user: any) => {
        // Calculate user statistics
        const totalTasks = user.tasksPosted?.length ?? 0;
        const completedTasks = user.tasksCompleted?.length ?? 0;
        
        // Calculate total earnings and spending
        interface UserPayment {
          amount: number | null;
          status: string;
        }
        
        const totalEarnings = user.payments
          ?.filter((p: UserPayment) => p.status === 'COMPLETED')
          .reduce((sum: number, p: UserPayment) => sum + (p.amount ?? 0), 0) ?? 0;
          
        const totalSpent = totalEarnings; // Simplified calculation without direction field
        
        // Calculate average rating
        interface Review {
          rating: number | null;
        }
        const reviews: Review[] = user.reviewsReceived ?? [];
        const totalRating = reviews.reduce((sum: number, r: Review) => sum + (r.rating ?? 0), 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        
        // Check for flags
        const hasDisputes = (user.disputes?.length ?? 0) > 0;
        const lowRating = reviews.length > 0 && averageRating < 3.0;
        const lastActive = user.lastActive ? new Date(user.lastActive) : new Date(0);
        const inactiveAccount = lastActive.getTime() < new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore ?? 0,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
          stats: {
            tasksPosted: totalTasks,
            tasksCompleted: completedTasks,
            totalEarnings,
            totalSpent,
            reviewsReceived: reviews.length,
            averageRating
          },
          flags: {
            hasDisputes,
            lowRating,
            inactiveAccount,
            unverifiedEmail: !user.emailVerified
          }
        };
      });
      
      return {
        users: moderationUsers,
        pagination
      };
    } catch (error) {
      logger.error('Error retrieving users for moderation', { error });
      throw error;
    }
  }

  /**
   * Get detailed user information for admin view
   */
  async getUserDetails(userId: string): Promise<any> {
    logger.info('Retrieving detailed user information', { userId });
    
    try {
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          trustScore: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          lastActive: true,
          tasksPosted: true,
          tasksCompleted: true,
          bids: true,
          reviewsReceived: true,
          reviewsGiven: true,
          payments: true,
          disputes: true,
          verifications: true
        }
      );
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Error retrieving user details', { userId, error });
      throw error;
    }
  }

  /**
   * Update user status (activate, suspend, etc.)
   */
  async updateUserStatus(userId: string, status: string, reason: string, adminId: string): Promise<void> {
    logger.info('Updating user status', { userId, status, adminId });
    
    try {
      // Verify user exists
      await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        { id: true, isActive: true, email: true, firstName: true, lastName: true }
      );

      const isActive = status === 'ACTIVE';
      const actionType = isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER';

      // Update user status
      await DatabaseQueryBuilder.update(
        models.user,
        userId,
        { isActive },
        'User',
        { id: true, isActive: true, updatedAt: true }
      );
      
      // Log the action in the audit trail
      await DatabaseQueryBuilder.create(
        models.auditLog,
        {
          userId: adminId,
          action: actionType,
          entityType: 'User',
          targetId: userId,
          details: reason,
          ipAddress: '0.0.0.0' // In a real implementation, this would be the admin's IP
        },
        'AuditLog',
        {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          targetId: true,
          details: true,
          ipAddress: true,
          createdAt: true
        }
      );
      
      // Notify the user
      const statusText = isActive ? 'activated' : 'suspended';
      logger.info(`User ${userId} has been ${statusText} by admin ${adminId}`);
      
    } catch (error) {
      logger.error('Error updating user status', { userId, status, error });
      throw error;
    }
  }

  /**
   * Get pending verifications for admin review
   */
  async getVerifications(filters: any = {}, page: number = 1, limit: number = 20): Promise<{ verifications: any[]; pagination: PaginationInfo }> {
    logger.info('Retrieving verifications for admin review', { filters, page, limit });
    
    try {
      // Build query conditions based on filters
      const where: any = {};
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.status) {
        where.status = filters.status;
      } else {
        // Default to pending verifications
        where.status = 'PENDING';
      }
      
      // Count total matching records for pagination
      const total = await DatabaseQueryBuilder.count(models.verification, 'Verification', where);
      
      // Create pagination info
      const pagination = createPagination(total, page, limit);
      
      // Get verifications with pagination
      const { items: verifications } = await DatabaseQueryBuilder.findMany(
        models.verification,
        {
          where,
          select: {
            id: true,
            userId: true,
            type: true,
            status: true,
            documentType: true,
            documentUrl: true,
            submittedAt: true,
            reviewedAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                trustScore: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip: (page - 1) * limit, limit }
        },
        'Verification'
      );
      
      return {
        verifications,
        pagination
      };
    } catch (error) {
      logger.error('Error retrieving verifications', { error });
      throw error;
    }
  }

  /**
   * Process a verification request (approve or reject)
   */
  async processVerification(adminId: string, verificationId: string, action: string, notes?: string): Promise<void> {
    logger.info('Processing verification request', { adminId, verificationId, action });
    
    try {
      const verification = await DatabaseQueryBuilder.findById(
        models.verification,
        verificationId,
        'Verification',
        {
          id: true,
          userId: true,
          type: true,
          status: true,
          processedAt: true,
          processedBy: true,
          adminNotes: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      );
      
      if (!verification) {
        throw new NotFoundError('Verification request not found');
      }
      
      if ((verification as any).status !== 'PENDING') {
        throw new ValidationError('This verification request has already been processed');
      }
      
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      
      // Update verification status
      await DatabaseQueryBuilder.update(
        models.verification,
        verificationId,
        {
          status,
          processedAt: new Date(),
          processedBy: adminId,
          adminNotes: notes
        },
        'Verification',
        {
          id: true,
          status: true,
          processedAt: true,
          processedBy: true,
          adminNotes: true
        }
      );
      
      // If approved, update user verification status
      if (status === 'APPROVED') {
        const updateData: any = {};
        
        switch ((verification as any).type) {
          case 'EMAIL':
            updateData.emailVerified = true;
            break;
          case 'PHONE':
            updateData.phoneVerified = true;
            break;
          case 'IDENTITY':
            updateData.identityVerified = true;
            break;
          case 'ADDRESS':
            updateData.addressVerified = true;
            break;
          case 'BUSINESS':
            updateData.businessVerified = true;
            break;
        }
        
        // Update user verification status
        await DatabaseQueryBuilder.update(
          models.user,
          (verification as any).userId,
          updateData,
          'User',
          { id: true, ...Object.keys(updateData).reduce((acc, key) => ({ ...acc, [key]: true }), {}) }
        );
        
        // Recalculate trust score
        // In a real implementation, this would call a function to recalculate the user's trust score
        // based on their verification status
      }
      
      // Log the action in the audit trail
      await DatabaseQueryBuilder.create(
        models.auditLog,
        {
          userId: adminId,
          action: `VERIFICATION_${status}`,
          entityType: 'Verification',
          targetId: (verification as any).userId,
          details: `${(verification as any).type} verification ${status.toLowerCase()}` + (notes ? `: ${notes}` : ''),
          ipAddress: '0.0.0.0' // In a real implementation, this would be the admin's IP
        },
        'AuditLog',
        {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          targetId: true,
          details: true,
          ipAddress: true,
          createdAt: true
        }
      );
      
      // Notify the user
      // In a real implementation, this would send an email or notification
      logger.info(`Verification ${verificationId} ${status.toLowerCase()} by admin ${adminId}`);
    } catch (error) {
      logger.error('Error processing verification', { verificationId, action, error });
      throw error;
    }
  }

  /**
   * Get system metrics for monitoring
   */
  async getSystemMetrics(): Promise<any> {
    logger.info('Retrieving system metrics');
    
    // In a real implementation, this would retrieve actual system metrics
    // For now, we'll return mock data
    return {
      performance: {
        responseTime: 120, // ms
        serverLoad: 0.45, // 45%
        memoryUsage: 0.62, // 62%
        databaseConnections: 24
      },
      errors: {
        last24Hours: 12,
        byType: {
          validation: 5,
          authentication: 3,
          database: 2,
          server: 2
        },
        trend: [-5, 0, 2, -1, 3, -2, 0] // Daily change over the last week
      },
      security: {
        failedLogins: 37,
        suspiciousActivities: 3,
        ipBlocked: 2
      },
      uptime: 99.98, // Percentage
      lastDeployment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    };
  }

  /**
   * Get audit logs for admin review
   */
  async getAuditLogs(filters: any = {}): Promise<any> {
    logger.info('Retrieving audit logs', { filters });
    
    try {
      // Build query conditions based on filters
      const where: any = {};
      
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      if (filters.action) {
        where.action = filters.action;
      }
      
      if (filters.startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(filters.startDate)
        };
      }
      
      if (filters.endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(filters.endDate)
        };
      }
      
      // Get audit logs with pagination using consolidated method
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;

      const { items: logs, total } = await DatabaseQueryBuilder.findMany(
        models.auditLog,
        {
          where,
          select: {
            id: true,
            userId: true,
            action: true,
            entityType: true,
            targetId: true,
            details: true,
            ipAddress: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip: (page - 1) * limit, limit }
        },
        'AuditLog'
      );

      // Create pagination info
      const pagination = createPagination(total, page, limit);
      
      return {
        logs,
        pagination
      };
    } catch (error) {
      logger.error('Error retrieving audit logs', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
