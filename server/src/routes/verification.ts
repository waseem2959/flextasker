import { authenticateToken } from '@/middleware/auth';
import { uploadVerification } from '@/middleware/upload';
import { validate } from '@/middleware/validation';
import { VerificationService } from '@/services/verification';
import { sendSuccess } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { ValidationError } from '../utils/errors';

/**
 * Verification routes - these are like different service windows at an
 * identity verification center where users can verify their email, phone,
 * and submit documents for identity confirmation.
 */

const router = Router();
const verificationService = new VerificationService();

/**
 * Send Email Verification
 * POST /api/v1/verification/email/send
 * 
 * This is like requesting a confirmation letter - sends a verification
 * email to the user's registered email address.
 */
router.post('/email/send',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verificationService.sendEmailVerification(req.user!.id);
      
      sendSuccess(res, null, 'Verification email sent successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Verify Email Address
 * POST /api/v1/verification/email/verify
 * 
 * This is like confirming receipt of a letter using the provided code.
 */
router.post('/email/verify',
  validate([
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verificationService.verifyEmail(req.body.token);
      
      sendSuccess(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Send Phone Verification Code
 * POST /api/v1/verification/phone/send
 * 
 * This is like requesting a security code via SMS - sends a numeric
 * verification code to the specified phone number.
 */
router.post('/phone/send',
  authenticateToken,
  validate([
    body('phoneNumber')
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in international format (+1234567890)'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verificationService.sendPhoneVerificationCode(req.user!.id, req.body.phoneNumber);
      
      sendSuccess(res, null, 'Verification code sent successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Verify Phone Number
 * POST /api/v1/verification/phone/verify
 * 
 * This is like entering a security code received via SMS to confirm
 * ownership of the phone number.
 */
router.post('/phone/verify',
  authenticateToken,
  validate([
    body('code')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Verification code must be a 6-digit number'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verificationService.verifyPhoneCode(req.user!.id, req.body.code);
      
      sendSuccess(res, null, 'Phone number verified successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Submit Document Verification
 * POST /api/v1/verification/document
 * 
 * This is like submitting an ID for manual review - users upload identity
 * documents that administrators will verify.
 */
router.post('/document',
  authenticateToken,
  uploadVerification, // Handle file upload
  validate([
    body('documentType')
      .isIn(['ID_DOCUMENT', 'ADDRESS_PROOF', 'BACKGROUND_CHECK'])
      .withMessage('Document type must be ID_DOCUMENT, ADDRESS_PROOF, or BACKGROUND_CHECK'),
    
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError('Document file is required');
      }

      const documentUrl = `/uploads/verification/${req.file.filename}`;
      
      const verificationId = await verificationService.submitDocumentVerification({
        userId: req.user!.id,
        documentType: req.body.documentType,
        documentUrl,
        notes: req.body.notes,
      });
      
      sendSuccess(res, { verificationId }, 'Document submitted for verification', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Verification Status
 * GET /api/v1/verification/status
 * 
 * This is like checking your verification level - shows what types of
 * verification have been completed and the current trust level.
 */
router.get('/status',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await verificationService.getUserVerificationStatus(req.user!.id);
      
      sendSuccess(res, status, 'Verification status retrieved');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get User Verification Status (Public)
 * GET /api/v1/verification/user/:userId/status
 * 
 * This allows other users to check someone's verification level when
 * considering working with them (shows public verification info only).
 */
router.get('/user/:userId/status',
  validate([
    param('userId')
      .notEmpty()
      .withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await verificationService.getUserVerificationStatus(req.params.userId);
      
      // Only return public verification information
      const publicStatus = {
        emailVerified: status.emailVerified,
        phoneVerified: status.phoneVerified,
        verificationLevel: status.verificationLevel,
        trustScore: status.trustScore,
      };
      
      sendSuccess(res, publicStatus, 'Public verification status retrieved');
    } catch (error) {
      next(error);
    }
  }
);

export default router;