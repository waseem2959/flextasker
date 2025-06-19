/**
 * Example fixes for common controller issues
 * 
 * This file demonstrates how to fix the identified issues in the controllers
 */

import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base-controller';
import { ErrorType } from '../utils/error-utils'; // Standardized import

// 1. Standardized type for authenticated requests
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// 2. Helper function for safe user ID extraction
export const extractUserId = (req: Request): string => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

// 3. Example of properly structured controller
export class ExampleController extends BaseController {
  /**
   * Example method showing proper patterns
   */
  exampleMethod = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Use helper for user ID extraction
      const userId = extractUserId(req);
      
      // Use BaseController's pagination params
      const paginationParams = this.getPaginationParams(req);
      
      // Use BaseController's sorting params
      const sortingParams = this.getSortingParams(
        req,
        ['createdAt', 'updatedAt', 'name'],
        'createdAt',
        'desc'
      );
      
      // Validation using a consistent pattern
      const { requiredField } = req.body;
      if (!requiredField) {
        return this.sendError(
          res,
          'Required field is missing',
          400,
          ErrorType.VALIDATION,
          { field: 'requiredField' }
        );
      }
      
      // Business logic here...
      
      // Consistent success response
      this.sendSuccess(
        res,
        { data: 'example' },
        'Operation completed successfully'
      );
    }
  );
}

// 4. Middleware for common validations
export const validatePaginationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = req.query.page as string;
  const limit = req.query.limit as string;
  
  if (page && isNaN(parseInt(page))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid page parameter',
      errorType: ErrorType.VALIDATION
    });
  }
  
  if (limit && isNaN(parseInt(limit))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit parameter',
      errorType: ErrorType.VALIDATION
    });
  }
  
  next();
};

// 5. Standardized response messages
export const RESPONSE_MESSAGES = {
  CREATE: (entity: string) => `${entity} created successfully`,
  UPDATE: (entity: string) => `${entity} updated successfully`,
  DELETE: (entity: string) => `${entity} deleted successfully`,
  RETRIEVE: (entity: string) => `${entity} retrieved successfully`,
  NOT_FOUND: (entity: string) => `${entity} not found`,
  UNAUTHORIZED: 'You are not authorized to perform this action',
  VALIDATION_ERROR: 'Validation error occurred'
} as const;

// 6. Fixed conversation controller method example
export class FixedConversationController extends BaseController {
  getConversations = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = extractUserId(req);
      
      // Business logic
      const conversations = await this.messagingService.getUserConversations(userId);
      
      this.sendSuccess(
        res,
        conversations,
        RESPONSE_MESSAGES.RETRIEVE('Conversations')
      );
    }
  );
}