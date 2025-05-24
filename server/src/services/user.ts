import { comparePassword, hashPassword } from '@/utils/crypto';
import { db } from '@/utils/database';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';

// Interface definitions remain the same
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface UpdateLocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserSearchFilters {
  role?: 'USER' | 'TASKER';
  city?: string;
  state?: string;
  country?: string;
  minTrustScore?: number;
  hasProfileImage?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
}

// Define return type interfaces for better type safety
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  role: string;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  averageRating: number;
  totalReviews: number;
  completedTasks: number;
  postedTasks: number;
  memberSince: Date;
  lastActive?: Date | null;
  // Optional fields only shown on own profile
  email?: string;
  phone?: string | null;
  address?: string | null;
  zipCode?: string | null;
}

export interface UpdatedUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  phoneVerified: boolean;
}

export interface UserSearchResultItem {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  totalTasksCompleted: number;
  averageRating: number;
}

export interface UserSearchResult {
  users: UserSearchResultItem[];
  pagination: PaginationInfo;
}

// Type definition for Prisma where clause operations
interface PrismaStringFilter {
  contains?: string;
  mode?: 'insensitive' | 'default';
}

interface PrismaNumberFilter {
  gte?: number;
  gt?: number;
  lte?: number;
  lt?: number;
  equals?: number;
}

interface PrismaNullFilter {
  not?: null;
}

// Type definition for the where clause used in user search
interface UserWhereClause {
  isActive?: boolean;
  role?: 'USER' | 'TASKER';
  city?: string | PrismaStringFilter;
  state?: string | PrismaStringFilter;
  country?: string | PrismaStringFilter;
  trustScore?: number | PrismaNumberFilter;
  avatar?: string | null | PrismaNullFilter;
  emailVerified?: boolean;
}

export interface UserStats {
  financial: {
    totalEarnings: number;
    totalSpent: number;
  };
  reputation: {
    trustScore: number;
    averageRating: number;
    totalReviews: number;
    reviewsGiven: number;
  };
  tasks: {
    posted: Record<string, number>;
    assigned: Record<string, number>;
    totalPosted: number;
    totalAssigned: number;
  };
}

export class UserService {
  async getUserProfile(userId: string, currentUserId?: string): Promise<UserProfile> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          zipCode: true,
          role: true,
          trustScore: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          lastActive: true,
          // Include review statistics
          reviewsReceived: {
            select: {
              rating: true,
            },
          },
          // Include task statistics for taskers
          assignedTasks: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
          postedTasks: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Calculate average rating with explicit types
      const ratings = user.reviewsReceived.map((review: { rating: number }) => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      // Count completed tasks
      const completedTasksCount = user.assignedTasks.length;
      const postedTasksCount = user.postedTasks.length;
      const isOwnProfile = currentUserId === userId;
      
      const profile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        city: user.city,
        state: user.state,
        country: user.country,
        role: user.role,
        trustScore: user.trustScore,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: user.reviewsReceived.length,
        completedTasks: completedTasksCount,
        postedTasks: postedTasksCount,
        memberSince: user.createdAt,
        lastActive: user.lastActive,
      };

      // Add sensitive information only for own profile
      if (isOwnProfile) {
        profile.email = user.email;
        profile.phone = user.phone;
        profile.address = user.address;
        profile.zipCode = user.zipCode;
      }

      logger.info('User profile retrieved:', {
        userId,
        viewedBy: currentUserId,
        isOwnProfile,
      });

      return profile;

    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: UpdateProfileData): Promise<UpdatedUserProfile> {
    try {
      // First, check if the user exists
      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Build the data object for update
      // Instead of using Prisma types, we'll create a type-safe object
      interface UpdateDataWithPhone extends UpdateProfileData {
        phoneVerified?: boolean;
      }
      
      const dataToUpdate: UpdateDataWithPhone = {
        ...updateData,
      };

      // If updating phone number, check for conflicts
      if (updateData.phone && updateData.phone !== existingUser.phone) {
        const phoneConflict = await db.user.findFirst({
          where: {
            phone: updateData.phone,
            NOT: { id: userId }, // Exclude current user
          },
        });

        if (phoneConflict) {
          throw new ConflictError('This phone number is already in use');
        }

        // If phone number is being changed, mark as unverified
        dataToUpdate.phoneVerified = false;
      }

      // Update the user profile
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          zipCode: true,
          phoneVerified: true,
        },
      });

      logger.info('User profile updated:', {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;

    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  async updateLocation(userId: string, locationData: UpdateLocationData): Promise<void> {
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          zipCode: locationData.zipCode,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      });

      logger.info('User location updated:', {
        userId,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
      });

    } catch (error) {
      logger.error('Failed to update user location:', error);
      throw error;
    }
  }

  async changePassword(userId: string, passwordData: ChangePasswordData): Promise<void> {
    try {
      // Get current user with password
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        passwordData.currentPassword, 
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(passwordData.newPassword);

      // Update password
      await db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info('User password changed:', { userId });

    } catch (error) {
      logger.error('Failed to change password:', error);
      throw error;
    }
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<string> {
    try {
      await db.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      logger.info('User avatar updated:', { userId, avatarUrl });

      return avatarUrl;

    } catch (error) {
      logger.error('Failed to update avatar:', error);
      throw error;
    }
  }

  async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<UserSearchResult> {
    try {
      // Build the where clause based on filters
      // Using our custom UserWhereClause type for type safety
      const whereClause: UserWhereClause = {
        isActive: filters.isActive !== false, // Default to active users only
      };

      if (filters.role) {
        whereClause.role = filters.role;
      }

      if (filters.city) {
        whereClause.city = {
          contains: filters.city,
          mode: 'insensitive', // Case-insensitive search
        };
      }

      if (filters.state) {
        whereClause.state = {
          contains: filters.state,
          mode: 'insensitive',
        };
      }

      if (filters.country) {
        whereClause.country = {
          contains: filters.country,
          mode: 'insensitive',
        };
      }

      if (filters.minTrustScore !== undefined) {
        whereClause.trustScore = {
          gte: filters.minTrustScore,
        };
      }

      if (filters.hasProfileImage) {
        whereClause.avatar = {
          not: null,
        };
      }

      if (filters.isVerified) {
        whereClause.emailVerified = true;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalUsers = await db.user.count({ where: whereClause });

      // Get users with their statistics
      const users = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          city: true,
          state: true,
          trustScore: true,
          emailVerified: true,
          phoneVerified: true,
          reviewsReceived: {
            select: { rating: true },
          },
          assignedTasks: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { trustScore: 'desc' }, // Higher trust score first
          { createdAt: 'desc' },  // Then by newer users
        ],
      });

      // Process user data with proper type definition
      // Define the shape of the user object from the query
      type UserFromQuery = {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        bio: string | null;
        city: string | null;
        state: string | null;
        trustScore: number;
        emailVerified: boolean;
        phoneVerified: boolean;
        reviewsReceived: Array<{ rating: number }>;
        assignedTasks: Array<{ id: string }>;
      };

      // Process user data to include calculated fields with explicit types
      const processedUsers: UserSearchResultItem[] = users.map((user: UserFromQuery) => {
        const ratings = user.reviewsReceived.map((r: { rating: number }) => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          bio: user.bio,
          city: user.city,
          state: user.state,
          trustScore: user.trustScore,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          totalTasksCompleted: user.assignedTasks.length,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      });

      const pagination = createPagination(page, limit, totalUsers);

      logger.info('User search completed:', {
        filters,
        page,
        limit,
        totalResults: totalUsers,
      });

      return {
        users: processedUsers,
        pagination,
      };

    } catch (error) {
      logger.error('User search failed:', error);
      throw error;
    }
  }

  async deactivateAccount(userId: string): Promise<void> {
    try {
      await db.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          // Clear sensitive data but keep transaction history
          phone: null,
          address: null,
          bio: null,
        },
      });

      logger.info('User account deactivated:', { userId });

    } catch (error) {
      logger.error('Failed to deactivate account:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const stats = await db.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          totalSpent: true,
          trustScore: true,
          postedTasks: {
            select: {
              status: true,
              budget: true,
            },
          },
          assignedTasks: {
            select: {
              status: true,
            },
          },
          reviewsReceived: {
            select: {
              rating: true,
            },
          },
          reviewsGiven: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!stats) {
        throw new NotFoundError('User not found');
      }

      // Calculate task statistics with properly typed parameters
      const tasksByStatus = stats.postedTasks.reduce((
        acc: Record<string, number>, 
        task: { status: string; budget: number }
      ) => {
        acc[task.status] = (acc[task.status] ?? 0) + 1; // Using nullish coalescing
        return acc;
      }, {} as Record<string, number>);

      const assignedTasksByStatus = stats.assignedTasks.reduce((
        acc: Record<string, number>, 
        task: { status: string }
      ) => {
        acc[task.status] = (acc[task.status] ?? 0) + 1; // Using nullish coalescing
        return acc;
      }, {} as Record<string, number>);

      // Calculate average rating with explicit types
      const ratings = stats.reviewsReceived.map((r: { rating: number }) => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        financial: {
          totalEarnings: stats.totalEarnings,
          totalSpent: stats.totalSpent,
        },
        reputation: {
          trustScore: stats.trustScore,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: stats.reviewsReceived.length,
          reviewsGiven: stats.reviewsGiven.length,
        },
        tasks: {
          posted: tasksByStatus,
          assigned: assignedTasksByStatus,
          totalPosted: stats.postedTasks.length,
          totalAssigned: stats.assignedTasks.length,
        },
      };

    } catch (error) {
      logger.error('Failed to get user statistics:', error);
      throw error;
    }
  }
}