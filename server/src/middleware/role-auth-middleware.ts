/**
 * Role-Based Authorization Middleware
 * 
 * This middleware provides role-based access control (RBAC) functionality
 * to protect routes based on user roles and permissions.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../shared/types/enums';
import { AppError } from '../utils/error-utils';
import { logger } from '../utils/logger';


// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
      db: {
        task: {
          findUnique: (options: { where: { id: string }, select: { createdBy: boolean, taskerId: boolean } }) => Promise<{ createdBy: string, taskerId: string | null } | null>;
        };
        bid: {
          findUnique: (options: { where: { id: string }, include: { task: boolean } }) => Promise<{ taskerId: string, task: { createdBy: string } } | null>;
        };
        conversation: {
          findUnique: (options: { where: { id: string }, include: { participants: boolean } }) => Promise<{ participants: Array<{ userId: string }> } | null>;
        };
      };
    }
  }
}

/**
 * Middleware to restrict access to routes based on user roles
 * 
 * @param roles Array of roles that are allowed to access the route
 * @returns Middleware function that checks if the user has the required role
 */
/**
 * Middleware to restrict access to routes based on user roles
 * @param roles Array of allowed UserRole values
 * @returns Express middleware function
 */
export function requireRole(roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Ensure user is authenticated and has a role
    if (!req.user?.role) {
      throw new AppError('User role not found', 401);
    }

    // Get the user's role with proper type assertion
    const userRole = req.user.role as UserRole;
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(userRole)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      });
      
      return next(new AppError('You do not have permission to access this resource', 403));
    }
    
    // User has required role, continue
    next();
  };
}

/**
 * Middleware to restrict access to routes to admin users only
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware to restrict access to routes to tasker users only
 */
export const requireTasker = requireRole([UserRole.TASKER]);

/**
 * Middleware to restrict access to routes to regular users only
 */
export const requireUser = requireRole([UserRole.USER]);

/**
 * Middleware to restrict access to routes to either taskers or regular users
 */
export const requireTaskerOrUser = requireRole([UserRole.TASKER, UserRole.USER]);

/**
 * Middleware to restrict access to routes to either admins or taskers
 */
export const requireAdminOrTasker = requireRole([UserRole.ADMIN, UserRole.TASKER]);

/**
 * Middleware to check if a user has permission to access a specific resource
 * 
 * @param resourceType Type of resource being accessed (e.g., 'task', 'bid', 'profile')
 * @returns Middleware function that checks if the user has permission to access the resource
 */
export function requireResourcePermission(resourceType: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }
      
      const userId = req.user.id;
      const resourceId = req.params.id;
      
      // Skip permission check for admins
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }
      
      // If no resource ID is provided, continue (this would be handled by role checks)
      if (!resourceId) {
        return next();
      }
      
      // Check permission based on resource type
      let hasPermission = false;
      
      if (resourceType === 'task') {
        // Check if user is the task creator or assigned tasker
        const task = await req.db.task.findUnique({
          where: { id: resourceId },
          select: { createdBy: true, taskerId: true }
        });
        
        hasPermission = !!(task && (task.createdBy === userId || task.taskerId === userId));
      } else if (resourceType === 'bid') {
        // Check if user is the bid creator or the task owner
        const bid = await req.db.bid.findUnique({
          where: { id: resourceId },
          include: { task: true }
        });
        
        hasPermission = !!(bid && (bid.taskerId === userId || bid.task?.createdBy === userId));
      } else if (resourceType === 'profile') {
        // Users can only access their own profile
        hasPermission = resourceId === userId;
      } else if (resourceType === 'conversation') {
        // Check if user is a participant in the conversation
        const conversation = await req.db.conversation.findUnique({
          where: { id: resourceId },
          include: { participants: true }
        });
        
        hasPermission = !!(conversation?.participants?.some(p => p.userId === userId));
      }
      // For unknown resource types, hasPermission remains false
      
      if (!hasPermission) {
        logger.warn('Unauthorized resource access attempt', {
          userId,
          resourceType,
          resourceId,
          path: req.path,
          method: req.method
        });
        
        return next(new AppError('You do not have permission to access this resource', 403));
      }
      
      // User has permission, continue
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Export all role-based authorization middleware
 */
export const roleAuth = {
  requireRole,
  requireAdmin,
  requireTasker,
  requireUser,
  requireTaskerOrUser,
  requireAdminOrTasker,
  requireResourcePermission
};
