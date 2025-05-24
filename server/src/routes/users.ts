import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { uploadAvatar } from '@/middleware/upload';
import { validate } from '@/middleware/validation';
import { UserService } from '@/services/user';
import { sendSuccess } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';

// Import the missing dependencies
import {
  AuthenticationError,
  comparePassword,
  db,
  NotFoundError,
  ValidationError
} from '@/utils';

/**
 * User routes - these are like different service windows in a customer service center
 * where users can update their information, search for other users, and manage
 * their account settings.
 * 
 * Each route is carefully designed with proper validation and security measures
 * to ensure users can only access and modify data they're authorized to handle.
 */

const router = Router();
const userService = new UserService();

/**
 * Get Current User Profile
 * GET /api/v1/users/me
 * 
 * This is like looking up your own customer file - it returns detailed
 * information about the authenticated user's account.
 */
router.get('/me',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.getUserProfile(req.user!.id, req.user!.id);
      
      sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get User Profile by ID
 * GET /api/v1/users/:id
 * 
 * This is like looking up another customer's public information - it shows
 * what other users can see about someone's profile.
 */
router.get('/:id',
  optionalAuth, // Authentication is optional - public profiles can be viewed
  validate([
    param('id')
      .isLength({ min: 1 })
      .withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.getUserProfile(req.params.id, req.user?.id);
      
      sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update User Profile
 * PUT /api/v1/users/me
 * 
 * This is like filling out a form to update your customer information.
 * Users can modify their personal details while we ensure data integrity.
 */
router.put('/me',
  authenticateToken,
  validate([
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be 1-50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be 1-50 characters'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    
    body('phone')
      .optional()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in international format'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must be less than 200 characters'),
    
    body('city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    
    body('state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be less than 100 characters'),
    
    body('country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country must be less than 100 characters'),
    
    body('zipCode')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Zip code must be less than 20 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedProfile = await userService.updateProfile(req.user!.id, req.body);
      
      sendSuccess(res, updatedProfile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Change Password
 * PUT /api/v1/users/me/password
 * 
 * This is like requesting a new key - users must prove they have the current
 * key (password) before we give them a new one.
 */
router.put('/me/password',
  authenticateToken,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.changePassword(req.user!.id, req.body);
      
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Upload Profile Avatar
 * POST /api/v1/users/me/avatar
 * 
 * This is like updating your photo ID - users can upload a new profile picture
 * that will be displayed across the platform.
 */
router.post('/me/avatar',
  authenticateToken,
  uploadAvatar, // Multer middleware handles file upload
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ValidationError('Avatar image is required');
      }

      // Create the URL for the uploaded file
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      await userService.updateAvatar(req.user!.id, avatarUrl);
      
      sendSuccess(res, { avatarUrl }, 'Avatar updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Search Users
 * GET /api/v1/users/search
 * 
 * This is like using a business directory - users can search for other users
 * based on location, role, trust score, and other criteria.
 */
router.get('/search',
  optionalAuth,
  validate([
    query('role')
      .optional()
      .isIn(['USER', 'TASKER'])
      .withMessage('Role must be USER or TASKER'),
    
    query('city')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be 1-100 characters'),
    
    query('state')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('State must be 1-100 characters'),
    
    query('country')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Country must be 1-100 characters'),
    
    query('minTrustScore')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum trust score must be between 0 and 5'),
    
    query('hasProfileImage')
      .optional()
      .isBoolean()
      .withMessage('hasProfileImage must be a boolean'),
    
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create a properly typed filters object instead of using 'any'
      const filters = {
        role: req.query.role as 'USER' | 'TASKER' | undefined,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
        minTrustScore: req.query.minTrustScore ? parseFloat(req.query.minTrustScore as string) : undefined,
        hasProfileImage: req.query.hasProfileImage === 'true',
        isVerified: req.query.isVerified === 'true',
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.searchUsers(filters, page, limit);
      
      sendSuccess(res, result, 'User search completed');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get User Statistics
 * GET /api/v1/users/me/stats
 * 
 * This is like generating a customer account summary - it provides overview
 * statistics about a user's activity, earnings, and reputation on the platform.
 */
router.get('/me/stats',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await userService.getUserStats(req.user!.id);
      
      sendSuccess(res, stats, 'User statistics retrieved');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Deactivate Account
 * DELETE /api/v1/users/me
 * 
 * This is like closing a customer account - it deactivates the user's account
 * while preserving transaction history for business records.
 */
router.delete('/me',
  authenticateToken,
  validate([
    body('confirmPassword')
      .notEmpty()
      .withMessage('Password confirmation is required to deactivate account'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First verify the user's password for security
      const user = await db.user.findUnique({
        where: { id: req.user!.id },
        select: { password: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isPasswordValid = await comparePassword(req.body.confirmPassword, user.password);
      
      if (!isPasswordValid) {
        throw new AuthenticationError('Password confirmation is incorrect');
      }

      await userService.deactivateAccount(req.user!.id);
      
      sendSuccess(res, null, 'Account deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;