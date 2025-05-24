import { db } from '@/utils/database';
import { AuthenticationError, AuthorizationError } from '@/utils/errors';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Define the shape of our JWT payload
// This tells TypeScript exactly what to expect when we decode a token
interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number; // Issued at timestamp (automatically added by JWT)
  exp?: number; // Expiration timestamp (if you're using expiration)
}

// Define the shape of authenticated user data
// This interface represents the user information we attach to requests
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

// Extend the Express Request type using module augmentation
// This is the modern way to add custom properties to Express types
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

/**
 * Authenticates a user based on their JWT token.
 * This middleware:
 * 1. Extracts the token from the Authorization header
 * 2. Verifies the token's validity
 * 3. Looks up the user in the database
 * 4. Attaches user info to the request object
 * 5. Updates the user's last active timestamp
 */
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from "Bearer <token>" format
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    // Verify and decode the token with proper typing
    // The 'as JWTPayload' is a type assertion, but it's safer than 'any'
    // because we're being specific about what we expect
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Now TypeScript knows that decoded.userId exists and is a string
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Attach user information to the request object
    // This makes user data available to subsequent middleware and route handlers
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    // Update last active timestamp to track user activity
    await db.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    next();
  } catch (error) {
    // Handle different types of JWT errors with specific messages
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid access token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Access token has expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware.
 * Attempts to authenticate if a token is present, but doesn't fail if absent.
 * Useful for routes that have different behavior for authenticated vs anonymous users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      // If token exists, try to authenticate
      await authenticateToken(req, res, next);
    } else {
      // No token? No problem - continue without authentication
      next();
    }
  } catch (error) {
    // If authentication fails, we still continue (since it's optional)
    // but we might want to log this for debugging
    if (error instanceof AuthenticationError) {
      // For optional auth, we don't throw - we just continue without user data
      next();
    } else {
      // Non-authentication errors should still be thrown
      next(error);
    }
  }
};

/**
 * Creates a middleware that requires specific roles.
 * This is a middleware factory - it returns a middleware function
 * configured with the roles you specify.
 * 
 * Usage: router.get('/admin', requireRole(['ADMIN']), adminController)
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware that ensures the user has verified their email.
 * Important for features that require confirmed user identity.
 */
export const requireEmailVerification = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Fetch the latest email verification status from the database
    // This ensures we have the most up-to-date information
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      throw new AuthorizationError('Email verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
};