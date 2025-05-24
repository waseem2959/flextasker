import { db } from '@/utils/database';
import {
  NotFoundError,
  ValidationError
  // Removed unused AuthorizationError import
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';

/**
 * Admin service - this is like the command center for platform management.
 * It handles user moderation, verification approval, dispute resolution,
 * system analytics, and overall platform governance.
 * 
 * Think of this as having a comprehensive administrative system that gives
 * platform administrators the tools they need to manage users, resolve
 * issues, and monitor platform health and performance.
 */

// Define proper interfaces for type safety
interface PaymentStatusCount {
  status: string;
  _count: { id: number };
}

interface VerificationStatusCount {
  status: string;
  _count: { id: number };
}

interface TimeSeriesDataPoint {
  createdAt: Date;
  _count: { id: number };
  _sum?: { amount: number | null };
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
    newThisMonth: number;
    taskers: number;
  };
  tasks: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    newThisMonth: number;
  };
  payments: {
    totalVolume: number;
    totalFees: number;
    pendingPayments: number;
    completedPayments: number;
    refundedPayments: number;
    thisMonthVolume: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    newThisMonth: number;
    pendingModeration: number;
  };
  verifications: {
    pending: number;
    approved: number;
    rejected: number;
    newThisMonth: number;
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

export class AdminService {

  /**
   * Get comprehensive dashboard statistics
   * 
   * This provides a high-level overview of platform health and activity.
   */
  async getDashboardStatistics(): Promise<AdminDashboardStats> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // User statistics
      const userStats = await Promise.all([
        db.user.count(),
        db.user.count({ where: { isActive: true } }),
        db.user.count({ where: { emailVerified: true, phoneVerified: true } }),
        db.user.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
        db.user.count({ where: { role: 'TASKER' } }),
      ]);

      // Task statistics
      const taskStats = await Promise.all([
        db.task.count(),
        db.task.count({ where: { status: 'OPEN' } }),
        db.task.count({ where: { status: 'IN_PROGRESS' } }),
        db.task.count({ where: { status: 'COMPLETED' } }),
        db.task.count({ where: { status: 'CANCELLED' } }),
        db.task.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      ]);

      // Payment statistics
      const paymentStats = await db.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      });

      const paymentStatusCounts = await db.payment.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const thisMonthPayments = await db.payment.aggregate({
        where: { createdAt: { gte: firstDayOfMonth } },
        _sum: { amount: true },
      });

      // Review statistics
      const reviewStats = await db.review.aggregate({
        _count: { id: true },
        _avg: { rating: true },
      });

      const newReviewsThisMonth = await db.review.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      });

      // Verification statistics
      const verificationStats = await db.verification.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const newVerificationsThisMonth = await db.verification.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      });

      // Process payment status counts with proper typing
      // This is where we fix the implicit 'any' types
      const paymentCounts = paymentStatusCounts.reduce((
        acc: Record<string, number>, 
        item: PaymentStatusCount
      ) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Process verification counts with proper typing
      const verificationCounts = verificationStats.reduce((
        acc: Record<string, number>, 
        item: VerificationStatusCount
      ) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      const stats: AdminDashboardStats = {
        users: {
          total: userStats[0],
          active: userStats[1],
          verified: userStats[2],
          newThisMonth: userStats[3],
          taskers: userStats[4],
        },
        tasks: {
          total: taskStats[0],
          open: taskStats[1],
          inProgress: taskStats[2],
          completed: taskStats[3],
          cancelled: taskStats[4],
          newThisMonth: taskStats[5],
        },
        payments: {
          totalVolume: Number(paymentStats._sum.amount ?? 0), // Using nullish coalescing
          totalFees: Number(paymentStats._sum.amount ?? 0) * 0.05, // 5% platform fee
          pendingPayments: paymentCounts.PENDING ?? 0,
          completedPayments: paymentCounts.COMPLETED ?? 0,
          refundedPayments: paymentCounts.REFUNDED ?? 0,
          thisMonthVolume: Number(thisMonthPayments._sum.amount ?? 0),
        },
        reviews: {
          total: reviewStats._count.id,
          averageRating: Number(reviewStats._avg.rating ?? 0),
          newThisMonth: newReviewsThisMonth,
          pendingModeration: 0, // Would implement review moderation system
        },
        verifications: {
          pending: verificationCounts.PENDING ?? 0,
          approved: verificationCounts.VERIFIED ?? 0,
          rejected: verificationCounts.REJECTED ?? 0,
          newThisMonth: newVerificationsThisMonth,
        },
      };

      logger.info('Admin dashboard statistics generated');
      return stats;

    } catch (error) {
      logger.error('Failed to get dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Get users for moderation with detailed information
   */
  async getUsersForModeration(
    filters?: {
      role?: string;
      isActive?: boolean;
      emailVerified?: boolean;
      flaggedOnly?: boolean;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ users: UserModeration[]; pagination: PaginationInfo }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause with proper typing
      const whereClause: Record<string, unknown> = {};
      
      if (filters?.role) {
        whereClause.role = filters.role;
      }
      
      if (filters?.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters?.emailVerified !== undefined) {
        whereClause.emailVerified = filters.emailVerified;
      }

      // Get users with detailed information
      const totalUsers = await db.user.count({ where: whereClause });

      const users = await db.user.findMany({
        where: whereClause,
        include: {
          postedTasks: {
            select: { id: true, status: true },
          },
          assignedTasks: {
            select: { id: true, status: true },
          },
          reviewsReceived: {
            select: { rating: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Process users to include moderation information
      const moderationUsers: UserModeration[] = [];

      for (const user of users) {
        const completedTasks = user.assignedTasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
        const ratings = user.reviewsReceived.map((r: { rating: number }) => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
          : 0;

        // Check for flags
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const flags = {
          hasDisputes: false, // Would check dispute records
          lowRating: averageRating < 3.0 && ratings.length >= 3,
          inactiveAccount: user.lastActive < thirtyDaysAgo,
          unverifiedEmail: !user.emailVerified,
        };

        // Filter by flags if requested
        if (filters?.flaggedOnly) {
          const hasFlagsSet = Object.values(flags).some(flag => flag);
          if (!hasFlagsSet) continue;
        }

        moderationUsers.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
          stats: {
            tasksPosted: user.postedTasks.length,
            tasksCompleted: completedTasks,
            totalEarnings: Number(user.totalEarnings),
            totalSpent: Number(user.totalSpent),
            reviewsReceived: user.reviewsReceived.length,
            averageRating: Math.round(averageRating * 10) / 10,
          },
          flags,
        });
      }

      const pagination = createPagination(page, limit, totalUsers);

      return {
        users: moderationUsers,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get users for moderation:', error);
      throw error;
    }
  }

  /**
   * Suspend or reactivate a user account
   */
  async moderateUser(
    adminId: string,
    userId: string,
    action: 'SUSPEND' | 'REACTIVATE',
    reason: string
  ): Promise<void> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, email: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const newStatus = action === 'REACTIVATE';

      // Update user status
      await db.user.update({
        where: { id: userId },
        data: { isActive: newStatus },
      });

      // Log the moderation action
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: `USER_${action}`,
          resource: 'USER',
          resourceId: userId,
          details: {
            reason,
            previousStatus: user.isActive,
            newStatus,
            targetUserEmail: user.email,
          },
        },
      });

      logger.info('User moderation action completed:', {
        adminId,
        userId,
        action,
        reason,
      });

    } catch (error) {
      logger.error('Failed to moderate user:', error);
      throw error;
    }
  }

  /**
   * Get pending verifications for admin review
   */
  async getPendingVerifications(
    page: number = 1,
    limit: number = 20
  ): Promise<{ verifications: unknown[]; pagination: PaginationInfo }> {
    try {
      const skip = (page - 1) * limit;

      const totalVerifications = await db.verification.count({
        where: { status: 'PENDING' },
      });

      const verifications = await db.verification.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              trustScore: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Oldest first
      });

      const pagination = createPagination(page, limit, totalVerifications);

      return {
        verifications,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get pending verifications:', error);
      throw error;
    }
  }

  /**
   * Approve or reject a verification request
   */
  async processVerification(
    adminId: string,
    verificationId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ): Promise<void> {
    try {
      const verification = await db.verification.findUnique({
        where: { id: verificationId },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      if (verification.status !== 'PENDING') {
        throw new ValidationError('Only pending verifications can be processed');
      }

      const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

      // Update verification status
      await db.verification.update({
        where: { id: verificationId },
        data: {
          status: newStatus,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: action === 'REJECT' ? notes : null,
        },
      });

      // If approved, update user's trust score
      if (action === 'APPROVE') {
        await db.user.update({
          where: { id: verification.userId },
          data: {
            trustScore: {
              increment: 1.0, // Document verification bonus
            },
          },
        });
      }

      // Log the action
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: `VERIFICATION_${action}`,
          resource: 'VERIFICATION',
          resourceId: verificationId,
          details: {
            verificationType: verification.type,
            targetUserId: verification.userId,
            targetUserEmail: verification.user.email,
            notes,
          },
        },
      });

      logger.info('Verification processed:', {
        adminId,
        verificationId,
        action,
        userId: verification.userId,
      });

    } catch (error) {
      logger.error('Failed to process verification:', error);
      throw error;
    }
  }

  /**
   * Get system analytics and insights
   */
  async getSystemAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, unknown>> {
    try {
      const dateFilter: Record<string, unknown> = {};
      if (startDate ?? endDate) {
        const createdAt: Record<string, Date> = {};
        if (startDate) createdAt.gte = startDate;
        if (endDate) createdAt.lte = endDate;
        Object.assign(dateFilter, { createdAt });
      }

      // User growth analytics
      const userGrowth = await db.user.groupBy({
        by: ['createdAt'],
        where: dateFilter,
        _count: { id: true },
      });

      // Task completion analytics
      const taskCompletionRates = await db.task.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { id: true },
      });

      // Payment volume analytics
      const paymentVolume = await db.payment.groupBy({
        by: ['createdAt'],
        where: {
          ...dateFilter,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: { id: true },
      });

      // Top performing categories
      const topCategories = await db.task.groupBy({
        by: ['categoryId'],
        where: {
          ...dateFilter,
          status: 'COMPLETED',
        },
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      // Get category names
      const categoryIds = topCategories.map((c: TopCategoryData) => c.categoryId);
      const categories = await db.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      const categoriesMap = categories.reduce((acc: Record<string, string>, cat: CategoryInfo) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>);

      // User retention metrics (simplified)
      const totalUsers = await db.user.count();
      const activeThisMonth = await db.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        userGrowth: this.processTimeSeriesData(userGrowth, 'count'),
        taskCompletionRates: taskCompletionRates.map((item: { status: string; _count: { id: number } }) => ({
          status: item.status,
          count: item._count.id,
        })),
        paymentVolume: this.processTimeSeriesData(paymentVolume, 'volume'),
        topCategories: topCategories.map((item: TopCategoryData) => ({
          categoryId: item.categoryId,
          categoryName: categoriesMap[item.categoryId] ?? 'Unknown',
          completedTasks: item._count.id,
        })),
        userRetention: {
          totalUsers,
          activeThisMonth,
          retentionRate: totalUsers > 0 ? (activeThisMonth / totalUsers) * 100 : 0,
        },
      };

    } catch (error) {
      logger.error('Failed to get system analytics:', error);
      throw error;
    }
  }

  /**
   * Process time series data for analytics
   */
  private processTimeSeriesData(data: TimeSeriesDataPoint[], valueField: string): Array<Record<string, unknown>> {
    // Group by date and aggregate values
    const grouped = data.reduce((acc: Record<string, Record<string, unknown>>, item: TimeSeriesDataPoint) => {
      const date = item.createdAt.toISOString().split('T')[0];
      
      // Use nullish coalescing assignment for cleaner code
      acc[date] ??= { date, count: 0, volume: 0 };
      
      if (valueField === 'count') {
        (acc[date].count as number) += item._count.id;
      } else if (valueField === 'volume') {
        (acc[date].volume as number) += Number(item._sum?.amount ?? 0);
        (acc[date].count as number) += item._count.id;
      }
      
      return acc;
    }, {} as Record<string, Record<string, unknown>>);

    return Object.values(grouped).sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
      new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );
  }

  /**
   * Get dispute cases for admin review
   */
  async getDisputeCases(
    // These parameters are intentionally unused for the mock implementation
    _status?: string,
    _priority?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ disputes: DisputeCase[]; pagination: PaginationInfo }> {
    try {
      // Note: This assumes you have a disputes table
      // For now, we'll return a mock structure since disputes aren't fully implemented
      const mockDisputes: DisputeCase[] = [];
      const pagination = createPagination(page, limit, 0);

      return {
        disputes: mockDisputes,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get dispute cases:', error);
      throw error;
    }
  }

  /**
   * Generate platform health report
   */
  async generateHealthReport(): Promise<Record<string, unknown>> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // System health indicators
      const healthMetrics = await Promise.all([
        // Active users in last 24 hours
        db.user.count({
          where: {
            lastActive: { gte: twentyFourHoursAgo },
            isActive: true,
          },
        }),
        
        // New registrations in last 7 days
        db.user.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        
        // Task completion rate in last 7 days
        db.task.count({
          where: {
            status: 'COMPLETED',
            completionDate: { gte: sevenDaysAgo },
          },
        }),
        
        // Total tasks created in last 7 days
        db.task.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        
        // Payment success rate in last 7 days
        db.payment.count({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: sevenDaysAgo },
          },
        }),
        
        // Total payment attempts in last 7 days
        db.payment.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
      ]);

      const [
        activeUsers24h,
        newRegistrations7d,
        completedTasks7d,
        totalTasks7d,
        successfulPayments7d,
        totalPayments7d,
      ] = healthMetrics;

      const taskCompletionRate = totalTasks7d > 0 ? (completedTasks7d / totalTasks7d) * 100 : 0;
      const paymentSuccessRate = totalPayments7d > 0 ? (successfulPayments7d / totalPayments7d) * 100 : 0;

      return {
        timestamp: now,
        metrics: {
          userActivity: {
            activeUsers24h,
            newRegistrations7d,
            growthRate: 0, // Would calculate based on historical data
          },
          taskPerformance: {
            completedTasks7d,
            totalTasks7d,
            completionRate: Math.round(taskCompletionRate * 100) / 100,
          },
          paymentHealth: {
            successfulPayments7d,
            totalPayments7d,
            successRate: Math.round(paymentSuccessRate * 100) / 100,
          },
        },
        alerts: this.generateHealthAlerts({
          taskCompletionRate,
          paymentSuccessRate,
          activeUsers24h,
        }),
      };

    } catch (error) {
      logger.error('Failed to generate health report:', error);
      throw error;
    }
  }

  /**
   * Generate health alerts based on metrics
   */
  private generateHealthAlerts(metrics: {
    taskCompletionRate: number;
    paymentSuccessRate: number;
    activeUsers24h: number;
  }): string[] {
    const alerts: string[] = [];

    if (metrics.taskCompletionRate < 70) {
      alerts.push('Task completion rate is below 70% - investigate task quality or user satisfaction');
    }

    if (metrics.paymentSuccessRate < 95) {
      alerts.push('Payment success rate is below 95% - check payment gateway health');
    }

    if (metrics.activeUsers24h < 50) {
      alerts.push('Low user activity in last 24 hours - consider engagement campaigns');
    }

    return alerts;
  }
}