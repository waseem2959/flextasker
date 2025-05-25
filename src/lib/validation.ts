// src/lib/validation.ts
import { z } from 'zod';

// Match your backend validation schemas exactly
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['USER', 'TASKER']).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  categoryId: z.string(),
  budget: z.number().positive(),
  budgetType: z.enum(['FIXED', 'HOURLY', 'NEGOTIABLE']),
  isRemote: z.boolean(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  deadline: z.date().optional(),
  tags: z.array(z.string()),
  requirements: z.array(z.string()),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;