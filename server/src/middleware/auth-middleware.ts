/**
 * Authentication Middleware Module
 * 
 * This module provides a comprehensive implementation of all authentication
 * and authorization related middleware for the application.
 */

import { db } from '@/utils/database';
import { AuthenticationError, AuthorizationError } from '@/utils/error-utils';
import { NextFunction, Request, Response } from 'express';
// Use require for jsonwebtoken to avoid TypeScript issues
const jwt = require('jsonwebtoken');
import { UserRole } from '../../../shared/types/enums';
import { logger } from '@/utils/logger';

// ===== TYPE DEFINITIONS =====

/**
 * Define the shape of our JWT payload
 * This tells TypeScript exactly what to expect when we decode a token
 */
interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number; // Issued at timestamp (automatically added by JWT)
  exp?: number; // Expiration timestamp (if you're using expiration)
}

/**
 * Define the shape of authenticated user data
 * This interface represents the user information we attach to requests
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

/**
 * Extend the Express Request type using module augmentation
 * This is the modern way to add custom properties to Express types
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

// ===== AUTHENTICATION MIDDLEWARE =====

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as JWTPayload;
    
    // Get user from database
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
    
    logger.info('User authenticated', { userId: user.id });
    next();
  } catch (error) {
    // Handle different types of JWT errors with specific messages
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid access token'));
    } else if (error instanceof Error && error.name === 'TokenExpiredError') {
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
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as JWTPayload;
        
        // Get user from database
        const user = await db.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        });
        
        if (user?.isActive) {
          // Attach user information to the request object
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          };
          
          // Update last active timestamp
          await db.user.update({
            where: { id: user.id },
            data: { lastActive: new Date() },
          });
          
          logger.info('Optional auth: User authenticated', { userId: user.id });
        }
      } catch (tokenError: unknown) {
        // Just log the error but don't throw
        const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
        logger.info('Optional auth: Token validation failed', { error: errorMessage });
      }
    }
    
    // Always continue to the next middleware
    next();
  } catch (error) {
    // If any unexpected error occurs, pass it along
    next(error);
  }
};

// ===== AUTHORIZATION MIDDLEWARE =====

/**
 * Creates a middleware that requires specific roles.
 * This is a middleware factory - it returns a middleware function
 * configured with the roles you specify.
 * 
 * Usage: router.get('/admin', requireRoles(['ADMIN']), adminController)
 */
export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const hasRequiredRole = roles.some(role => req.user!.role === role);
    
    if (!hasRequiredRole) {
      return next(new AuthorizationError('Insufficient permissions'));
    }
    
    logger.info('Role authorization successful', { 
      userId: req.user.id, 
      userRole: req.user.role,
      requiredRoles: roles 
    });
    
    next();
  };
};

/**
 * Legacy version of requireRoles for backward compatibility
 * @deprecated Use requireRoles instead
 */
export const requireRole = (roles: string[]) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('DEPRECATION NOTICE: requireRole is deprecated. Use requireRoles instead.');
  }
  
  return requireRoles(roles as UserRole[]);
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
    
    // Get the latest user data to check email verification status
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (!user.emailVerified) {
      throw new AuthorizationError(
        'Email verification required. Please verify your email before accessing this resource.'
      );
    }
    
    logger.info('Email verification check passed', { userId: req.user.id });
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies that the authenticated user is the owner of the requested resource
 * @param paramIdField - The request parameter that contains the resource owner ID
 */
export const authorizeOwner = (paramIdField: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    const ownerId = req.params[paramIdField];
    
    if (!ownerId) {
      return next(new AuthorizationError(`Missing required parameter: ${paramIdField}`));
    }
    
    if (req.user.id !== ownerId && req.user.role !== UserRole.ADMIN) {
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    
    logger.info('Owner authorization successful', { 
      userId: req.user.id,
      resourceOwnerId: ownerId
    });
    
    next();
  };
};
