import {
  comparePassword,
  generateToken,
  hashPassword
} from '@/utils/crypto';
import { db } from '@/utils/database';
import {
  AuthenticationError,
  ConflictError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import * as jwtModule from 'jsonwebtoken';
import { EmailService } from './email';

// Create a properly typed interface for JWT operations
interface JWTOperations {
  sign: (payload: object, secret: string, options?: object) => string;
  verify: (token: string, secret: string) => unknown;
}

// Cast the imported module to our interface
const jwt = jwtModule as unknown as JWTOperations;

/**
 * Authentication service - this is like the HR department of our digital company.
 * It handles hiring (registration), ID verification (login), badge creation (JWT tokens),
 * and employee records management (user profiles).
 * 
 * The service encapsulates all the business logic for authentication, keeping it
 * separate from the web routes that handle HTTP requests.
 */

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
  role?: 'USER' | 'TASKER';
}

export interface LoginCredentials {
  email: string;
  password: string;
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

export class AuthService {
  private readonly emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user - like hiring a new employee
   * 
   * This process involves several steps:
   * 1. Check if the user already exists (no duplicate employees)
   * 2. Hash the password securely (don't store plain passwords)
   * 3. Create the user record in the database
   * 4. Send a welcome email with verification link
   * 5. Return the user data and authentication token
   */
  async registerUser(userData: RegisterUserData): Promise<AuthResult> {
    try {
      // Step 1: Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            ...(userData.phone ? [{ phone: userData.phone }] : []),
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new ConflictError('An account with this email already exists');
        }
        if (existingUser.phone === userData.phone) {
          throw new ConflictError('An account with this phone number already exists');
        }
      }

      // Step 2: Hash the password - this is one-way encryption
      const hashedPassword = await hashPassword(userData.password);

      // Step 3: Create the user in the database
      const newUser = await db.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role ?? 'USER',
          // Set default trust score for new users
          trustScore: 0.0,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          avatar: true,
        },
      });

      // Step 4: Generate authentication token
      const token = this.generateAccessToken(newUser.id);

      // Step 5: Send verification email
      await this.sendEmailVerification(newUser.id, newUser.email);

      logger.info('New user registered:', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return {
        user: newUser,
        token,
      };

    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user - like checking an employee's badge at security
   * 
   * This process verifies the user's credentials and creates a new session:
   * 1. Find the user by email
   * 2. Check if the password matches
   * 3. Verify the account is active
   * 4. Generate a new authentication token
   * 5. Update the user's last active timestamp
   */
  async loginUser(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Step 1: Find user by email
      const user = await db.user.findUnique({
        where: { email: credentials.email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Step 2: Check password
      const isPasswordValid = await comparePassword(credentials.password, user.password);
      
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Step 3: Check if account is active
      if (!user.isActive) {
        throw new AuthenticationError('Your account has been deactivated');
      }

      // Step 4: Generate authentication token
      const token = this.generateAccessToken(user.id);

      // Step 5: Update last active timestamp
      await db.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      });

      logger.info('User logged in:', {
        userId: user.id,
        email: user.email,
        ip: 'logged-from-service', // IP would be added in the route handler
      });

      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };

    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification - like sending a confirmation letter
   * 
   * This creates a secure token and sends it to the user's email address.
   * The token expires after a certain time for security.
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    try {
      // Generate a secure token that expires in 24 hours
      const token = generateToken(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Clean up any existing tokens for this user
      await db.emailVerificationToken.deleteMany({
        where: { userId },
      });

      // Create new verification token
      await db.emailVerificationToken.create({
        data: {
          userId,
          token,
          email,
          expiresAt,
        },
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      await this.emailService.sendVerificationEmail(email, verificationUrl);

      logger.info('Email verification sent:', { userId, email });

    } catch (error) {
      logger.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Verify email address - like confirming receipt of a letter
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Find the verification token
      const verificationToken = await db.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!verificationToken) {
        throw new ValidationError('Invalid verification token');
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        throw new ValidationError('Verification token has expired');
      }

      // Update user as email verified
      await db.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });

      // Clean up the verification token
      await db.emailVerificationToken.delete({
        where: { token },
      });

      logger.info('Email verified:', {
        userId: verificationToken.userId,
        email: verificationToken.email,
      });

    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email - like helping someone who lost their key
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, firstName: true },
      });

      if (!user) {
        // Don't reveal that the email doesn't exist for security
        logger.info('Password reset requested for non-existent email:', email);
        return;
      }

      // Generate reset token
      const token = generateToken(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token (we reuse email verification token table)
      await db.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          email,
          expiresAt,
        },
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      await this.emailService.sendPasswordResetEmail(email, user.firstName, resetUrl);

      logger.info('Password reset email sent:', { userId: user.id, email });

    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Reset password using token - like giving someone a new key
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find the reset token
      const resetToken = await db.emailVerificationToken.findUnique({
        where: { token },
      });

      if (!resetToken) {
        throw new ValidationError('Invalid reset token');
      }

      // Check if token has expired
      if (resetToken.expiresAt < new Date()) {
        throw new ValidationError('Reset token has expired');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Clean up the reset token
      await db.emailVerificationToken.delete({
        where: { token },
      });

      logger.info('Password reset completed:', { userId: resetToken.userId });

    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access token - like creating a security badge
   */
  private generateAccessToken(userId: string): string {
    const payload = {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    });
  }

  /**
   * Validate and refresh token if needed
   */
  async validateToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      // Check if user still exists and is active
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (!user?.isActive) {
        return { valid: false };
      }

      return { valid: true, userId: user.id };

    } catch (error: unknown) {
      logger.error('Token validation failed:', error);
      
      // Handle specific JWT errors by checking error name
      if (error instanceof Error && 
          (error.name === 'JsonWebTokenError' || 
           error.name === 'TokenExpiredError' || 
           error.name === 'NotBeforeError')) {
        return { valid: false };
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }
}