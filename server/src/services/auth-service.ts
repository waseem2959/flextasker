/**
 * Authentication Service
 * 
 * This service handles all authentication-related operations including:
 * - User registration and login
 * - Token generation and validation
 * - Password management
 * - Email verification
 */

import * as jwtModule from 'jsonwebtoken';
import { comparePassword, generateToken, hashPassword } from '../utils/crypto';
import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { AuthenticationError, ConflictError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { EmailService } from './email-service';

// Create a properly typed interface for JWT operations
interface JWTOperations {
  sign: (payload: object, secret: string, options?: object) => string;
  verify: (token: string, secret: string) => unknown;
}

// Cast the imported module to our interface
const jwt = jwtModule as unknown as JWTOperations;

// Define the shape of our JWT payload
interface JWTPayload {
  userId: string;
  type: string;
  iat: number;
  exp?: number;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'USER' | 'TASKER' | 'ADMIN';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    avatar?: string;
  };
  token: string;
  refreshToken?: string;
}

/**
 * Authentication Service Class
 * 
 * Handles user authentication, registration, and related security operations.
 */
export class AuthService {
  private readonly emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * 
   * This process involves several steps:
   * 1. Check if the user already exists (no duplicate employees)
   * 2. Hash the password securely (don't store plain passwords)
   * 3. Create the user record in the database
   * 4. Send a welcome email with verification link
   * 5. Return the user data and authentication token
   */
  async registerUser(userData: RegisterUserData): Promise<AuthResult> {
    logger.info('Registering new user', { email: userData.email });

    try {
      // Check if user already exists
      const existingUserExists = await DatabaseQueryBuilder.exists(
        models.user,
        { email: userData.email.toLowerCase() },
        'User'
      );

      if (existingUserExists) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);

      // Create the user
      const newUser = await DatabaseQueryBuilder.create(
        models.user,
        {
          email: userData.email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role ?? 'USER',
          emailVerified: false,
          isActive: true,
          trustScore: 0,
          lastActive: new Date()
        },
        'User',
        {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          trustScore: true,
          createdAt: true
        }
      );

      // Generate access token
      const token = this.generateAccessToken((newUser as any).id);

      // Generate refresh token
      const refreshToken = generateToken(64);

      // Store refresh token
      await DatabaseQueryBuilder.create(
        models.refreshToken,
        {
          token: refreshToken,
          userId: (newUser as any).id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        'RefreshToken',
        {
          id: true,
          token: true,
          userId: true,
          expiresAt: true,
          createdAt: true
        }
      );

      // Send verification email
      await this.sendEmailVerification((newUser as any).id, (newUser as any).email);

      // Return user data and token
      return {
        user: {
          id: (newUser as any).id,
          email: (newUser as any).email,
          firstName: (newUser as any).firstName,
          lastName: (newUser as any).lastName,
          role: (newUser as any).role,
          emailVerified: (newUser as any).emailVerified,
          phoneVerified: (newUser as any).phoneVerified ?? false,
          avatar: (newUser as any).avatar ?? undefined
        },
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error registering user', { error, email: userData.email });
      throw error;
    }
  }

  /**
   * Login user
   * 
   * This process verifies the user's credentials and creates a new session:
   * 1. Find the user by email
   * 2. Check if the password matches
   * 3. Verify the account is active
   * 4. Generate a new authentication token
   * 5. Update the user's last active timestamp
   */
  async loginUser(credentials: LoginCredentials): Promise<AuthResult> {
    logger.info('User login attempt', { email: credentials.email });

    try {
      // Find user by email
      const user = await DatabaseQueryBuilder.findUnique(
        models.user,
        { email: credentials.email.toLowerCase() },
        'User',
        {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          trustScore: true
        }
      );

      // Check if user exists
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if password matches
      const passwordMatches = await comparePassword(credentials.password, (user as any).passwordHash);
      if (!passwordMatches) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if account is active
      if (!(user as any).isActive) {
        throw new AuthenticationError('Account is suspended. Please contact support.');
      }

      // Generate access token
      const token = this.generateAccessToken((user as any).id);

      // Generate refresh token if remember me is enabled
      let refreshToken;
      if (credentials.rememberMe) {
        refreshToken = generateToken(64);

        // Store refresh token
        await DatabaseQueryBuilder.create(
          models.refreshToken,
          {
            token: refreshToken,
            userId: (user as any).id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          'RefreshToken',
          {
            id: true,
            token: true,
            userId: true,
            expiresAt: true,
            createdAt: true
          }
        );
      }

      // Update last active timestamp
      await DatabaseQueryBuilder.update(
        models.user,
        (user as any).id,
        { lastActive: new Date() },
        'User',
        { id: true, lastActive: true }
      );

      // Log successful login
      logger.info('User login successful', { userId: (user as any).id });

      // Return user data and token
      return {
        user: {
          id: (user as any).id,
          email: (user as any).email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          role: (user as any).role,
          emailVerified: (user as any).emailVerified,
          phoneVerified: (user as any).phoneVerified ?? false,
          avatar: (user as any).avatar ?? undefined
        },
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error during login', { error, email: credentials.email });
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    logger.info('Token refresh attempt');

    try {
      // Find the refresh token in the database
      const tokenRecord = await DatabaseQueryBuilder.findUnique(
        models.refreshToken,
        { token: refreshToken },
        'RefreshToken',
        {
          id: true,
          token: true,
          userId: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              emailVerified: true,
              phoneVerified: true,
              avatar: true
            }
          }
        }
      );

      // Check if token exists and is valid
      if (!tokenRecord || new Date() > (tokenRecord as any).expiresAt) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      // Check if user account is active
      if (!(tokenRecord as any).user.isActive) {
        throw new AuthenticationError('Account is suspended');
      }

      // Generate new access token
      const newToken = this.generateAccessToken((tokenRecord as any).userId);

      // Generate new refresh token
      const newRefreshToken = generateToken(64);

      // Update refresh token in database
      await DatabaseQueryBuilder.update(
        models.refreshToken,
        (tokenRecord as any).id,
        {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        'RefreshToken'
      );

      // Return user data and new tokens
      return {
        user: {
          id: (tokenRecord as any).user.id,
          email: (tokenRecord as any).user.email,
          firstName: (tokenRecord as any).user.firstName,
          lastName: (tokenRecord as any).user.lastName,
          role: (tokenRecord as any).user.role,
          emailVerified: (tokenRecord as any).user.emailVerified,
          phoneVerified: (tokenRecord as any).user.phoneVerified ?? false,
          avatar: (tokenRecord as any).user.avatar ?? undefined
        },
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Error refreshing token', { error });
      throw error;
    }
  }

  /**
   * Logout user by invalidating their refresh token
   */
  async logoutUser(userId: string, token?: string): Promise<void> {
    logger.info('User logout', { userId });

    try {
      if (token) {
        // Delete the specific refresh token if provided
        await DatabaseQueryBuilder.deleteMany(
          models.refreshToken,
          { token },
          'RefreshToken'
        );
      } else {
        // Delete all refresh tokens for the user
        await DatabaseQueryBuilder.deleteMany(
          models.refreshToken,
          { userId },
          'RefreshToken'
        );
      }
    } catch (error) {
      logger.error('Error during logout', { error, userId });
      throw error;
    }
  }

  /**
   * Send email verification
   * 
   * This creates a secure token and sends it to the user's email address.
   * The token expires after a certain time for security.
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    logger.info('Sending email verification', { userId });

    try {
      // Generate verification token
      const verificationToken = generateToken(32);

      // Store token in database
      await DatabaseQueryBuilder.create(
        models.verification,
        {
          userId,
          type: 'EMAIL',
          token: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        'Verification',
        {
          id: true,
          userId: true,
          type: true,
          token: true,
          expiresAt: true,
          createdAt: true
        }
      );

      // Send email with verification link
      await this.emailService.sendVerificationEmail(
        email,
        verificationToken
      );

      logger.info('Verification email sent', { userId });
    } catch (error) {
      logger.error('Error sending verification email', { error, userId });
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    logger.info('Verifying email address');

    try {
      // Find verification record
      const verification = await models.verification.findFirst({
        where: {
          token,
          type: 'EMAIL',
          expiresAt: { gt: new Date() }
        }
      });

      if (!verification) {
        throw new ValidationError('Invalid or expired verification token');
      }

      // Update user's email verification status
      await DatabaseQueryBuilder.update(
        models.user,
        verification.userId,
        { emailVerified: true },
        'User'
      );

      // Delete the verification token
      await DatabaseQueryBuilder.delete(
        models.verification,
        verification.id,
        'Verification'
      );

      logger.info('Email verified successfully', { userId: verification.userId });
    } catch (error) {
      logger.error('Error verifying email', { error, token });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    logger.info('Password reset requested', { email });

    try {
      // Find user by email
      const user = await DatabaseQueryBuilder.findUnique(
        models.user,
        { email: email.toLowerCase() },
        'User',
        {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      );

      // If user doesn't exist, still return success to prevent email enumeration
      if (!user) {
        logger.info('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = generateToken(32);

      // Store token in database
      await DatabaseQueryBuilder.create(
        models.passwordReset,
        {
          userId: (user as any).id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        },
        'PasswordReset',
        {
          id: true,
          userId: true,
          token: true,
          expiresAt: true,
          createdAt: true
        }
      );

      // Send email with reset link
      await this.emailService.sendPasswordResetEmail(
        (user as any).email,
        resetToken
      );

      logger.info('Password reset email sent', { userId: (user as any).id });
    } catch (error) {
      logger.error('Error sending password reset email', { error, email });
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    logger.info('Password reset attempt');

    try {
      // Find reset record
      const resetRecord = await models.passwordReset.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() }
        }
      });

      if (!resetRecord) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await DatabaseQueryBuilder.update(
        models.user,
        resetRecord.userId,
        { passwordHash: hashedPassword },
        'User',
        { id: true, passwordHash: true, updatedAt: true }
      );

      // Delete all password reset tokens for this user
      await DatabaseQueryBuilder.deleteMany(
        models.passwordReset,
        { userId: resetRecord.userId },
        'PasswordReset'
      );

      // Invalidate all refresh tokens for this user
      await DatabaseQueryBuilder.deleteMany(
        models.refreshToken,
        { userId: resetRecord.userId },
        'RefreshToken'
      );

      logger.info('Password reset successful', { userId: resetRecord.userId });
    } catch (error) {
      logger.error('Error resetting password', { error });
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    logger.info('Password change attempt', { userId });

    try {
      // Find user
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        {
          id: true,
          passwordHash: true,
          isActive: true
        }
      );

      if (!user) {
        throw new ValidationError('User not found');
      }

      // Verify current password
      const passwordMatches = await comparePassword(currentPassword, (user as any).passwordHash);
      if (!passwordMatches) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await DatabaseQueryBuilder.update(
        models.user,
        userId,
        { passwordHash: hashedPassword },
        'User'
      );

      // Invalidate all refresh tokens for this user except the current one
      await DatabaseQueryBuilder.deleteMany(
        models.refreshToken,
        { userId },
        'RefreshToken'
      );

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Error changing password', { error, userId });
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    logger.info('Resending verification email', { userId });

    try {
      // Find user
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true
        }
      );

      if (!user) {
        throw new ValidationError('User not found');
      }

      if ((user as any).emailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Delete any existing verification tokens
      await DatabaseQueryBuilder.deleteMany(
        models.verification,
        {
          userId,
          type: 'EMAIL'
        },
        'Verification'
      );

      // Send new verification email
      await this.sendEmailVerification(userId, (user as any).email);

      logger.info('Verification email resent', { userId });
    } catch (error) {
      logger.error('Error resending verification email', { error, userId });
      throw error;
    }
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(userId: string): string {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET ?? 'default-secret-change-me',
      { expiresIn: '1h' }
    );
  }

  /**
   * Validate and decode token
   */
  async validateToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'default-secret-change-me'
      ) as JWTPayload;

      // Check if user exists and is active
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        decoded.userId,
        'User',
        {
          id: true,
          isActive: true
        }
      );

      if (!(user as any)?.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: decoded.userId
      };
    } catch (error) {
      logger.debug('Token validation failed', { error });
      return { valid: false };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
