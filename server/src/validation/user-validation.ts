/**
 * User Validation Schemas
 * 
 * Zod validation schemas for user-related operations
 */

import { z } from 'zod';
import { UserRole } from '../../../shared/types/common/enums';

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
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
    sortDir: z.enum(['asc', 'desc']).optional()
  })
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
    location: z.string().max(100).optional(),
    city: z.string().max(50).optional(),
    state: z.string().max(50).optional(),
    country: z.string().max(50).optional(),
    zipCode: z.string().max(20).optional(),
    website: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    portfolio: z.string().url().optional()
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
});

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