/**
 * User Service
 * 
 * This module provides a comprehensive implementation of all user-related functionality.
 */

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TaskStatus, UserRole } from '../../../shared/types/enums';
import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { AuthenticationError, NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';

/**
 * Error class for user-specific errors
 */
export class UserError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'UserError';
  }
}

/**
 * User Service class that provides all user-related functionality
 */
export class UserService {
  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<any> {
    // Validate required fields
    if (!userData.email) {
      throw new ValidationError('Email is required');
    }

    if (!userData.password) {
      throw new ValidationError('Password is required');
    }

    if (!userData.firstName) {
      throw new ValidationError('First name is required');
    }

    if (!userData.lastName) {
      throw new ValidationError('Last name is required');
    }

    // Check if email already exists
    await DatabaseQueryBuilder.validateUnique(
      models.user,
      'email',
      userData.email.toLowerCase(),
      undefined,
      'User'
    );

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create the user
    const user = await DatabaseQueryBuilder.create(
      models.user,
      {
        email: userData.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        role: userData.role ?? UserRole.USER,
        phone: userData.phone,
        bio: userData.bio,
        location: userData.location,
        profileImage: userData.profileImage,
        isActive: true,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      'User',
      {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        bio: true,
        location: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    );

    logger.info('User created', { userId: (user as any).id, email: (user as any).email });
    return user;
  }

  /**
   * Get a user by their ID
   */
  async getUserById(userId: string): Promise<any> {
    return await DatabaseQueryBuilder.findById(
      models.user,
      userId,
      'User',
      {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        bio: true,
        location: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        averageRating: true,
        createdAt: true,
        lastActive: true
      }
    );
  }

  /**
   * Get a user by their email
   */
  async getUserByEmail(email: string): Promise<any> {
    const user = await DatabaseQueryBuilder.findByEmail(
      models.user,
      email,
      'User',
      {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
        isActive: true,
        emailVerified: true
      }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update a user's profile
   */
  async updateUser(userId: string, updateData: any): Promise<any> {
    // Get the current user
    const user = await DatabaseQueryBuilder.findById(
      models.user,
      userId,
      'User',
      { id: true, email: true }
    );

    // Check if email is being updated and if it's already in use
    if (updateData.email && updateData.email !== (user as any).email) {
      await DatabaseQueryBuilder.validateUnique(
        models.user,
        'email',
        updateData.email,
        userId,
        'User'
      );
    }

    // Prepare update data
    const data: any = {};

    // Only include fields that are provided
    if (updateData.firstName) data.firstName = updateData.firstName;
    if (updateData.lastName) data.lastName = updateData.lastName;
    if (updateData.email) data.email = updateData.email;
    if (updateData.phone) data.phone = updateData.phone;
    if (updateData.bio) data.bio = updateData.bio;
    if (updateData.location) data.location = updateData.location;
    if (updateData.profileImage) data.profileImage = updateData.profileImage;

    // Update the user
    return await DatabaseQueryBuilder.update(
      models.user,
      userId,
      data,
      'User',
      {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        bio: true,
        location: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    );
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarPath: string): Promise<any> {
    // Validate that user exists
    const user = await DatabaseQueryBuilder.findById(
      models.user,
      userId,
      'User',
      { id: true, profileImage: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate avatar path
    if (!avatarPath || typeof avatarPath !== 'string') {
      throw new ValidationError('Valid avatar path is required');
    }

    // Update user's profile image
    const updatedUser = await DatabaseQueryBuilder.update(
      models.user,
      userId,
      {
        profileImage: avatarPath
      },
      'User'
    );

    logger.info('User avatar updated', { userId, avatarPath });
    return updatedUser;
  }

  /**
   * Update a user's password 
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    // Get the current user with password hash
    const user = await DatabaseQueryBuilder.findById(
      models.user,
      userId,
      'User',
      { id: true, passwordHash: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, (user as any).passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await DatabaseQueryBuilder.update(
      models.user,
      userId,
      { passwordHash: hashedPassword },
      'User'
    );

    logger.info('Password updated', { userId });
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<any> {
    // Delete the user (includes existence check)
    await DatabaseQueryBuilder.delete(models.user, userId, 'User');

    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Verify a user's email with verification token
   */
  async verifyEmail(token: string): Promise<any> {
    // Find user with the verification token
    const user = await DatabaseQueryBuilder.findUnique(
      models.user,
      {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      },
      'User',
      {
        id: true,
        emailVerificationToken: true,
        emailVerificationExpires: true
      }
    );

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user to mark email as verified
    await DatabaseQueryBuilder.update(
      models.user,
      (user as any).id,
      {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      },
      'User'
    );

    logger.info('Email verified', { userId: (user as any).id });
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<any> {
    // Find user by email
    const user = await DatabaseQueryBuilder.findUnique(
      models.user,
      { email },
      'User',
      {
        id: true,
        email: true
      }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await DatabaseQueryBuilder.update(
      models.user,
      (user as any).id,
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      },
      'User'
    );

    logger.info('Password reset requested', { userId: (user as any).id });
    return { 
      success: true, 
      message: 'Password reset email sent',
      resetToken // In production, this would be sent via email, not returned directly
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<any> {
    // Find user with the reset token
    const user = await DatabaseQueryBuilder.findUnique(
      models.user,
      {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      },
      'User',
      {
        id: true,
        resetPasswordToken: true,
        resetPasswordExpires: true
      }
    );

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    await DatabaseQueryBuilder.update(
      models.user,
      (user as any).id,
      {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      'User'
    );

    logger.info('Password reset completed', { userId: (user as any).id });
    return { success: true, message: 'Password has been reset successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    // Get the user (includes existence check)
    const user = await DatabaseQueryBuilder.findById(
      models.user,
      userId,
      'User',
      { id: true, averageRating: true }
    );

    // Get statistics in parallel for better performance
    const [
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      bidsPlaced,
      bidsAccepted,
      reviewsReceived
    ] = await Promise.all([
      DatabaseQueryBuilder.count(models.task, 'Task', { ownerId: userId }),
      DatabaseQueryBuilder.count(models.task, 'Task', { assigneeId: userId }),
      DatabaseQueryBuilder.count(models.task, 'Task', {
        assigneeId: userId,
        status: TaskStatus.COMPLETED
      }),
      DatabaseQueryBuilder.count(models.bid, 'Bid', { bidderId: userId }),
      DatabaseQueryBuilder.count(models.bid, 'Bid', {
        bidderId: userId,
        status: 'ACCEPTED'
      }),
      DatabaseQueryBuilder.count(models.review, 'Review', { revieweeId: userId })
    ]);

    return {
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      bidsPlaced,
      bidsAccepted,
      reviewsReceived,
      averageRating: (user as any).averageRating
    };
  }

  /**
   * Search for users with filters and pagination
   */
  async searchUsers(params: any = {}): Promise<any> {
    const {
      query,
      role,
      location,
      minRating,
      page = 1,
      limit = 20
    } = params;

    // Build where conditions
    const where: any = {
      isActive: true, // Only show active users
      emailVerified: true // Only show verified users
    };

    // Text search in firstName, lastName and bio
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Rating filter
    if (minRating) {
      where.averageRating = { gte: parseFloat(minRating) };
    }

    // Get users with pagination using consolidated method
    const { items: users, total } = await DatabaseQueryBuilder.findMany(
      models.user,
      {
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          bio: true,
          location: true,
          profileImage: true,
          averageRating: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          lastActive: true
        },
        orderBy: [
          { averageRating: 'desc' },
          { createdAt: 'desc' }
        ],
        pagination: {
          page,
          skip: (page - 1) * limit,
          limit
        }
      },
      'User'
    );

    const totalPages = Math.ceil(total / limit);

    logger.info('Users searched', {
      query,
      role,
      location,
      minRating,
      total,
      page,
      limit
    });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

// Export singleton instance for use throughout the application
export const userService = new UserService();
