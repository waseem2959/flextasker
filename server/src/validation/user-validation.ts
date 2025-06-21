/**
 * User Validation Schemas
 * 
 * Zod validation schemas for user-related operations
 * Uses centralized validation schemas with route-specific wrappers where applicable
 */

import { z } from 'zod';
import { UserRole } from '../../../shared/types/common/enums';
import { ValidationSchemas } from '../utils/validation-utils';

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    id: ValidationSchemas.Common.uuid
  })
});

// Search users schema
export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    location: z.string().max(100).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortDir: ValidationSchemas.Common.sortOrder.optional()
  })
});

// Update profile schema - using centralized user update schema
export const updateProfileSchema = z.object({
  body: ValidationSchemas.User.update
});

// Import change password schema from auth validation to avoid duplication
import { changePasswordSchema } from './auth-validation';
// Re-export for external use
export { changePasswordSchema };

// Update preferences schema
export const updatePreferencesSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    language: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
    currency: z.string().length(3).optional()
  })
});

// Deactivate account schema
export const deactivateAccountSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Reason is required').max(500),
    feedback: z.string().max(1000).optional()
  })
});

// Upload avatar schema (for file validation)
export const uploadAvatarSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  })
});

// User validation configs for routes
export const userValidationConfigs = {
  getUserById: { params: getUserByIdSchema.shape.params },
  searchUsers: { query: searchUsersSchema.shape.query },
  updateProfile: { body: updateProfileSchema.shape.body },
  changePassword: { body: changePasswordSchema.shape.body },
  updatePreferences: { body: updatePreferencesSchema.shape.body },
  deactivateAccount: { body: deactivateAccountSchema.shape.body },
  uploadAvatar: { params: uploadAvatarSchema.shape.params }
};