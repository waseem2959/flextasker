/**
 * User Controller
 * 
 * This controller handles HTTP requests for user-related operations.
 * It extends the BaseController to leverage standardized request handling,
 * parameter parsing, and response formatting.
 */

import { Request, Response } from 'express';
import { BaseController } from './base-controller';
import { userService } from '@/services/user-service';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { ErrorType } from '../utils';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
  location: z.string().max(100).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(100),
});

// Search users schema can be defined when needed
// const searchUsersSchema = z.object({
//   role: z.nativeEnum(UserRole).optional(),
//   location: z.string().max(100).optional(),
//   minRating: z.coerce.number().min(0).max(5).optional(),
//   page: z.coerce.number().min(1).optional(),
//   limit: z.coerce.number().min(1).max(100).optional(),
// });

export class UserController extends BaseController {
  /**
   * Get a user profile by ID
   */
  getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    
    logger.info('Fetching user profile', { userId });
    const user = await userService.getUserById(userId);
    
    return this.sendSuccess(res, user, 'User profile retrieved successfully');
  });

  /**
   * Get current user's profile
   */
  getMyProfile = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    logger.info('Fetching own profile', { userId });
    const user = await userService.getUserById(userId);
    
    return this.sendSuccess(res, user, 'User profile retrieved successfully');
  });

  /**
   * Update user profile
   */
  updateUser = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    // Validate request body
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return this.sendError(
        res,
        'Invalid profile data',
        400,
        ErrorType.VALIDATION,
        { errors: errorMessages }
      );
    }
    
    logger.info('Updating user profile', { userId });
    const updatedUser = await userService.updateUser(userId, result.data);
    
    return this.sendSuccess(res, updatedUser, 'Profile updated successfully');
  });

  /**
   * Update user password
   */
  updatePassword = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    // Validate request body
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return this.sendError(
        res,
        'Invalid password data',
        400,
        ErrorType.VALIDATION,
        { errors: errorMessages }
      );
    }
    
    logger.info('Changing user password', { userId });
    const updateResult = await userService.updatePassword(userId, result.data.currentPassword, result.data.newPassword);
    
    return this.sendSuccess(res, updateResult, 'Password changed successfully');
  });

  /**
   * Delete user account
   */
  deleteUser = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    logger.info('Deleting user account', { userId });
    const result = await userService.deleteUser(userId);
    
    return this.sendSuccess(res, result, 'Account deleted successfully');
  });

  /**
   * Verify user email
   */
  verifyEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    
    if (!token) {
      return this.sendError(
        res,
        'Verification token is required',
        400,
        ErrorType.VALIDATION
      );
    }
    
    logger.info('Verifying user email');
    const result = await userService.verifyEmail(token);
    
    return this.sendSuccess(res, result, 'Email verified successfully');
  });

  /**
   * Request password reset
   */
  requestPasswordReset = this.asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return this.sendError(
        res,
        'Email is required',
        400,
        ErrorType.VALIDATION
      );
    }
    
    logger.info('Requesting password reset', { email });
    const result = await userService.requestPasswordReset(email);
    
    return this.sendSuccess(res, result, 'Password reset email sent');
  });

  /**
   * Reset password with token
   */
  resetPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return this.sendError(
        res,
        'Token and new password are required',
        400,
        ErrorType.VALIDATION
      );
    }
    
    logger.info('Resetting password with token');
    const result = await userService.resetPassword(token, newPassword);
    
    return this.sendSuccess(res, result, 'Password has been reset successfully');
  });

  /**
   * Get user statistics
   */
  getUserStats = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id || req.user!.id;
    
    logger.info('Fetching user statistics', { userId });
    const stats = await userService.getUserStats(userId);
    
    return this.sendSuccess(res, stats, 'User statistics retrieved successfully');
  });
}

// Export controller instance
export const userController = new UserController();
