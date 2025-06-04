/**
 * Validation Service Index
 * 
 * This file centralizes exports for validation-related services.
 */

// Re-export validation functions from centralized location
import { BudgetType, TaskPriority, TaskStatus, UserRole } from '@/types';
import { isValidEmail, validatePassword } from '@/utils/validation';
import { z } from 'zod';

// Validation function
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

// Schema definitions
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export const budgetTypeSchema = z.nativeEnum(BudgetType);
export const userRoleSchema = z.nativeEnum(UserRole);

export const emailSchema = z.string().refine(isValidEmail, {
  message: 'Invalid email format'
});

export const passwordSchema = z.string().refine(
  (password) => validatePassword(password).isValid,
  { message: 'Password does not meet security requirements' }
);

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

export const budgetSchema = z.object({
  amount: z.number().positive(),
  type: budgetTypeSchema,
  currency: z.string().default('USD'),
  negotiable: z.boolean().default(false)
});

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

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
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

// All exports are already declared above with individual export statements

// Default export for convenience
export default {
  validate,
  isValidEmail,
  validatePassword,
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
  taskFilterSchema
};