/**
 * Verification Routes
 * 
 * These routes handle all verification-related operations including:
 * - Email verification
 * - Phone verification
 * - Identity document verification
 * - Verification status checks
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '@/middleware/auth-middleware';
import { uploadVerification } from '@/middleware/upload-middleware';
import { validate } from '@/middleware/validation-middleware';
import { verificationController } from '@/controllers/verification-controller';

const router = Router();

/**
 * Send Email Verification
 * POST /api/v1/verification/email/send
 */
router.post('/email/send',
  authenticateToken,
  verificationController.sendEmailVerification
);

/**
 * Verify Email Address
 * POST /api/v1/verification/email/verify
 */
router.post('/email/verify',
  validate([
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ]),
  verificationController.verifyEmail
);

/**
 * Send Phone Verification Code
 * POST /api/v1/verification/phone/send
 */
router.post('/phone/send',
  authenticateToken,
  validate([
    body('phone')
      .matches(/^\+?\d{10,15}$/)
      .withMessage('Please provide a valid phone number (10-15 digits, + prefix optional)')
  ]),
  verificationController.sendPhoneVerificationCode
);

/**
 * Verify Phone Number
 * POST /api/v1/verification/phone/verify
 */
router.post('/phone/verify',
  authenticateToken,
  validate([
    body('code')
      .notEmpty()
      .withMessage('Verification code is required')
  ]),
  (_req: Request, res: Response): void => {
    res.status(501).json({ success: false, message: 'Phone verification not implemented yet' });
  }
);

/**
 * Upload Identity Document
 * POST /api/v1/verification/identity/upload
 */
// TODO: Implement uploadIdentityDocument in verification controller
router.post('/identity/upload',
  authenticateToken,
  (req: Request, res: Response): void => {
    uploadVerification(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      res.status(501).json({ success: false, message: 'Identity document upload not implemented yet' });
    });
  }
);

/**
 * Get Verification Status
 * GET /api/v1/verification/status
 */
router.get('/status',
  authenticateToken,
  verificationController.getVerificationStatus
);

/**
 * Request Manual Verification
 * POST /api/v1/verification/request-manual
 */
router.post('/request-manual',
  authenticateToken,
  validate([
    body('reason')
      .isString()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters'),
  ]),
  // TODO: Implement requestManualVerification in verification controller
  (_req: Request, res: Response): void => {
    res.status(501).json({ success: false, message: 'Manual verification request not implemented yet' });
  }
);

export default router;
