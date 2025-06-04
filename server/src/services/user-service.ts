/**
 * User Service
 * 
 * This module provides a comprehensive implementation of all user-related functionality.
 */

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TaskStatus, UserRole } from '../../../shared/types/enums';
import { db } from '../utils/database';
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
    const existingUser = await db.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ValidationError('Email already in use');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create the user
    const user = await db.user.create({
      data: {
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
      select: {
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
    });

    logger.info('User created', { userId: user.id, email: user.email });
    return user;
  }

  /**
   * Get a user by their ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get a user by their email
   */
  async getUserByEmail(email: string): Promise<any> {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        passwordHash: true,
        isActive: true,
        emailVerified: true
      }
    });

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
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is being updated and if it's already in use
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: updateData.email }
      });

      if (existingUser) {
        throw new ValidationError('Email already in use');
      }
    }

    // Prepare update data
    const data: any = {};

    // Only include fields that are provided
    if (updateData.name) data.name = updateData.name;
    if (updateData.email) data.email = updateData.email;
    if (updateData.phone) data.phone = updateData.phone;
    if (updateData.bio) data.bio = updateData.bio;
    if (updateData.location) data.location = updateData.location;
    if (updateData.profileImage) data.profileImage = updateData.profileImage;

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        location: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    logger.info('User updated', { userId });
    return updatedUser;
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarPath: string): Promise<any> {
    // Validate that user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, profileImage: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate avatar path
    if (!avatarPath || typeof avatarPath !== 'string') {
      throw new ValidationError('Valid avatar path is required');
    }

    // Update user's profile image
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        profileImage: avatarPath
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        location: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    logger.info('User avatar updated', { userId, avatarPath });
    return updatedUser;
  }

  /**
   * Update a user's password 
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    // Get the current user with password hash
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });

    logger.info('Password updated', { userId });
    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<any> {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete the user
    await db.user.delete({
      where: { id: userId }
    });

    logger.info('User deleted', { userId });
    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Verify a user's email with verification token
   */
  async verifyEmail(token: string): Promise<any> {
    // Find user with the verification token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user to mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    logger.info('Email verified', { userId: user.id });
    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<any> {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      }
    });

    logger.info('Password reset requested', { userId: user.id });
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
    const user = await db.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    logger.info('Password reset completed', { userId: user.id });
    return { success: true, message: 'Password has been reset successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get task statistics
    const tasksCreated = await db.task.count({
      where: { userId }
    });

    const tasksAssigned = await db.task.count({
      where: { assignedUserId: userId }
    });

    const tasksCompleted = await db.task.count({
      where: {
        assignedUserId: userId,
        status: TaskStatus.COMPLETED
      }
    });

    // Get bid statistics
    const bidsPlaced = await db.bid.count({
      where: { userId }
    });

    const bidsAccepted = await db.bid.count({
      where: {
        userId,
        status: 'ACCEPTED'
      }
    });

    // Get review statistics
    const reviewsReceived = await db.review.count({
      where: { receiverId: userId }
    });

    const averageRating = user.averageRating;

    return {
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      bidsPlaced,
      bidsAccepted,
      reviewsReceived,
      averageRating
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

    // Text search in name and bio
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
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

    // Count total records for pagination
    const total = await db.user.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get users with pagination
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
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
      skip: offset,
      take: limit,
      orderBy: [
        { averageRating: 'desc' },
        { createdAt: 'desc' }
      ]
    });

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
