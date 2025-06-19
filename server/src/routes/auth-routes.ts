/**
 * Authentication Routes
 * 
 * These routes handle all authentication-related operations including:
 * - User registration and login
 * - Password management
 * - Token refresh and validation
 * - Account verification
 */

import { Router } from 'express';
import { authRateLimiter } from '../middleware/rate-limiter-middleware';
import { authenticateToken } from '../middleware/auth-middleware';
import { validateRequest } from '../middleware/zod-validation-middleware';
import { authValidationConfigs } from '../validation/auth-validation';
import { authController } from '../controllers/auth-controller';

const router = Router();

/**
 * User Registration
 * POST /api/v1/auth/register
 */
router.post('/register', 
  authRateLimiter,
  validateRequest(authValidationConfigs.register),
  authController.register
);

/**
 * User Login
 * POST /api/v1/auth/login
 */
router.post('/login',
  authRateLimiter,
  validateRequest(authValidationConfigs.login),
  authController.login
);

/**
 * Refresh Token
 * POST /api/v1/auth/refresh-token
 */
router.post('/refresh-token',
  validateRequest(authValidationConfigs.refreshToken),
  authController.refreshToken
);

/**
 * Logout
 * POST /api/v1/auth/logout
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * Forgot Password
 * POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password',
  authRateLimiter,
  validateRequest(authValidationConfigs.forgotPassword),
  authController.forgotPassword
);

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password',
  validateRequest(authValidationConfigs.resetPassword),
  authController.resetPassword
);

/**
 * Change Password
 * POST /api/v1/auth/change-password
 */
router.post('/change-password',
  authenticateToken,
  validateRequest(authValidationConfigs.changePassword),
  authController.changePassword
);

/**
 * Verify Email
 * GET /api/v1/auth/verify-email/:token
 */
router.get('/verify-email/:token',
  authController.verifyEmail
);

/**
 * Resend Verification Email
 * POST /api/v1/auth/resend-verification
 */
router.post('/resend-verification',
  authRateLimiter,
  authenticateToken,
  authController.resendVerification
);

/**
 * Check Auth Status
 * GET /api/v1/auth/status
 */
router.get('/status',
  authenticateToken,
  authController.checkAuthStatus
);

export default router;
