/**
 * Validation Utilities with TypeScript Improvements
 * 
 * This file provides centralized validation utilities for data validation,
 * ensuring runtime type safety alongside TypeScript's compile-time checks.
 * 
 * It includes both Zod schema-based validation and traditional validation functions
 * to support different validation approaches across the application.
 */

import { z } from 'zod';
import { ValidationError } from '@/types/errors';
import { TaskStatus, TaskPriority, BudgetType, UserRole } from '@/types/enums';

/**
 * Validate data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      
      throw new ValidationError('Validation failed', fieldErrors);
    }
    
    throw error;
  }
}

/**
 * Common schema definitions
 */

// Task status enum validation
export const taskStatusSchema = z.nativeEnum(TaskStatus);

// Task priority enum validation
export const taskPrioritySchema = z.nativeEnum(TaskPriority);

// Budget type enum validation
export const budgetTypeSchema = z.nativeEnum(BudgetType);

// User role enum validation
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * Direct validation functions (non-schema based)
 */

/**
 * Validates email format using a comprehensive regex pattern
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength according to common security requirements
 * 
 * @param password - Password to validate
 * @returns Object containing validation result and specific failure reasons
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Contains number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Contains uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Contains lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Contains special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Email schema using the isValidEmail function
export const emailSchema = z.string().refine(isValidEmail, {
  message: 'Invalid email format'
});

// Password schema using the validatePassword function
export const passwordSchema = z.string().refine(
  (password) => validatePassword(password).isValid,
  {
    message: 'Password does not meet security requirements'
  }
);

// Location schema
export const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  isRemote: z.boolean()
});

// Budget schema
export const budgetSchema = z.object({
  amount: z.number().positive(),
  type: budgetTypeSchema,
  currency: z.string().default('USD'),
  negotiable: z.boolean().default(false)
});

// Task creation schema
export const createTaskSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  priority: taskPrioritySchema,
  budget: budgetSchema,
  location: locationSchema,
  tags: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  deadline: z.string().datetime().optional(),
  startDate: z.string().datetime().optional()
});

// Task update schema
export const updateTaskSchema = createTaskSchema.partial();

// Task filter schema
export const taskFilterSchema = z.object({
  status: z.union([
    taskStatusSchema,
    z.array(taskStatusSchema)
  ]).optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  location: z.string().optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  budgetType: budgetTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  assignedTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'deadline', 'budget', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().min(1).max(100).optional()
});
