/**
 * Validation Utilities
 * 
 * This module provides reusable validation functions and utilities
 * to ensure consistent data validation across the application.
 */

import { Request } from 'express';
import { ValidationChain, ValidationError, validationResult } from 'express-validator';
import { z } from 'zod';
import { BidStatus, BudgetType, TaskPriority, TaskStatus, UserRole } from '../../../shared/types/enums';
import { logger } from './logger';

// Note: validation-schemas.ts has been consolidated into this file
// All schemas are now defined in the ValidationSchemas object below

/**
 * Centralized validation schema registry
 * This allows reusing validation schemas across the application
 */
/**
 * Initialize validation schemas
 */
export function initializeValidation(): void {
  logger.info('Initializing validation system');
  
  // Register enum values with Zod for better validation
  z.setErrorMap((issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      let enumName = '';
      let validOptions: string[] = [];
      
      // Determine which enum is being validated
      if (issue.options.some(opt => Object.values(UserRole).includes(opt as any))) {
        enumName = 'UserRole';
        validOptions = Object.values(UserRole);
      } else if (issue.options.some(opt => Object.values(TaskStatus).includes(opt as any))) {
        enumName = 'TaskStatus';
        validOptions = Object.values(TaskStatus);
      } else if (issue.options.some(opt => Object.values(BidStatus).includes(opt as any))) {
        enumName = 'BidStatus';
        validOptions = Object.values(BidStatus);
      } else if (issue.options.some(opt => Object.values(TaskPriority).includes(opt as any))) {
        enumName = 'TaskPriority';
        validOptions = Object.values(TaskPriority);
      } else if (issue.options.some(opt => Object.values(BudgetType).includes(opt as any))) {
        enumName = 'BudgetType';
        validOptions = Object.values(BudgetType);
      }
      
      return {
        message: `Invalid ${enumName} value. Valid options are: ${validOptions.join(', ')}`
      };
    }
    
    // Fall back to default error map
    return { message: ctx.defaultError };
  });
  
  logger.info('Validation schemas initialized');
}

/**
 * Centralized validation schema registry
 * This allows reusing validation schemas across the application
 */
export const ValidationSchemas = {
  // User-related schemas
  User: {
    create: z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/\\d/, { message: 'Password must contain at least one number' })
        .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
      firstName: z.string().min(1, { message: 'First name is required' }),
      lastName: z.string().min(1, { message: 'Last name is required' }),
      role: z.enum(['USER', 'TASKER', 'ADMIN']).optional(),
      profilePicture: z.string().url().optional(),
      bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional()
    }),
    
    update: z.object({
      email: z.string().email({ message: 'Invalid email address' }).optional(),
      firstName: z.string().min(1, { message: 'First name is required' }).optional(),
      lastName: z.string().min(1, { message: 'Last name is required' }).optional(),
      role: z.enum(['USER', 'TASKER', 'ADMIN']).optional(),
      profilePicture: z.string().url().optional(),
      bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
  },
  
  // Task-related schemas
  Task: {
    create: z.object({
      title: z.string().min(5, { message: 'Title must be at least 5 characters' })
        .max(100, { message: 'Title cannot exceed 100 characters' }),
      description: z.string().min(20, { message: 'Description must be at least 20 characters' })
        .max(2000, { message: 'Description cannot exceed 2000 characters' }),
      budget: z.number().min(5, { message: 'Budget must be at least $5' })
        .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
      categoryId: z.string().uuid({ message: 'Invalid category ID' }),
      dueDate: z.string().datetime({ offset: true }).optional()
        .transform(val => val ? new Date(val) : undefined),
      location: z.string().optional(),
      tags: z.array(z.string()).optional(),
      attachments: z.array(z.string().url()).optional()
    }),
    
    update: z.object({
      title: z.string().min(5, { message: 'Title must be at least 5 characters' })
        .max(100, { message: 'Title cannot exceed 100 characters' }).optional(),
      description: z.string().min(20, { message: 'Description must be at least 20 characters' })
        .max(2000, { message: 'Description cannot exceed 2000 characters' }).optional(),
      budget: z.number().min(5, { message: 'Budget must be at least $5' })
        .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
        .optional(),
      categoryId: z.string().uuid({ message: 'Invalid category ID' }).optional(),
      status: z.enum(['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
      dueDate: z.string().datetime({ offset: true })
        .transform(val => new Date(val))
        .optional()
        .nullable(),
      location: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      attachments: z.array(z.string().url()).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
  },
  
  // Bid-related schemas
  Bid: {
    create: z.object({
      taskId: z.string().uuid({ message: 'Invalid task ID' }),
      amount: z.number().min(5, { message: 'Bid amount must be at least $5' })
        .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
      deliveryTime: z.number().int().min(1, { message: 'Delivery time must be at least 1 day' })
        .or(z.string().regex(/^\d+$/).transform(Number)),
      message: z.string().min(10, { message: 'Message must be at least 10 characters' })
        .max(500, { message: 'Message cannot exceed 500 characters' })
    }),
    
    update: z.object({
      amount: z.number().min(5, { message: 'Bid amount must be at least $5' })
        .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
        .optional(),
      deliveryTime: z.number().int().min(1, { message: 'Delivery time must be at least 1 day' })
        .or(z.string().regex(/^\d+$/).transform(Number))
        .optional(),
      message: z.string().min(10, { message: 'Message must be at least 10 characters' })
        .max(500, { message: 'Message cannot exceed 500 characters' })
        .optional(),
      status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
  },
  
  // Authentication-related schemas
  Auth: {
    login: z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string().min(1, { message: 'Password is required' })
    }),
    
    register: z.object({
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/\\d/, { message: 'Password must contain at least one number' })
        .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
      confirmPassword: z.string(),
      firstName: z.string().min(1, { message: 'First name is required' }),
      lastName: z.string().min(1, { message: 'Last name is required' }),
      role: z.enum(['USER', 'TASKER']).default('USER'),
      agreeToTerms: z.boolean().refine(val => val === true, {
        message: 'You must agree to the terms and conditions'
      })
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }),
    
    resetPassword: z.object({
      token: z.string().min(1, { message: 'Token is required' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/\\d/, { message: 'Password must contain at least one number' })
        .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    })
  },
  
  // Payment-related schemas
  Payment: {
    create: z.object({
      taskId: z.string().uuid({ message: 'Invalid task ID' }),
      amount: z.number().min(0.01, { message: 'Amount must be greater than 0' })
        .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
      paymentMethod: z.string().min(1, { message: 'Payment method is required' }),
      currency: z.string().default('USD')
    }),
    
    update: z.object({
      status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
      refundAmount: z.number().min(0.01).optional(),
      notes: z.string().optional()
    })
  },
  
  // Review-related schemas
  Review: {
    create: z.object({
      taskId: z.string().uuid({ message: 'Invalid task ID' }),
      rating: z.number().min(1).max(5),
      title: z.string().min(3).max(100),
      comment: z.string().min(10).max(1000)
    }),
    
    update: z.object({
      rating: z.number().min(1).max(5).optional(),
      title: z.string().min(3).max(100).optional(),
      comment: z.string().min(10).max(1000).optional()
    })
  },
  
  // Notification-related schemas
  Notification: {
    create: z.object({
      userId: z.string().uuid({ message: 'Invalid user ID' }),
      type: z.string().min(1),
      title: z.string().min(1),
      message: z.string().min(1),
      data: z.record(z.unknown()).optional()
    }),
    
    update: z.object({
      isRead: z.boolean().optional(),
      archived: z.boolean().optional()
    })
  },
  
  // Message-related schemas
  Message: {
    create: z.object({
      conversationId: z.string().uuid({ message: 'Invalid conversation ID' }),
      content: z.string().min(1),
      type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
      attachments: z.array(z.string().url()).optional()
    }),
    
    update: z.object({
      isRead: z.boolean().optional(),
      content: z.string().min(1).optional()
    })
  },
  
  // Category-related schemas
  Category: {
    create: z.object({
      name: z.string().min(2).max(50),
      description: z.string().max(500).optional(),
      icon: z.string().url().optional(),
      isActive: z.boolean().default(true)
    }),
    
    update: z.object({
      name: z.string().min(2).max(50).optional(),
      description: z.string().max(500).optional(),
      icon: z.string().url().optional(),
      isActive: z.boolean().optional()
    })
  },
  
  // Health check schemas
  HealthCheck: {
    response: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      timestamp: z.string().datetime(),
      version: z.string(),
      services: z.record(z.object({
        status: z.enum(['up', 'down']),
        latency: z.number(),
        error: z.string().optional()
      }))
    })
  },
  
  // Common validation patterns
  Common: {
    pagination: z.object({
      page: z.number().int().min(1).default(1)
        .or(z.string().regex(/^\d+$/).transform(Number)),
      limit: z.number().int().min(1).max(100).default(20)
        .or(z.string().regex(/^\d+$/).transform(Number))
    }),
    
    uuid: z.string().uuid({ message: 'Invalid UUID format' }),
    
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
    
    dateRange: z.object({
      startDate: z.string().datetime({ offset: true })
        .transform(val => new Date(val)),
      endDate: z.string().datetime({ offset: true })
        .transform(val => new Date(val))
    }).refine(data => data.startDate <= data.endDate, {
      message: 'Start date must be before or equal to end date',
      path: ['startDate']
    })
  }
};

/**
 * Validate data against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result containing success, data, and errors
 */
export function validateWithZod<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: boolean; data: T | null; errors: z.ZodError | null } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: error };
    }
    logger.error('Unexpected validation error', { error });
    throw error;
  }
}

/**
 * Format Zod validation errors into a standardized format
 * 
 * @param zodError Zod validation error
 * @returns Formatted validation errors
 */
export function formatZodErrors(zodError: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  for (const issue of zodError.errors) {
    const path = issue.path.join('.');
    formattedErrors[path || 'general'] = issue.message;
  }
  
  return formattedErrors;
}

/**
 * Validate request data with Express Validator
 * 
 * @param req Express request
 * @returns Validation result containing success and errors
 */
export function validateRequest(req: Request): {
  success: boolean;
  errors: Record<string, string> | null;
} {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string> = {};
    
    errors.array().forEach((error: ValidationError) => {
      // Extract the field name safely - validation error structure may vary
      let fieldName = 'unknown';
      if ('path' in error) {
        fieldName = String(error.path);
      } else if ('param' in error) {
        fieldName = String(error.param);
      } else if ('field' in error) {
        fieldName = String(error.field);
      }
      
      errorMap[fieldName] = error.msg;
    });
    
    return {
      success: false,
      errors: errorMap
    };
  }
  
  return {
    success: true,
    errors: null
  };
}

/**
 * Compose multiple validation chains for Express Validator
 * 
 * @param validators Array of validation chains
 * @returns Combined validation middleware
 */
export function composeValidators(validators: ValidationChain[]) {
  return async (req: Request, res: any, next: () => void) => {
    await Promise.all(validators.map(validator => validator.run(req)));
    
    const { success, errors } = validateRequest(req);
    
    if (success) {
      return next();
    }
    
    return res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION',
        message: 'Validation failed',
        details: errors
      }
    });
  };
}

/**
 * Sanitize object to remove sensitive fields
 * 
 * @param obj Object to sanitize
 * @param sensitiveFields Array of sensitive field names to remove
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'passwordHash', 'token', 'secret', 'apiKey']
): Partial<T> {
  const sanitized = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}

/**
 * Validate email format
 * 
 * @param email Email to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength
 * 
 * @param password Password to validate
 * @returns Validation result with strength score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Check for common patterns
  if (/(\d{3,})/.test(password) || /([a-zA-Z]{3,})\1/.test(password)) {
    feedback.push('Password contains repeated patterns');
    score -= 1;
  }
  
  // Final validity check
  const isValid = score >= 4 && feedback.length <= 1;
  
  return {
    isValid,
    score: Math.max(0, score),
    feedback
  };
}

// Individual schema exports for backward compatibility
export const UserSchemas = ValidationSchemas.User;
export const TaskSchemas = ValidationSchemas.Task;
export const BidSchemas = ValidationSchemas.Bid;
export const AuthSchemas = ValidationSchemas.Auth;
export const PaymentSchemas = ValidationSchemas.Payment;
export const ReviewSchemas = ValidationSchemas.Review;
export const NotificationSchemas = ValidationSchemas.Notification;
export const MessageSchemas = ValidationSchemas.Message;
export const CategorySchemas = ValidationSchemas.Category;
export const HealthCheckSchemas = ValidationSchemas.HealthCheck;

export default {
  validateWithZod,
  formatZodErrors,
  validateRequest,
  composeValidators,
  sanitizeObject,
  isValidEmail,
  validatePasswordStrength,
  initializeValidation,
  ValidationSchemas,
  UserSchemas,
  TaskSchemas,
  BidSchemas,
  AuthSchemas,
  PaymentSchemas,
  ReviewSchemas,
  NotificationSchemas,
  MessageSchemas,
  CategorySchemas,
  HealthCheckSchemas
};
