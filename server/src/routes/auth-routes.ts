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
import { body } from 'express-validator';
import { authRateLimiter } from '../middleware/rate-limiter-middleware';
import { authenticateToken } from '../middleware/auth-middleware';
import { validate } from '../middleware/validation-middleware';
import { authController } from '@/controllers/auth-controller';

const router = Router();

/**
 * User Registration
 * POST /api/v1/auth/register
 */
router.post('/register', 
  authRateLimiter,
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    
    body('role')
      .optional()
      .isIn(['USER', 'TASKER'])
      .withMessage('Role must be either USER or TASKER')
  ]),
  authController.register
);

/**
 * User Login
 * POST /api/v1/auth/login
 */
router.post('/login',
  authRateLimiter,
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]),
  authController.login
);

/**
 * Refresh Token
 * POST /api/v1/auth/refresh-token
 */
router.post('/refresh-token',
  validate([
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ]),
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
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ]),
  authController.forgotPassword
);

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password',
  validate([
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ]),
  authController.resetPassword
);

/**
 * Change Password
 * POST /api/v1/auth/change-password
 */
router.post('/change-password',
  authenticateToken,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ]),
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
