/**
 * Verification Service
 * 
 * This service handles all verification-related operations including:
 * - Email verification
 * - Phone verification
 * - Identity document verification
 * - Trust score calculation
 */

import { generateNumericCode, generateToken } from '../utils/crypto';
import { db } from '../utils/database';
import { ConflictError, NotFoundError, RateLimitError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { EmailService } from './email-service';
import { SMSService } from './sms-service';

// Define document status type
type DocumentStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

// Define verification level type
export type VerificationLevel = 'BASIC' | 'STANDARD' | 'PREMIUM';

// This type represents the status of individual document verification records in the database
export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// Re-export for use in other files
export interface DocumentVerificationData {
  userId: string;
  documentType: string;
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

/**
 * Verification Service Class
 * 
 * Handles user verification processes including email, phone, and document verification.
 * Manages verification tokens, rate limiting, and trust score calculations.
 */
export class VerificationService {
  private readonly emailService: EmailService;
  private readonly smsService: SMSService;
  private readonly EMAIL_RATE_LIMIT = 3; // Max email verifications per day
  private readonly SMS_RATE_LIMIT = 5; // Max SMS verifications per day
  private readonly VERIFICATION_ATTEMPTS = 3; // Max attempts per verification code

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  /**
   * Send email verification
   * 
   * Creates a secure token and sends it to the user's email address.
   * Implements rate limiting to prevent abuse.
   */
  async sendEmailVerification(userId: string): Promise<void> {
    logger.info('Sending email verification', { userId });

    try {
      // Get user information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          emailVerified: true
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        throw new ConflictError('Email is already verified');
      }

      // Check rate limiting (max 3 verification emails per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recentVerifications = await db.emailVerification.count({
        where: {
          userId,
          createdAt: {
            gte: today
          }
        }
      });

      if (recentVerifications >= this.EMAIL_RATE_LIMIT) {
        throw new RateLimitError(`Maximum of ${this.EMAIL_RATE_LIMIT} verification emails per day`);
      }

      // Generate verification token
      const token = generateToken(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      // Save verification token
      await db.emailVerification.create({
        data: {
          userId,
          token,
          email: user.email,
          expiresAt
        }
      });

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, token);

      logger.info('Email verification sent', { userId, email: user.email });
    } catch (error) {
      logger.error('Error sending email verification', { error, userId });
      throw error;
    }
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<void> {
    logger.info('Verifying email with token');

    try {
      // Find verification record
      const verification = await db.emailVerification.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true
            }
          }
        }
      });

      if (!verification) {
        throw new ValidationError('Invalid or expired verification token');
      }

      // Update user's email verification status
      await db.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true }
      });

      // Delete the verification token
      await db.emailVerification.delete({
        where: { id: verification.id }
      });

      // Update user's trust score
      await this.updateUserTrustScore(verification.userId);

      logger.info('Email verified successfully', {
        userId: verification.userId,
        email: verification.email
      });
    } catch (error) {
      logger.error('Error verifying email', { error, token });
      throw error;
    }
  }

  /**
   * Send phone verification code
   * 
   * Generates a numeric code and sends it via SMS with rate limiting
   * and attempt tracking to prevent abuse.
   */
  async sendPhoneVerificationCode(userId: string, phoneNumber: string): Promise<void> {
    logger.info('Sending phone verification code', { userId, phoneNumber });

    try {
      // Validate phone number format
      if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
        throw new ValidationError('Invalid phone number format');
      }

      // Get user information
      const user = await db.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.phoneVerified) {
        throw new ConflictError('Phone number is already verified');
      }

      // Check rate limiting (max 5 SMS verifications per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recentVerifications = await db.phoneVerification.count({
        where: {
          userId,
          createdAt: {
            gte: today
          }
        }
      });

      if (recentVerifications >= this.SMS_RATE_LIMIT) {
        throw new RateLimitError(`Maximum of ${this.SMS_RATE_LIMIT} SMS verifications per day`);
      }

      // Generate verification code (6 digits)
      const code = generateNumericCode(6);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute expiration

      // Save verification code
      await db.phoneVerification.create({
        data: {
          userId,
          code,
          phone: phoneNumber,
          attempts: 0,
          maxAttempts: this.VERIFICATION_ATTEMPTS,
          expiresAt
        }
      });

      // Send verification SMS
      await this.smsService.sendVerificationSMS(phoneNumber, code);

      logger.info('Phone verification code sent', { userId, phoneNumber });
    } catch (error) {
      logger.error('Error sending phone verification', { error, userId, phoneNumber });
      throw error;
    }
  }

  /**
   * Verify phone using code
   */
  async verifyPhoneCode(userId: string, code: string): Promise<void> {
    logger.info('Verifying phone code', { userId });

    try {
      // Find verification record
      const verification = await db.phoneVerification.findFirst({
        where: {
          userId,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!verification) {
        throw new ValidationError('No active verification code found');
      }

      // Check if max attempts exceeded
      if (verification.attempts >= verification.maxAttempts) {
        // Delete the verification record
        await db.phoneVerification.delete({
          where: { id: verification.id }
        });

        throw new ValidationError('Maximum verification attempts exceeded. Please request a new code.');
      }

      // Check if code matches
      if (verification.code !== code) {
        // Increment attempts
        await db.phoneVerification.update({
          where: { id: verification.id },
          data: { attempts: { increment: 1 } }
        });

        throw new ValidationError('Invalid verification code');
      }

      // Update user's phone and verification status
      await db.user.update({
        where: { id: userId },
        data: {
          phone: verification.phone,
          phoneVerified: true
        }
      });

      // Delete the verification record
      await db.phoneVerification.delete({
        where: { id: verification.id }
      });

      // Update user's trust score
      await this.updateUserTrustScore(userId);

      logger.info('Phone verified successfully', { userId, phone: verification.phone });
    } catch (error) {
      logger.error('Error verifying phone', { error, userId });
      throw error;
    }
  }

  /**
   * Submit document for verification
   * 
   * Users can upload identity documents that are reviewed by administrators
   * to achieve higher verification levels.
   */
  async submitDocumentVerification(data: DocumentVerificationData): Promise<string> {
    logger.info('Submitting document for verification', {
      userId: data.userId,
      documentType: data.documentType
    });

    try {
      // Get user information
      const user = await db.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if there's already a pending verification for this document type
      const doc = await db.documentVerification.findFirst({
        where: { userId: data.userId, type: data.documentType },
        orderBy: { submittedAt: 'desc' },
      });

      if (doc?.status === 'PENDING') {
        throw new ConflictError(`A ${data.documentType} verification is already pending`);
      }

      // Create document verification record
      const verification = await db.documentVerification.create({
        data: {
          userId: data.userId,
          type: data.documentType,
          documentUrl: data.documentUrl,
          notes: data.notes,
          status: 'PENDING',
          submittedAt: new Date()
        }
      });

      logger.info('Document verification submitted', {
        userId: data.userId,
        documentType: data.documentType,
        verificationId: verification.id
      });

      return verification.id;
    } catch (error) {
      logger.error('Error submitting document verification', {
        error,
        userId: data.userId,
        documentType: data.documentType
      });
      throw error;
    }
  }

  /**
   * Request manual verification review
   * 
   * Users can request manual review when automated verification fails
   * or for special circumstances.
   */
  async requestManualVerification(userId: string, reason: string): Promise<void> {
    logger.info('Requesting manual verification', { userId });

    try {
      // Get user information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if there's already a pending manual verification request
      const existingRequest = await db.manualVerificationRequest.findFirst({
        where: {
          userId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        throw new ConflictError('A manual verification request is already pending');
      }

      // Create manual verification request
      await db.manualVerificationRequest.create({
        data: {
          userId,
          reason,
          status: 'PENDING',
          submittedAt: new Date()
        }
      });

      logger.info('Manual verification request created', { userId });
    } catch (error) {
      logger.error('Error requesting manual verification', { error, userId });
      throw error;
    }
  }

  /**
   * Get user's verification status
   */
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    logger.info('Getting user verification status', { userId });

    try {
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Get user information
      const user = await DatabaseQueryBuilder.findById(
        models.user,
        userId,
        'User',
        {
          id: true,
          emailVerified: true,
          phoneVerified: true,
          trustScore: true
        }
      );

      // Get document verifications
      const { items: documentVerifications } = await DatabaseQueryBuilder.findMany(
        models.documentVerification,
        {
          where: { userId },
          select: {
            type: true,
            status: true
          }
        },
        'DocumentVerification'
      );

      // Determine document status
      let documentStatus: DocumentStatus = 'NONE';
      
      if (documentVerifications.length > 0) {
        const hasVerified = documentVerifications.some(
          (doc: any) => doc.status === 'VERIFIED'
        );
        const hasPending = documentVerifications.some(
          (doc: any) => doc.status === 'PENDING'
        );
        
        if (hasVerified) {
          documentStatus = 'VERIFIED';
        } else if (hasPending) {
          documentStatus = 'PENDING';
        } else {
          documentStatus = 'REJECTED';
        }
      }

      // Determine verification level
      let verificationLevel: VerificationLevel = 'BASIC';
      
      if ((user as any).emailVerified && (user as any).phoneVerified && documentStatus === 'VERIFIED') {
        verificationLevel = 'PREMIUM';
      } else if ((user as any).emailVerified && (user as any).phoneVerified) {
        verificationLevel = 'STANDARD';
      }

      return {
        emailVerified: (user as any).emailVerified,
        phoneVerified: (user as any).phoneVerified,
        documentStatus,
        trustScore: (user as any).trustScore ?? 0,
        verificationLevel
      };
    } catch (error) {
      logger.error('Error getting user verification status', { error, userId });
      throw error;
    }
  }

  /**
   * Clean up expired verification tokens
   * 
   * This should be run periodically (e.g., daily) to remove expired tokens
   * and keep the database clean.
   */
  async cleanupExpiredTokens(): Promise<number> {
    logger.info('Cleaning up expired verification tokens');

    try {
      const now = new Date();

      // Delete expired email verifications
      const expiredEmails = await db.emailVerification.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      // Delete expired phone verifications
      const expiredPhones = await db.phoneVerification.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      const totalDeleted = expiredEmails.count + expiredPhones.count;
      logger.info('Expired verification tokens cleaned up', {
        emailTokens: expiredEmails.count,
        phoneTokens: expiredPhones.count,
        total: totalDeleted
      });

      return totalDeleted;
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error });
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
  async updateUserTrustScore(userId: string): Promise<void> {
    try {
      // Get user verification information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          emailVerified: true,
          phoneVerified: true,
          trustScore: true
        }
      });

      if (!user) {
        logger.warn('User not found for trust score update', { userId });
        return;
      }

      // Get document verifications
      const documentVerifications = await db.documentVerification.findMany({
        where: { userId },
        select: {
          type: true,
          status: true
        }
      });

      // Calculate base trust score (0-100)
      let trustScore = 0;

      // Email verification: +20 points
      if (user.emailVerified) {
        trustScore += 20;
      }

      // Phone verification: +20 points
      if (user.phoneVerified) {
        trustScore += 20;
      }

      // Document verification: up to +40 points
      const verifiedDocuments = documentVerifications.filter(
        (doc: { status: string }) => doc.status === 'VERIFIED'
      );
      const documentScore = Math.min(40, verifiedDocuments.length * 20);
      trustScore += documentScore;

      // Get user activity factors (completed tasks, ratings, etc.)
      // This would be more complex in a real implementation
      const completedTasks = await db.task.count({
        where: {
          assigneeId: userId,
          status: 'COMPLETED'
        }
      });

      // Activity bonus: up to +20 points
      const activityScore = Math.min(20, completedTasks * 2);
      trustScore += activityScore;

      // Update user's trust score
      await db.user.update({
        where: { id: userId },
        data: { trustScore }
      });

      logger.info('User trust score updated', { userId, trustScore });
    } catch (error) {
      // Log error but don't throw to prevent verification process failure
      logger.error('Error updating user trust score', { error, userId });
    }
  }
}

// Export singleton instance
export const verificationService = new VerificationService();
