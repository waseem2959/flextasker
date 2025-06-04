/**
 * User Routes
 * 
 * These routes handle all user-related operations including:
 * - User profile management
 * - User search and discovery
 * - Account settings and preferences
 * - Password management
 * - Profile verification
 */

import { userController } from '@/controllers/user-controller';
import { authenticateToken, optionalAuth } from '@/middleware/auth-middleware';
import { uploadAvatar } from '@/middleware/upload-middleware';
import { validate } from '@/middleware/validation-middleware';
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserRole } from '../../../shared/types/enums';

const router = Router();

/**
 * Get Current User Profile
 * GET /api/v1/users/me
 */
router.get('/me', authenticateToken, userController.getMyProfile);

/**
 * Get User Profile by ID
 * GET /api/v1/users/:id
 */
router.get('/:id', 
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Invalid user ID format')
  ]),
  userController.getUserById
);

/**
 * Update User Profile
 * PUT /api/v1/users/me
 */
router.put('/me',
  authenticateToken,
  validate([
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('bio').optional().isString().trim().isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('phone').optional().matches(/^\+?\d{10,15}$/)
      .withMessage('Phone number must be valid (10-15 digits, may include + prefix)'),
    body('location').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters')
  ]),
  userController.updateUser
);

/**
 * Update User Avatar
 * PUT /api/v1/users/me/avatar
 */
router.put('/me/avatar',
  authenticateToken,
  uploadAvatar,
  userController.updateAvatar
);

/**
 * Change User Password
 * PUT /api/v1/users/me/password
 */
router.put('/me/password',
  authenticateToken,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8, max: 100 })
      .withMessage('New password must be between 8 and 100 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must include uppercase, lowercase, number and special character')
  ]),
  userController.updatePassword
);

/**
 * Delete User Account
 * DELETE /api/v1/users/me
 */
router.delete('/me',
  authenticateToken,
  validate([
    body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
  ]),
  userController.deleteUser
);

/**
 * Search Users
 * GET /api/v1/users/search
 */
router.get('/search', 
  optionalAuth,
  validate([
    query('query').optional().isString().trim(),
    query('role').optional().isIn(Object.values(UserRole)),
    query('location').optional().isString().trim(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ]),
  userController.searchUsers
);

/**
 * Get Current User Statistics
 * GET /api/v1/users/me/stats
 */
router.get('/me/stats',
  authenticateToken,
  userController.getMyStats
);

/**
 * Get User Statistics
 * GET /api/v1/users/:id/stats
 */
router.get('/:id/stats',
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Invalid user ID format')
  ]),
  userController.getUserStats
);

/**
 * Verify Email
 * GET /api/v1/users/verify-email/:token
 */
router.get('/verify-email/:token',
  validate([
    param('token').isString().notEmpty().withMessage('Token is required')
  ]),
  userController.verifyEmail
);

/**
 * Request Password Reset
 * POST /api/v1/users/request-password-reset
 */
router.post('/request-password-reset',
  validate([
    body('email').isEmail().withMessage('Valid email is required')
  ]),
  userController.requestPasswordReset
);

/**
 * Reset Password
 * POST /api/v1/users/reset-password
 */
router.post('/reset-password',
  validate([
    body('token').isString().notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8, max: 100 })
      .withMessage('New password must be between 8 and 100 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must include uppercase, lowercase, number and special character')
  ]),
  userController.resetPassword
);

export default router;
