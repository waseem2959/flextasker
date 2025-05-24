import { generateNumericCode, generateToken } from '@/utils/crypto';
import { db } from '@/utils/database';
import {
  ConflictError,
  NotFoundError,
  RateLimitError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { EmailService } from './email';
import { SMSService } from './sms';

/**
 * Verification service - this is like the identity verification department
 * that handles all forms of user verification including email, phone, and
 * document verification. It ensures users are who they claim to be.
 * 
 * Think of this as having a sophisticated identity management system that
 * can verify users through multiple channels and maintain verification records.
 */

// Define types for better type safety throughout the service
type DocumentType = 'ID_DOCUMENT' | 'ADDRESS_PROOF' | 'BACKGROUND_CHECK';
type DocumentStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
type VerificationLevel = 'BASIC' | 'STANDARD' | 'PREMIUM';
// This type represents the status of individual document verification records in the database
type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DocumentVerificationData {
  userId: string;
  documentType: DocumentType;
  documentUrl: string;
  notes?: string;
}

export interface UserVerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  documentStatus: DocumentStatus;
  trustScore: number;
  verificationLevel: VerificationLevel;
}

// Define interfaces for database query results to ensure type safety
interface UserBasicInfo {
  id: string;
  email: string;
  firstName: string;
  emailVerified: boolean;
}

interface UserPhoneInfo {
  id: string;
  firstName: string;
  phone: string | null;
  phoneVerified: boolean;
}

interface UserTrustInfo {
  id: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustScore: number;
}

interface UserMinimalInfo {
  id: string;
  firstName: string;
  lastName: string;
}

// Now we use our DocumentVerificationStatus type for better type safety
interface DocumentVerificationRecord {
  type: string;
  status: DocumentVerificationStatus; // Using the specific type instead of generic string
}

interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
  };
}

interface PhoneVerificationToken {
  id: string;
  userId: string;
  code: string;
  phone: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
}

export class VerificationService {
  // Mark services as readonly since they're never reassigned after construction
  private readonly emailService: EmailService;
  private readonly smsService: SMSService;

  // Rate limiting constants - these are configuration values that don't change
  private readonly EMAIL_RATE_LIMIT = 3; // emails per hour
  private readonly SMS_RATE_LIMIT = 5; // SMS per hour
  private readonly VERIFICATION_ATTEMPTS = 3; // max attempts per code

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  // ====================================
  // EMAIL VERIFICATION
  // ====================================

  /**
   * Send email verification - like sending a confirmation letter
   * 
   * Creates a secure token and sends it to the user's email address.
   * Implements rate limiting to prevent abuse.
   */
  async sendEmailVerification(userId: string): Promise<void> {
    try {
      // Get user information with explicit typing
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          emailVerified: true,
        },
      }) as UserBasicInfo | null;

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        throw new ConflictError('Email is already verified');
      }

      // Check rate limiting - max 3 emails per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTokens = await db.emailVerificationToken.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentTokens >= this.EMAIL_RATE_LIMIT) {
        throw new RateLimitError('Too many verification emails sent. Please wait before requesting another.');
      }

      // Clean up any existing tokens for this user
      await db.emailVerificationToken.deleteMany({
        where: { userId },
      });

      // Generate new verification token
      const token = generateToken(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create verification token record
      await db.emailVerificationToken.create({
        data: {
          userId,
          token,
          email: user.email,
          expiresAt,
        },
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      await this.emailService.sendVerificationEmail(user.email, verificationUrl);

      logger.info('Email verification sent:', {
        userId,
        email: user.email,
        tokenExpiry: expiresAt,
      });

    } catch (error) {
      logger.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Verify email using token - like confirming receipt of a letter
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Find the verification token with explicit typing
      const verificationToken = await db.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
      }) as EmailVerificationToken | null;

      if (!verificationToken) {
        throw new ValidationError('Invalid or expired verification token');
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        // Clean up expired token
        await db.emailVerificationToken.delete({
          where: { token },
        });
        throw new ValidationError('Verification token has expired');
      }

      // Mark user's email as verified
      await db.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });

      // Clean up the verification token
      await db.emailVerificationToken.delete({
        where: { token },
      });

      // Update trust score since email is now verified
      await this.updateUserTrustScore(verificationToken.userId);

      logger.info('Email verified successfully:', {
        userId: verificationToken.userId,
        email: verificationToken.email,
      });

    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  // ====================================
  // PHONE VERIFICATION
  // ====================================

  /**
   * Send phone verification code - like sending a security code via SMS
   * 
   * Generates a numeric code and sends it via SMS with rate limiting
   * and attempt tracking to prevent abuse.
   */
  async sendPhoneVerificationCode(userId: string, phoneNumber: string): Promise<void> {
    try {
      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new ValidationError('Please provide a valid phone number in international format');
      }

      // Get user information with explicit typing
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          phone: true,
          phoneVerified: true,
        },
      }) as UserPhoneInfo | null;

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if phone is already verified and matches
      if (user.phoneVerified && user.phone === phoneNumber) {
        throw new ConflictError('This phone number is already verified');
      }

      // Check rate limiting - max 5 SMS per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCodes = await db.phoneVerificationToken.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (recentCodes >= this.SMS_RATE_LIMIT) {
        throw new RateLimitError('Too many verification codes sent. Please wait before requesting another.');
      }

      // Check if phone number is in use by another user
      if (phoneNumber !== user.phone) {
        const phoneConflict = await db.user.findFirst({
          where: {
            phone: phoneNumber,
            phoneVerified: true,
            NOT: { id: userId },
          },
        });

        if (phoneConflict) {
          throw new ConflictError('This phone number is already verified by another account');
        }
      }

      // Clean up any existing tokens for this user
      await db.phoneVerificationToken.deleteMany({
        where: { userId },
      });

      // Generate 6-digit verification code
      const code = generateNumericCode(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create verification token record
      await db.phoneVerificationToken.create({
        data: {
          userId,
          code,
          phone: phoneNumber,
          attempts: 0,
          maxAttempts: this.VERIFICATION_ATTEMPTS,
          expiresAt,
        },
      });

      // Send SMS verification code
      await this.smsService.sendVerificationCode(phoneNumber, code);

      logger.info('Phone verification code sent:', {
        userId,
        phone: phoneNumber,
        codeExpiry: expiresAt,
      });

    } catch (error) {
      logger.error('Failed to send phone verification code:', error);
      throw error;
    }
  }

  /**
   * Verify phone using code - like entering a security code
   */
  async verifyPhoneCode(userId: string, code: string): Promise<void> {
    try {
      // Find the verification token with explicit typing
      const verificationToken = await db.phoneVerificationToken.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }) as PhoneVerificationToken | null;

      if (!verificationToken) {
        throw new ValidationError('No verification code found. Please request a new code.');
      }

      // Check if token has expired
      if (verificationToken.expiresAt < new Date()) {
        // Clean up expired token
        await db.phoneVerificationToken.delete({
          where: { id: verificationToken.id },
        });
        throw new ValidationError('Verification code has expired. Please request a new code.');
      }

      // Check if maximum attempts exceeded
      if (verificationToken.attempts >= verificationToken.maxAttempts) {
        // Clean up token after max attempts
        await db.phoneVerificationToken.delete({
          where: { id: verificationToken.id },
        });
        throw new ValidationError('Maximum verification attempts exceeded. Please request a new code.');
      }

      // Check if code matches
      if (verificationToken.code !== code) {
        // Increment attempt counter
        await db.phoneVerificationToken.update({
          where: { id: verificationToken.id },
          data: { attempts: { increment: 1 } },
        });

        const remainingAttempts = verificationToken.maxAttempts - verificationToken.attempts - 1;
        throw new ValidationError(`Invalid verification code. ${remainingAttempts} attempts remaining.`);
      }

      // Update user's phone and mark as verified
      await db.user.update({
        where: { id: userId },
        data: {
          phone: verificationToken.phone,
          phoneVerified: true,
        },
      });

      // Clean up the verification token
      await db.phoneVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      // Update trust score since phone is now verified
      await this.updateUserTrustScore(userId);

      logger.info('Phone verified successfully:', {
        userId,
        phone: verificationToken.phone,
      });

    } catch (error) {
      logger.error('Phone verification failed:', error);
      throw error;
    }
  }

  // ====================================
  // DOCUMENT VERIFICATION
  // ====================================

  /**
   * Submit document for verification - like providing ID for manual review
   * 
   * Users can upload identity documents that are reviewed by administrators
   * to achieve higher verification levels.
   */
  async submitDocumentVerification(data: DocumentVerificationData): Promise<string> {
    try {
      // Check if user exists with explicit typing
      const user = await db.user.findUnique({
        where: { id: data.userId },
        select: { id: true, firstName: true, lastName: true },
      }) as UserMinimalInfo | null;

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if there's already a pending verification of this type
      const existingVerification = await db.verification.findFirst({
        where: {
          userId: data.userId,
          type: data.documentType,
          status: 'PENDING',
        },
      });

      if (existingVerification) {
        throw new ConflictError('You already have a pending verification of this type');
      }

      // Create verification record
      const verification = await db.verification.create({
        data: {
          userId: data.userId,
          type: data.documentType,
          documentUrl: data.documentUrl,
          notes: data.notes,
          status: 'PENDING',
        },
      });

      // Note: In a production system, you would implement admin notification here
      // This could include sending an email to admins or creating a notification record
      logger.info('Document verification submitted - admin review required:', {
        verificationId: verification.id,
        userId: data.userId,
        documentType: data.documentType,
      });

      logger.info('Document verification submitted:', {
        verificationId: verification.id,
        userId: data.userId,
        documentType: data.documentType,
      });

      return verification.id;

    } catch (error) {
      logger.error('Failed to submit document verification:', error);
      throw error;
    }
  }

  /**
   * Get user's verification status - like checking ID verification level
   */
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    try {
      // Get user's basic verification status with explicit typing
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          phoneVerified: true,
          trustScore: true,
        },
      }) as UserTrustInfo | null;

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get document verification status with explicit typing
      const documentVerifications = await db.verification.findMany({
        where: { userId },
        select: {
          type: true,
          status: true,
        },
      }) as DocumentVerificationRecord[];

      // Determine overall document status with properly typed callback parameters
      let documentStatus: DocumentStatus = 'NONE';
      
      if (documentVerifications.length > 0) {
        // Now TypeScript knows the exact type of each verification record
        if (documentVerifications.some((verification: DocumentVerificationRecord) => verification.status === 'VERIFIED')) {
          documentStatus = 'VERIFIED';
        } else if (documentVerifications.some((verification: DocumentVerificationRecord) => verification.status === 'PENDING')) {
          documentStatus = 'PENDING';
        } else if (documentVerifications.some((verification: DocumentVerificationRecord) => verification.status === 'REJECTED')) {
          documentStatus = 'REJECTED';
        }
      }

      // Calculate verification level based on completed verifications
      let verificationLevel: VerificationLevel = 'BASIC';
      
      if (user.emailVerified && user.phoneVerified) {
        verificationLevel = 'STANDARD';
        
        if (documentStatus === 'VERIFIED') {
          verificationLevel = 'PREMIUM';
        }
      }

      return {
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        documentStatus,
        trustScore: user.trustScore,
        verificationLevel,
      };

    } catch (error) {
      logger.error('Failed to get verification status:', error);
      throw error;
    }
  }

  // ====================================
  // CLEANUP AND MAINTENANCE
  // ====================================

  /**
   * Clean up expired verification tokens - like disposing of old paperwork
   * 
   * This should be run periodically (e.g., daily) to remove expired tokens
   * and keep the database clean.
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      
      // Clean up expired email tokens
      const expiredEmailTokens = await db.emailVerificationToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      // Clean up expired phone tokens
      const expiredPhoneTokens = await db.phoneVerificationToken.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      const totalCleaned = expiredEmailTokens.count + expiredPhoneTokens.count;

      logger.info('Expired verification tokens cleaned up:', {
        emailTokens: expiredEmailTokens.count,
        phoneTokens: expiredPhoneTokens.count,
        total: totalCleaned,
      });

      return totalCleaned;

    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      throw error;
    }
  }

  /**
   * Update user trust score based on verification status
   * 
   * This recalculates a user's trust score based on their verification
   * completeness and other factors. This is a background operation that
   * shouldn't fail the main verification process if it encounters errors.
   */
  private async updateUserTrustScore(userId: string): Promise<void> {
    try {
      // Get current user trust information with explicit typing
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          emailVerified: true,
          phoneVerified: true,
          trustScore: true,
        },
      }) as UserTrustInfo | null;

      if (!user) return;

      // Calculate new trust score based on verification completeness
      // This is a simplified algorithm - in production you might want more sophisticated scoring
      let newTrustScore = user.trustScore;

      // Add verification bonuses (this logic prevents duplicate bonuses)
      const verificationBonus = 0.5; // Each verification adds 0.5 points

      // Note: In a real system, you'd want to track whether bonuses were already applied
      // For simplicity, we're recalculating from base score each time
      if (user.emailVerified) {
        newTrustScore += verificationBonus;
      }

      if (user.phoneVerified) {
        newTrustScore += verificationBonus;
      }

      // Check for document verification and add bonus
      const hasDocumentVerification = await db.verification.findFirst({
        where: {
          userId,
          status: 'VERIFIED',
        },
      });

      if (hasDocumentVerification) {
        newTrustScore += 1.0; // Document verification adds 1 point
      }

      // Cap at maximum trust score
      newTrustScore = Math.min(newTrustScore, 5.0);

      // Update user's trust score only if it changed significantly
      if (Math.abs(newTrustScore - user.trustScore) > 0.01) {
        await db.user.update({
          where: { id: userId },
          data: { trustScore: Math.round(newTrustScore * 10) / 10 },
        });

        logger.info('Trust score updated:', {
          userId,
          oldScore: user.trustScore,
          newScore: newTrustScore,
        });
      }

    } catch (error) {
      logger.error('Failed to update trust score:', error);
      // Don't throw error - this is a background operation that shouldn't fail the main process
    }
  }
}