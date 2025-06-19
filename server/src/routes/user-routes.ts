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

import { userController } from '../controllers/user-controller';
import { authenticateToken, optionalAuth } from '../middleware/auth-middleware';
import { uploadAvatar } from '../middleware/upload-middleware';
import { validateRequest } from '../middleware/zod-validation-middleware';
import { userValidationConfigs } from '../validation/user-validation';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Additional validation schemas not in user-validation
const getUserStatsSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  })
};

const verifyEmailSchema = {
  params: z.object({
    token: z.string().min(1, 'Token is required')
  })
};

const requestPasswordResetSchema = {
  body: z.object({
    email: z.string().email('Valid email is required')
  })
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password must be less than 100 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must include uppercase, lowercase, number and special character')
  })
};

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
  validateRequest(userValidationConfigs.getUserById),
  userController.getUserById
);

/**
 * Update User Profile
 * PUT /api/v1/users/me
 */
router.put('/me',
  authenticateToken,
  validateRequest(userValidationConfigs.updateProfile),
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
  validateRequest(userValidationConfigs.changePassword),
  userController.updatePassword
);

/**
 * Delete User Account
 * DELETE /api/v1/users/me
 */
router.delete('/me',
  authenticateToken,
  validateRequest(userValidationConfigs.deactivateAccount),
  userController.deleteUser
);

/**
 * Search Users
 * GET /api/v1/users/search
 */
router.get('/search', 
  optionalAuth,
  validateRequest(userValidationConfigs.searchUsers),
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
  validateRequest(getUserStatsSchema),
  userController.getUserStats
);

/**
 * Verify Email
 * GET /api/v1/users/verify-email/:token
 */
router.get('/verify-email/:token',
  validateRequest(verifyEmailSchema),
  userController.verifyEmail
);

/**
 * Request Password Reset
 * POST /api/v1/users/request-password-reset
 */
router.post('/request-password-reset',
  validateRequest(requestPasswordResetSchema),
  userController.requestPasswordReset
);

/**
 * Reset Password
 * POST /api/v1/users/reset-password
 */
router.post('/reset-password',
  validateRequest(resetPasswordSchema),
  userController.resetPassword
);

export default router;
