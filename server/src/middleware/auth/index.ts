/**
 * Authentication Middleware Module
 * 
 * This module exports all authentication and authorization related middleware.
 * It centralizes authentication logic for better organization and reusability.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../../utils/enhanced-errors';
import { UserRole } from '../../../../shared/types/enums';
import { logger } from '@/utils/logger';

/**
 * Verifies that a valid JWT token is present in the request
 * and attaches the decoded user to the request object
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }
    
    // This is a placeholder for token verification logic
    // In a real implementation, you would verify the token using JWT
    // and retrieve the user data from the token payload
    
    // For demonstration purposes, assuming a successful verification:
    req.user = {
      id: 'user-id-from-token',
      role: UserRole.USER
    };
    
    logger.info('User authenticated', { userId: req.user.id });
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't error if token is missing or invalid
 * but will attach user to request if token is valid
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // This is a placeholder for token verification logic
      // In a real implementation, you would verify the token using JWT
      
      // For demonstration purposes, assuming a successful verification:
      req.user = {
        id: 'user-id-from-token',
        role: UserRole.USER
      };
      
      logger.info('Optional auth: User authenticated', { userId: req.user.id });
    }
    
    next();
  } catch (error) {
    // If authentication fails, just continue without user
    logger.info('Optional auth: Failed but continuing', { error: error.message });
    next();
  }
}

/**
 * Verifies that the authenticated user has the required role(s)
 * @param roles - Array of roles that are allowed to access the resource
 */
export function authorizeRoles(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('User authentication required'));
    }
    
    if (!roles.includes(req.user.role as UserRole)) {
      logger.warn('Authorization failed: insufficient role', { 
        userId: req.user.id, 
        userRole: req.user.role,
        requiredRoles: roles 
      });
      
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    
    logger.info('User authorized', { userId: req.user.id, role: req.user.role });
    next();
  };
}

/**
 * Verifies that the authenticated user is the owner of the requested resource
 * @param paramIdField - The request parameter that contains the resource owner ID
 */
export function authorizeOwner(paramIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('User authentication required'));
    }
    
    const resourceOwnerId = req.params[paramIdField];
    
    if (req.user.id !== resourceOwnerId && req.user.role !== UserRole.ADMIN) {
      logger.warn('Owner authorization failed', { 
        userId: req.user.id, 
        resourceOwnerId,
        resource: req.originalUrl
      });
      
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    
    logger.info('Owner authorized', { userId: req.user.id, resourceId: resourceOwnerId });
    next();
  };
}
