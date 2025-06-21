/**
 * Unified Validation Utilities
 * 
 * This module provides comprehensive validation functions and schemas
 * consolidating logic from form-validation.ts and validation-utils.ts
 * to ensure consistent data validation across the application.
 */

import { Request } from 'express';
import { z } from 'zod';
import { BidStatus, BudgetType, TaskPriority, TaskStatus, UserRole } from '../../../shared/types/common/enums';
import { logger } from './logger';
import { validationResult, ValidationChain, ValidationError as ExpressValidationError } from 'express-validator';

// Create our own ValidationError class for consistency
export class ValidationError extends Error {
  public errors: Record<string, string[]>;
  
  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string; // First error message for backward compatibility
  valid?: boolean; // Alias for isValid for backward compatibility
  field?: string; // Field name that failed validation
  context?: Record<string, any>; // Additional context for the error
}

/**
 * Map of field errors
 */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

/**
 * Result of validating a form
 */
export interface FormValidationResult<T> {
  valid: boolean;
  errors: FieldErrors<T>;
  getErrorMessages: () => string[];
  getValidationError: () => ValidationError;
  addError: <K extends keyof T>(field: K, message: string) => void;
  hasError: <K extends keyof T>(field: K) => boolean;
  getFieldErrors: <K extends keyof T>(field: K) => string[];
}

/**
 * Options for a validation function
 */
export interface ValidationOptions {
  trim?: boolean;
  message?: string;
  context?: Record<string, any>;
  required?: boolean;
}

/**
 * Validation function type
 */
export type ValidatorFn<T = any> = (
  value: T,
  options?: ValidationOptions
) => ValidationResult;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
    
    errors.array().forEach((error: ExpressValidationError) => {
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
 * Create a validation result
 */
export function createValidationResult(
  valid: boolean,
  message?: string,
  field?: string,
  context?: Record<string, any>
): ValidationResult {
  return {
    isValid: valid,
    valid, // Alias for backward compatibility
    errors: valid ? [] : [message || 'Validation failed'],
    message,
    field,
    context
  };
}

/**
 * Create a form validation result
 */
export function createFormValidationResult<T>(
  initialErrors: FieldErrors<T> = {}
): FormValidationResult<T> {
  const errors: FieldErrors<T> = { ...initialErrors };
  
  // Check if any errors exist
  const hasErrors = (): boolean => {
    return Object.values(errors).some(fieldErrors =>
      Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
  };

  // Get all error messages as a flat array
  const getErrorMessages = (): string[] => {
    return Object.values(errors).flatMap(fieldErrors =>
      Array.isArray(fieldErrors) ? fieldErrors : []
    );
  };
  
  // Create a ValidationError instance
  const getValidationError = (): ValidationError => {
    const formattedErrors: Record<string, string[]> = {};
    
    Object.entries(errors).forEach(([key, value]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        formattedErrors[key] = value;
      }
    });
    
    return new ValidationError(
      'Form validation failed',
      formattedErrors
    );
  };
  
  // Add an error for a field
  const addError = <K extends keyof T>(field: K, message: string): void => {
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field]!.push(message);
  };
  
  // Check if a field has errors
  const hasError = <K extends keyof T>(field: K): boolean => {
    return Boolean(errors[field] && errors[field]?.length > 0);
  };
  
  // Get errors for a field
  const getFieldErrors = <K extends keyof T>(field: K): string[] => {
    return errors[field] || [];
  };
  
  return {
    valid: !hasErrors(),
    errors,
    getErrorMessages,
    getValidationError,
    addError,
    hasError,
    getFieldErrors
  };
}

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Unified email validation
 * Consolidates email validation from both validation-utils files
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email?.trim()) {
    errors.push('Email is required');
  } else {
    // RFC 5322 Official Standard Email Regex - consistent across frontend and backend
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Legacy email validation for backward compatibility
 * @deprecated Use validateEmail instead
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Unified password validation
 * Consolidates password validation from both validation-utils files
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Enhanced password strength validation with scoring
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

/**
 * Phone number validation
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!phoneRegex.test(phone)) {
    errors.push('Please enter a valid phone number');
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Amount validation for payments
 */
export function validateAmount(amount: number, min = 0, max = Infinity): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(amount)) {
    errors.push('Amount must be a valid number');
  } else if (amount < min) {
    errors.push(`Amount must be at least ${min}`);
  } else if (amount > max) {
    errors.push(`Amount cannot exceed ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * File validation for document uploads
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB = 10
): ValidationResult {
  const errors: string[] = [];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, valid: false, errors, message: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File size cannot exceed ${maxSizeMB}MB`);
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Address validation
 */
export function validateAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (!address.street?.trim()) {
    errors.push('Street address is required');
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!address.state?.trim()) {
    errors.push('State/Province is required');
  }
  
  if (!address.postalCode?.trim()) {
    errors.push('Postal code is required');
  }
  
  if (!address.country?.trim()) {
    errors.push('Country is required');
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Date validation
 */
export function validateDate(date: string | Date, minAge = 18): ValidationResult {
  const errors: string[] = [];

  if (!date) {
    errors.push('Date is required');
    return { isValid: false, valid: false, errors, message: 'Date is required' };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    errors.push('Please enter a valid date');
    return { isValid: false, valid: false, errors, message: 'Please enter a valid date' };
  }
  
  // Check minimum age for date of birth
  if (minAge > 0) {
    const today = new Date();
    const age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
      if (age - 1 < minAge) {
        errors.push(`You must be at least ${minAge} years old`);
      }
    } else if (age < minAge) {
      errors.push(`You must be at least ${minAge} years old`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Text validation with length constraints
 */
export function validateText(
  text: string,
  minLength = 0,
  maxLength = Infinity,
  fieldName = 'Field'
): ValidationResult {
  const errors: string[] = [];

  if (!text?.trim() && minLength > 0) {
    errors.push(`${fieldName} is required`);
  } else if (text) {
    if (text.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    if (text.length > maxLength) {
      errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Rating validation (1-5 scale)
 */
export function validateRating(rating: number): ValidationResult {
  const errors: string[] = [];

  if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

/**
 * Batch validation utility
 */
export function validateFields(validations: ValidationResult[]): ValidationResult {
  const allErrors = validations.flatMap(v => v.errors);

  return {
    isValid: allErrors.length === 0,
    valid: allErrors.length === 0,
    errors: allErrors,
    message: allErrors.length > 0 ? allErrors[0] : undefined,
  };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `• ${errors.join('\n• ')}`;
}

// =============================================================================
// FUNCTIONAL VALIDATOR FUNCTIONS (for use with validation chains)
// =============================================================================

/**
 * Required field validator
 */
export const required: ValidatorFn = (value, options = {}) => {
  const { message = 'This field is required', context } = options;
  
  const isEmpty = 
    value === undefined || 
    value === null || 
    value === '' || 
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0);
  
  return createValidationResult(!isEmpty, isEmpty ? message : undefined, undefined, context);
};

/**
 * Minimum length validator
 */
export const minLength = (min: number): ValidatorFn<string> => (value, options = {}) => {
  const { 
    trim = true, 
    message = `Must be at least ${min} characters`, 
    context,
    required: isRequired = true
  } = options;
  
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const strValue = String(value || '');
  const trimmedValue = trim ? strValue.trim() : strValue;
  const valid = trimmedValue.length >= min;
  
  return createValidationResult(valid, valid ? undefined : message, undefined, context);
};

/**
 * Maximum length validator
 */
export const maxLength = (max: number): ValidatorFn<string> => (value, options = {}) => {
  const { 
    trim = true, 
    message = `Must be no more than ${max} characters`, 
    context,
    required: isRequired = true
  } = options;
  
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const strValue = String(value || '');
  const trimmedValue = trim ? strValue.trim() : strValue;
  const valid = trimmedValue.length <= max;
  
  return createValidationResult(valid, valid ? undefined : message, undefined, context);
};

/**
 * Email validator
 */
export const email: ValidatorFn<string> = (value, options = {}) => {
  const { 
    trim = true, 
    message = 'Please enter a valid email address', 
    context,
    required: isRequired = true
  } = options;
  
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const trimmedValue = trim ? (value || '').trim() : (value || '');
  const result = validateEmail(trimmedValue);
  
  return createValidationResult(result.isValid, result.isValid ? undefined : message, undefined, context);
};

/**
 * URL validator
 */
export const url: ValidatorFn<string> = (value, options = {}) => {
  const { 
    trim = true, 
    message = 'Please enter a valid URL', 
    context,
    required: isRequired = true
  } = options;
  
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const trimmedValue = trim ? (value || '').trim() : (value || '');
  
  try {
    new URL(trimmedValue);
    return createValidationResult(true, undefined, undefined, context);
  } catch (error) {
    return createValidationResult(false, message, undefined, context);
  }
};

/**
 * Pattern validator
 */
export const pattern = (regex: RegExp, patternDescription?: string): ValidatorFn<string> => 
  (value, options = {}) => {
    const { 
      trim = true, 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const trimmedValue = trim ? (value || '').trim() : (value || '');
    const valid = regex.test(trimmedValue);
    
    const defaultMessage = patternDescription 
      ? `Must match format: ${patternDescription}`
      : 'Invalid format';
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? defaultMessage), 
      undefined, 
      context
    );
  };

/**
 * Number range validator
 */
export const numberRange = (min?: number, max?: number): ValidatorFn<number> => 
  (value, options = {}) => {
    const { 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    if ((value === undefined || value === null || String(value) === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return createValidationResult(false, 'Must be a valid number', undefined, context);
    }
    
    let valid = true;
    let errorMessage = '';
    
    if (min !== undefined && max !== undefined) {
      valid = numValue >= min && numValue <= max;
      errorMessage = `Must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      valid = numValue >= min;
      errorMessage = `Must be at least ${min}`;
    } else if (max !== undefined) {
      valid = numValue <= max;
      errorMessage = `Must be no more than ${max}`;
    }
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? errorMessage), 
      undefined, 
      context
    );
  };

/**
 * Match another field validator
 */
export const matches = <T>(otherValue: T, otherFieldName?: string): ValidatorFn<T> => 
  (value, options = {}) => {
    const { 
      message, 
      context,
      required: isRequired = true
    } = options;
    
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const valid = value === otherValue;
    const fieldText = otherFieldName ? ` ${otherFieldName}` : '';
    const defaultMessage = `Must match${fieldText}`;
    
    return createValidationResult(
      valid, 
      valid ? undefined : (message ?? defaultMessage), 
      undefined, 
      context
    );
  };

/**
 * Date range validator
 */
export const dateRange = (
  minDate?: Date | string | number,
  maxDate?: Date | string | number
): ValidatorFn<Date | string | number> => (value, options = {}) => {
  const { 
    message, 
    context,
    required: isRequired = true
  } = options;
  
  if ((value === undefined || value === null || value === '') && !isRequired) {
    return createValidationResult(true);
  }
  
  const valueDate = new Date(value);
  const minDateObj = minDate ? new Date(minDate) : undefined;
  const maxDateObj = maxDate ? new Date(maxDate) : undefined;
  
  if (isNaN(valueDate.getTime())) {
    return createValidationResult(false, 'Must be a valid date', undefined, context);
  }
  
  let valid = true;
  let errorMessage = '';
  
  if (minDateObj && maxDateObj) {
    valid = valueDate >= minDateObj && valueDate <= maxDateObj;
    errorMessage = `Must be between ${minDateObj.toLocaleDateString()} and ${maxDateObj.toLocaleDateString()}`;
  } else if (minDateObj) {
    valid = valueDate >= minDateObj;
    errorMessage = `Must be on or after ${minDateObj.toLocaleDateString()}`;
  } else if (maxDateObj) {
    valid = valueDate <= maxDateObj;
    errorMessage = `Must be on or before ${maxDateObj.toLocaleDateString()}`;
  }
  
  return createValidationResult(
    valid, 
    valid ? undefined : (message ?? errorMessage), 
    undefined, 
    context
  );
};

/**
 * Custom validator
 */
export const custom = <T>(validatorFn: (value: T) => boolean, errorMessage: string): ValidatorFn<T> => 
  (value, options = {}) => {
    const { 
      context,
      required: isRequired = true
    } = options;
    
    if ((value === undefined || value === null || value === '') && !isRequired) {
      return createValidationResult(true);
    }
    
    const valid = validatorFn(value);
    
    return createValidationResult(
      valid, 
      valid ? undefined : (options.message ?? errorMessage), 
      undefined, 
      context
    );
  };

/**
 * Compose multiple validators
 */
export const compose = <T>(validators: ValidatorFn<T>[]): ValidatorFn<T> => 
  (value, options = {}) => {
    for (const validator of validators) {
      const result = validator(value, options);
      
      if (!result.valid) {
        return result;
      }
    }
    
    return createValidationResult(true);
  };

/**
 * Validate an object using a validation schema
 */
export function validateObject<T extends Record<string, any>>(
  values: T,
  schema: Record<keyof T, ValidatorFn | ValidatorFn[]>
): FormValidationResult<T> {
  const result = createFormValidationResult<T>();
  
  Object.entries(schema).forEach(([key, validators]) => {
    const field = key as keyof T;
    const value = values[field];
    const validatorList = Array.isArray(validators) ? validators : [validators];
    
    for (const validator of validatorList) {
      const validationResult = validator(value);
      
      if (!validationResult.valid) {
        result.addError(field, validationResult.message ?? 'Invalid value');
        break;
      }
    }
  });
  
  return result;
}

// =============================================================================
// SIMPLE VALIDATION RULES (for quick use)
// =============================================================================

export const ValidationRules = {
  required: (message = 'This field is required') =>
    (value: any) => (value === undefined || value === null || value === '') ? message : null,

  min: (min: number, message = `Must be at least ${min}`) =>
    (value: number) => (value < min) ? message : null,

  max: (max: number, message = `Must be at most ${max}`) =>
    (value: number) => (value > max) ? message : null,

  minLength: (minLength: number, message = `Must be at least ${minLength} characters`) =>
    (value: string) => (value.length < minLength) ? message : null,

  maxLength: (maxLength: number, message = `Must be at most ${maxLength} characters`) =>
    (value: string) => (value.length > maxLength) ? message : null,

  pattern: (pattern: RegExp, message = 'Invalid format') =>
    (value: string) => (!pattern.test(value)) ? message : null,

  email: (message = 'Invalid email address') =>
    (value: string) => (!/^\S+@\S+\.\S+$/.test(value)) ? message : null,

  matches: (field: string, message = 'Fields must match') =>
    (value: any, formValues?: Record<string, any>) =>
      (formValues && formValues[field] !== value) ? message : null,
};

// =============================================================================
// ZOD VALIDATION FUNCTIONS
// =============================================================================

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
  // Zod utilities
  validateWithZod,
  formatZodErrors,
  validateRequest,
  composeValidators,
  initializeValidation,
  
  // Core validation functions
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validatePhoneNumber,
  validateAmount,
  validateFile,
  validateAddress,
  validateDate,
  validateText,
  validateRating,
  validateFields,
  sanitizeInput,
  formatValidationErrors,
  
  // Functional validators
  required,
  minLength,
  maxLength,
  email,
  url,
  pattern,
  numberRange,
  matches,
  dateRange,
  custom,
  compose,
  
  // Form utilities
  createValidationResult,
  createFormValidationResult,
  validateObject,
  ValidationRules,
  
  // Legacy utilities
  sanitizeObject,
  isValidEmail,
  
  // Schemas
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
