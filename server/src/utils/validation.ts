import { z } from 'zod';

/**
 * Validation utilities using Zod - a TypeScript-first schema validation library.
 * This helps us ensure that data coming into our API meets our requirements
 * before we try to process it.
 */

// Common validation schemas that we'll use across different endpoints
export const commonSchemas = {
  // Email validation with custom error message
  email: z
    .string()
    .email('Please provide a valid email address')
    .max(254, 'Email address is too long'),

  // Password validation with strength requirements
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Phone number validation
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Please provide a valid phone number with country code'),

  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),

  // MongoDB ObjectId validation (if needed for references)
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
};

/**
 * Validate request data against a schema
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};