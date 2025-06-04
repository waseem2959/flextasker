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

import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { createPagination, PaginationInfo } from '../utils/response-utils';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define proper interfaces for type safety
interface PaymentStatusCount {
  status: string;
  _count: { id: number };
}



interface TopCategoryData {
  categoryId: string;
  _count: { id: number };
}

interface CategoryInfo {
  id: string;
  name: string;
}

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
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });
      const verifiedUsers = await prisma.user.count({
        where: { emailVerified: true }
      });
      
      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = await prisma.user.count({
        where: {
          createdAt: { gte: today }
        }
      });
      
      // Get user counts by role
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      });
      
      const roleCountMap: Record<string, number> = {};
      usersByRole.forEach((role: { role: string; _count: { id: number } }) => {
        roleCountMap[role.role] = role._count.id;
      });
      
      // Get task statistics
      const tasks = await prisma.task.count({});
      const openTasks = await prisma.task.count({
        where: { status: 'OPEN' }
      });
      const inProgressTasks = await prisma.task.count({
        where: { status: 'IN_PROGRESS' }
      });
      const completedTasksWithDuration = await prisma.task.findMany({
        where: { status: 'COMPLETED' }
      });
      const disputedTasks = await prisma.task.count({
        where: { status: 'DISPUTED' }
      });
      
      // Calculate task completion rate
      const completionRate = tasks > 0 
        ? (completedTasksWithDuration.length / tasks) * 100 
        : 0;
      
      // Get payment statistics
      const payments = await prisma.payment.findMany({
        select: {
          amount: true,
          status: true,
          createdAt: true
        }
      });
      
      interface Payment {
        amount: number | null;
        status: string;
        createdAt: Date;
      }
      
      const totalVolume = payments.reduce((sum: number, payment: Payment) => sum + (payment.amount ?? 0), 0);
      
      // Get payments made today
      const todayPayments = payments.filter((payment: Payment) => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= today;
      });
      
      const todayVolume = todayPayments.reduce((sum: number, payment: Payment) => sum + (payment.amount ?? 0), 0);
      
      // Get payment counts by status
      const paymentsByStatus = await prisma.payment.groupBy({
        by: ['status'],
        _count: { id: true }
      });
      
      const paymentStatusMap: Record<string, number> = {};
      paymentsByStatus.forEach((status: PaymentStatusCount) => {
        paymentStatusMap[status.status] = status._count.id;
      });
      
      // Calculate payment success rate
      const successfulPayments = payments.filter((payment: Payment) => payment.status === 'COMPLETED').length;
      const paymentSuccessRate = payments.length > 0 
        ? (successfulPayments / payments.length) * 100 
        : 0;
      
      // Get platform statistics
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      
      const activeUsers24h = await prisma.user.count({
        where: {
          lastActive: { gte: last24Hours }
        }
      });
      
      // Get average task rating
      const reviews = await prisma.review.findMany({
        select: {
          rating: true
        }
      });
      
      // Calculate average rating
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: { rating: number }) => sum + (review.rating ?? 0), 0) / reviews.length
        : 0;
      
      // Get top categories
      const topCategoriesData = await prisma.task.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      });
      
      // Get category names
      const categoryIds = topCategoriesData.map((cat: TopCategoryData) => cat.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Map category IDs to names
      const categoryMap: Record<string, string> = {};
      categories.forEach((cat: CategoryInfo) => {
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
          totalVolume: parseFloat(totalVolume.toFixed(2)),
          todayVolume: parseFloat(todayVolume.toFixed(2)),
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
      const total = await prisma.user.count({ where });
      
      // Create pagination info
      const pagination = createPagination(total, page, limit);
      
      // Get users with pagination
      const users = await prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
        }
      });
      
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          tasksPosted: true,
          tasksCompleted: true,
          bids: true,
          reviewsReceived: true,
          reviewsGiven: true,
          payments: true,
          disputes: true,
          verifications: true
        }
      });
      
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
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const isActive = status === 'ACTIVE';
      const actionType = isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER';
      
      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: { isActive }
      });
      
      // Log the action in the audit trail
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: actionType,
          entityType: 'User',
          targetId: userId,
          details: reason,
          ipAddress: '0.0.0.0' // In a real implementation, this would be the admin's IP
        }
      });
      
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
      const total = await prisma.verification.count({ where });
      
      // Create pagination info
      const pagination = createPagination(total, page, limit);
      
      // Get verifications with pagination
      const verifications = await prisma.verification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
        }
      });
      
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
      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
        include: {
          user: true
        }
      });
      
      if (!verification) {
        throw new NotFoundError('Verification request not found');
      }
      
      if (verification.status !== 'PENDING') {
        throw new ValidationError('This verification request has already been processed');
      }
      
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      
      // Update verification status
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          status,
          processedAt: new Date(),
          processedBy: adminId,
          adminNotes: notes
        }
      });
      
      // If approved, update user verification status
      if (status === 'APPROVED') {
        const updateData: any = {};
        
        switch (verification.type) {
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
        await prisma.user.update({
          where: { id: verification.userId },
          data: updateData
        });
        
        // Recalculate trust score
        // In a real implementation, this would call a function to recalculate the user's trust score
        // based on their verification status
      }
      
      // Log the action in the audit trail
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: `VERIFICATION_${status}`,
          entityType: 'Verification',
          targetId: verification.userId,
          details: `${verification.type} verification ${status.toLowerCase()}` + (notes ? `: ${notes}` : ''),
          ipAddress: '0.0.0.0' // In a real implementation, this would be the admin's IP
        }
      });
      
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
      
      // Count total matching records for pagination
      const total = await prisma.auditLog.count({ where });
      
      // Create pagination info
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const pagination = createPagination(total, page, limit);
      
      // Get audit logs with pagination
      const logs = await prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });
      
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
