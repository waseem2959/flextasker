/**
 * Verification Controller
 * 
 * Handles HTTP requests related to verification processes, delegating business logic
 * to the verification service and formatting responses.
 */

import { Request, Response } from 'express';
import { verificationService } from '../services/verification-service';
import { logger } from '../utils/logger';
import { BaseController } from './base-controller';

class VerificationController extends BaseController {
  /**
   * Send email verification to the user's email address
   */
  sendEmailVerification = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    logger.info('Sending email verification', { userId });
    await verificationService.sendEmailVerification(userId);
    
    return this.sendSuccess(res, null, 'Verification email sent successfully');
  });

  /**
   * Verify user's email with the provided token
   */
  verifyEmail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    logger.info('Verifying email address with token');
    const result = await verificationService.verifyEmail(token);
    
    return this.sendSuccess(res, result, 'Email verified successfully');
  });

  /**
   * Send verification code to the user's phone number
   */
  sendPhoneVerificationCode = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { phone } = req.body;

    if (!phone) {
      return this.sendError(res, 'Phone number is required', 400);
    }

    logger.info('Sending phone verification code', { userId, phone });
    await verificationService.sendPhoneVerificationCode(userId, phone);
    
    return this.sendSuccess(res, null, 'Verification code sent successfully');
  });

  /**
   * Verify user's phone number with the provided code
   */
  verifyPhoneCode = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code) {
      return this.sendError(res, 'Verification code is required', 400);
    }

    logger.info('Verifying phone number with code', { userId });
    await verificationService.verifyPhoneCode(userId, code);
    
    return this.sendSuccess(res, null, 'Phone number verified successfully');
  });

  /**
   * Get the user's current verification status
   */
  getVerificationStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    logger.info('Retrieving verification status', { userId });
    const status = await verificationService.getUserVerificationStatus(userId);
    
    return this.sendSuccess(res, status, 'Verification status retrieved successfully');
  });

  /**
   * Upload identity document for verification
   */
  uploadIdentityDocument = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { documentType = 'ID_DOCUMENT', notes } = req.body;

    if (!req.file) {
      return this.sendError(res, 'Document file is required', 400);
    }

    // Validate document type
    const validDocumentTypes = ['ID_DOCUMENT', 'ADDRESS_PROOF', 'BACKGROUND_CHECK'];
    if (!validDocumentTypes.includes(documentType)) {
      return this.sendError(res, 'Invalid document type', 400);
    }

    logger.info('Uploading identity document', { userId, documentType });

    const verificationId = await verificationService.submitDocumentVerification({
      userId,
      documentType: documentType as 'ID_DOCUMENT' | 'ADDRESS_PROOF' | 'BACKGROUND_CHECK',
      documentUrl: req.file.path,
      notes
    });
    
    return this.sendSuccess(res, { verificationId }, 'Document uploaded successfully and submitted for verification');
  });

  /**
   * Request manual verification review
   */
  requestManualVerification = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { reason } = req.body;

    if (!reason) {
      return this.sendError(res, 'Reason for manual verification is required', 400);
    }

    logger.info('Requesting manual verification', { userId });
    await verificationService.requestManualVerification(userId, reason);
    
    return this.sendSuccess(res, null, 'Manual verification request submitted successfully');
  });
}

// Export controller instance
export const verificationController = new VerificationController();
