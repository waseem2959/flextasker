/**
 * Verification Routes
 * 
 * These routes handle all verification-related operations including:
 * - Email verification
 * - Phone verification
 * - Identity document verification
 * - Verification status checks
 */

import { verificationController } from '@/controllers/verification-controller';
import { authenticateToken } from '@/middleware/auth-middleware';
import { uploadVerification } from '@/middleware/upload-middleware';
import { validate } from '@/middleware/validation-middleware';
import { Router } from 'express';
import { body } from 'express-validator';

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
  verificationController.verifyPhoneCode
);

/**
 * Upload Identity Document
 * POST /api/v1/verification/identity/upload
 */
router.post('/identity/upload',
  authenticateToken,
  uploadVerification,
  validate([
    body('documentType')
      .optional()
      .isIn(['ID_DOCUMENT', 'ADDRESS_PROOF', 'BACKGROUND_CHECK'])
      .withMessage('Document type must be ID_DOCUMENT, ADDRESS_PROOF, or BACKGROUND_CHECK'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters')
  ]),
  verificationController.uploadIdentityDocument
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
  verificationController.requestManualVerification
);

export default router;
