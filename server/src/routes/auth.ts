import { authenticateToken } from '@/middleware/auth';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { validate } from '@/middleware/validation';
import { AuthService } from '@/services/auth';
import { sendSuccess } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
// Import the missing dependencies that were causing the TypeScript errors
import { db } from '@/utils/database';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Authentication routes - these are like the different windows at a government office
 * where you can register for services, show your ID, or request new documents.
 * 
 * Each route handles a specific authentication task and includes proper validation
 * and error handling to ensure security and user experience.
 */

const router = Router();
const authService = new AuthService();

/**
 * User Registration Route
 * POST /api/v1/auth/register
 * 
 * This is like the "New Account Application" window where people sign up
 * for our platform. We validate all their information carefully before
 * creating their account.
 */
router.post('/register', 
  authRateLimiter, // Prevent spam registrations
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
    
    body('phone')
      .optional()
      .matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in international format (+1234567890)'),
    
    body('role')
      .optional()
      .isIn(['USER', 'TASKER'])
      .withMessage('Role must be either USER or TASKER'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerUser(req.body);
      
      sendSuccess(res, result, 'Registration successful. Please check your email to verify your account.', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * User Login Route  
 * POST /api/v1/auth/login
 * 
 * This is like the "ID Check" window where existing users prove who they are
 * by providing their email and password.
 */
router.post('/login',
  authRateLimiter, // Prevent brute force attacks
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginUser(req.body);
      
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Email Verification Route
 * POST /api/v1/auth/verify-email
 * 
 * This is where users confirm their email address by clicking the link
 * we sent them, like confirming receipt of important mail.
 */
router.post('/verify-email',
  validate([
    body('token')
      .notEmpty()
      .withMessage('Verification token is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.verifyEmail(req.body.token);
      
      sendSuccess(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Resend Email Verification Route
 * POST /api/v1/auth/resend-verification
 * 
 * This allows users to request a new verification email if they lost
 * the first one, like asking for a duplicate copy of important mail.
 */
router.post('/resend-verification',
  authRateLimiter,
  authenticateToken, // User must be logged in
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user's current email from the authenticated user
      // Now we have proper access to 'db' because it's imported above
      const user = await db.user.findUnique({
        where: { id: req.user!.id },
        select: { email: true, emailVerified: true },
      });

      if (!user) {
        // Now we can use NotFoundError because it's properly imported
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        sendSuccess(res, null, 'Email is already verified');
        return;
      }

      await authService.sendEmailVerification(req.user!.id, user.email);
      
      sendSuccess(res, null, 'Verification email sent');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Password Reset Request Route
 * POST /api/v1/auth/forgot-password
 * 
 * This is where users who forgot their password can request a reset link,
 * like asking for help when you're locked out of your house.
 */
router.post('/forgot-password',
  authRateLimiter,
  validate([
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.sendPasswordResetEmail(req.body.email);
      
      // Always send success response for security (don't reveal if email exists)
      sendSuccess(res, null, 'If an account with that email exists, a password reset link has been sent');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Password Reset Confirmation Route
 * POST /api/v1/auth/reset-password
 * 
 * This is where users actually set their new password using the reset link,
 * like getting a new key made for your house.
 */
router.post('/reset-password',
  authRateLimiter,
  validate([
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      
      sendSuccess(res, null, 'Password reset successful. You can now login with your new password.');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Token Validation Route
 * GET /api/v1/auth/me
 * 
 * This allows the frontend to check if a user's token is still valid
 * and get current user information, like checking if your ID card is still valid.
 */
router.get('/me',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Now we have proper access to 'db' because it's imported above
      const user = await db.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          avatar: true,
          trustScore: true,
          createdAt: true,
        },
      });

      if (!user) {
        // Now we can use NotFoundError because it's properly imported
        throw new NotFoundError('User not found');
      }

      sendSuccess(res, { user }, 'User information retrieved');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Logout Route
 * POST /api/v1/auth/logout
 * 
 * While JWTs are stateless (we can't "revoke" them from the server side),
 * this endpoint allows the client to perform cleanup and provides a place
 * for future token blacklisting if needed.
 */
router.post('/logout',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a JWT-based system, logout is primarily handled on the client side
      // by removing the token from storage. However, we can log the logout
      // for security auditing purposes.
      
      // Now we can use logger because it's properly imported above
      logger.info('User logged out:', {
        userId: req.user!.id,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
);

export default router;