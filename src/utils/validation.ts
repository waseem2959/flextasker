/**
 * Form Validation Schema
 * Contains validation schemas for form data
 */

import { BudgetType, TaskPriority, UserRole } from '@/types';
import { z } from 'zod';

// Email validation regex
const emailRegex = /^[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

// Password validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validate if email format is correct
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!passwordRegex.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must include at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { isValid: true };
};

/**
 * User registration schema
 */
export const registerSchema = z.object({
  firstName: z.string()
    .min(2, { message: 'First name must be at least 2 characters long' })
    .max(50, { message: 'First name cannot exceed 50 characters' }),
    
  lastName: z.string()
    .min(2, { message: 'Last name must be at least 2 characters long' })
    .max(50, { message: 'Last name cannot exceed 50 characters' }),
    
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
    
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/\d/, { message: 'Password must contain at least one number' }),
    
  confirmPassword: z.string(),
  
  role: z.nativeEnum(UserRole),
  
  termsAccepted: z.boolean()
    .refine(val => val === true, { message: 'You must accept the terms and conditions' })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
    
  password: z.string()
    .min(1, { message: 'Password is required' }),
    
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, { message: 'First name must be at least 2 characters long' })
    .max(50, { message: 'First name cannot exceed 50 characters' }),
    
  lastName: z.string()
    .min(2, { message: 'Last name must be at least 2 characters long' })
    .max(50, { message: 'Last name cannot exceed 50 characters' }),
    
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
    
  phone: z.string().optional(),
  
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters' }).optional(),
  
  location: z.string().optional(),
  
  skills: z.array(z.string()).optional(),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  
  newPassword: z.string()
    .min(8, { message: 'New password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters long' }),
  message: z.string().min(20, { message: 'Message must be at least 20 characters long' }),
});

/**
 * Task creation schema
 */
export const createTaskSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters long' })
    .max(100, { message: 'Title cannot be longer than 100 characters' }),
    
  description: z.string()
    .min(20, { message: 'Description must be at least 20 characters long' })
    .max(2000, { message: 'Description cannot be longer than 2000 characters' }),
    
  category: z.string({ required_error: 'Please select a category' }),
  
  priority: z.nativeEnum(TaskPriority).optional(),
  
  budget: z.object({
    amount: z.number()
      .min(5, { message: 'Budget must be at least $5' })
      .max(10000, { message: 'Budget cannot exceed $10,000' }),
    type: z.nativeEnum(BudgetType)
  }),
  location: z.object({
    isRemote: z.boolean(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }).optional(),
      dueDate: z.date().optional(),
    
  startDate: z.date().optional(),
    
  tags: z.array(z.string()).optional(),
    
  attachments: z.array(z.string()).optional(),
});
