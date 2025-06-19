/**
 * Validation Service Index (Updated)
 * 
 * Uses shared validation schemas and provides backward compatibility
 */

import { z } from 'zod';
import { validatePassword as validatePasswordUtil } from '@/lib/validation-utils';
import { validateEmail } from '@/lib/validation-utils';
// Import Zod schemas from form validation since shared validation doesn't exist
import { createTaskSchema as taskCreateSchema } from '@/utils/form-validation';
import { TaskPriority, TaskStatus, BudgetType, UserRole } from '@/types';

// Generic validation function
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

// Basic schema definitions
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export const budgetTypeSchema = z.nativeEnum(BudgetType);
export const userRoleSchema = z.nativeEnum(UserRole);

export const emailSchema = z.string().refine(
  (email) => validateEmail(email).isValid,
  { message: 'Invalid email format' }
);

export const passwordSchema = z.string().refine(
  (password) => validatePasswordUtil(password).isValid,
  { message: 'Password does not meet security requirements' }
);

// Re-export validation schemas with backward compatibility names
export const createTaskSchema = taskCreateSchema;
export const updateTaskSchema = z.object({}); // Placeholder
export const taskFilterSchema = z.object({}); // Placeholder

// Placeholder sub-schemas
export const budgetSchema = z.object({});
export const locationSchema = z.object({});
export const timingSchema = z.object({});
export const requirementsSchema = z.object({});

// Default export for convenience
export default {
  validate,
  validateEmail,
  validatePassword: validatePasswordUtil,
  taskStatusSchema,
  taskPrioritySchema,
  budgetTypeSchema,
  userRoleSchema,
  emailSchema,
  passwordSchema,
  locationSchema,
  budgetSchema,
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
  timingSchema,
  requirementsSchema
};