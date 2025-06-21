/**
 * Authentication Validation Schemas
 * 
 * Zod validation schemas for authentication-related operations
 * Re-exports from centralized validation utilities with route-specific wrappers
 */

import { z } from 'zod';
import { ValidationSchemas } from '../utils/validation-utils';

// Route-specific wrappers for centralized auth schemas
export const registerSchema = z.object({
  body: ValidationSchemas.Auth.register
});

export const loginSchema = z.object({
  body: ValidationSchemas.Auth.login
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: ValidationSchemas.Auth.resetPassword
});

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

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required')
  })
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address')
  })
});

// Auth validation configs for routes
export const authValidationConfigs = {
  register: { body: registerSchema.shape.body },
  login: { body: loginSchema.shape.body },
  forgotPassword: { body: forgotPasswordSchema.shape.body },
  resetPassword: { body: resetPasswordSchema.shape.body },
  changePassword: { body: changePasswordSchema.shape.body },
  refreshToken: { body: refreshTokenSchema.shape.body },
  verifyEmail: { body: verifyEmailSchema.shape.body },
  resendVerification: { body: resendVerificationSchema.shape.body }
};