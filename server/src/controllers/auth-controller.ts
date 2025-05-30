/**
 * Authentication Controller
 * 
 * Handles HTTP requests related to authentication, delegating business logic
 * to the auth service and formatting responses.
 */

import { Request, Response } from 'express';
import { BaseController } from './base-controller';
import { authService } from '../services/auth-service';
import { logger } from '../utils/logger';

class AuthController extends BaseController {
  /**
   * Register a new user
   */
  register = this.asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;

    logger.info('Registering new user', { email: userData.email });
    const result = await authService.registerUser(userData);
    
    return this.sendSuccess(res, result, 'User registered successfully', 201);
  });

  /**
   * Login a user
   */
  login = this.asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;

    logger.info('User login attempt', { email });
    const result = await authService.loginUser({ 
      email, 
      password, 
      rememberMe 
    });
    
    return this.sendSuccess(res, result, 'Login successful');
  });

  /**
   * Refresh authentication token
   */
  refreshToken = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    logger.info('Token refresh attempt');
    const result = await authService.refreshToken(refreshToken);
    
    return this.sendSuccess(res, result, 'Token refreshed successfully');
  });

  /**
   * Logout a user
   */
  logout = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      logger.info('User logout', { userId });
      await authService.logoutUser(userId, token);
    }
    
    return this.sendSuccess(res, null, 'Logout successful');
  });

  /**
   * Send password reset email
   */
  forgotPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    logger.info('Password reset requested', { email });
    await authService.forgotPassword(email);
    
    return this.sendSuccess(res, null, 'If your email is registered, you will receive a password reset link');
  });

  /**
   * Reset password with token
   */
  resetPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    logger.info('Password reset attempt');
    await authService.resetPassword(token, password);
    
    return this.sendSuccess(res, null, 'Password has been reset successfully');
  });

  /**
   * Change password
   */
  changePassword = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    logger.info('Password change attempt', { userId });
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return this.sendSuccess(res, null, 'Password changed successfully');
  });

  /**
   * Verify email with token
   */
  verifyEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    logger.info('Email verification attempt');
    await authService.verifyEmail(token);
    
    return this.sendSuccess(res, null, 'Email verified successfully');
  });

  /**
   * Resend verification email
   */
  resendVerification = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    logger.info('Resending verification email', { userId });
    await authService.resendVerificationEmail(userId);
    
    return this.sendSuccess(res, null, 'Verification email has been sent');
  });

  /**
   * Check authentication status
   */
  checkAuthStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    
    return this.sendSuccess(res, { user }, 'Authentication status retrieved');
  });
}

// Export controller instance
export const authController = new AuthController();
