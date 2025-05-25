// contexts/AuthUtils.ts
// Utility functions for authentication context management
// This file contains helper functions that support the AuthContext implementation

import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '../types';

/**
 * Creates a properly typed context value object for the AuthContext
 * This factory function ensures consistent context value structure and helps with type safety
 * 
 * @param user - Current authenticated user or null
 * @param loading - Loading state during authentication operations
 * @param login - Login function that accepts LoginCredentials object
 * @param logout - Logout function  
 * @param register - Registration function that accepts RegisterData object
 * @returns Properly typed AuthContextType object
 */
export function createContextValue(
  user: User | null,
  loading: boolean,
  login: (credentials: LoginCredentials) => Promise<boolean>,
  logout: () => void,
  register: (data: RegisterData) => Promise<boolean>
): AuthContextType {
  return {
    user,
    isAuthenticated: !!user, // Convert user to boolean - null/undefined becomes false, any object becomes true
    role: user?.role ?? null, // Use nullish coalescing to handle undefined/null user
    login,
    logout,
    register,
    loading,
  };
}

/**
 * Validates email format using a comprehensive regex pattern
 * This function provides client-side email validation for better user experience
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength according to common security requirements
 * This function helps users create secure passwords by checking multiple criteria
 * 
 * @param password - Password to validate
 * @returns Object containing validation result and specific failure reasons
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
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
  
  // Fix: Remove unnecessary escape characters from regex
  // The original regex had unnecessary escapes for [ and /
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats a user's full name for display purposes
 * This function handles edge cases like missing names and provides consistent formatting
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name (optional)
 * @returns Formatted full name string
 */
export function formatUserName(firstName: string, lastName?: string): string {
  const trimmedFirst = firstName?.trim() ?? '';
  const trimmedLast = lastName?.trim() ?? '';
  
  if (!trimmedFirst && !trimmedLast) {
    return 'Anonymous User';
  }
  
  return `${trimmedFirst} ${trimmedLast}`.trim();
}

/**
 * Generates a user avatar URL using a profile picture service
 * This function creates consistent avatar URLs when users don't have profile pictures
 * 
 * @param user - User object with name information
 * @param size - Avatar size in pixels (default: 40)
 * @returns URL string for the generated avatar
 */
export function generateAvatarUrl(user: User, size: number = 40): string {
  const name = formatUserName(user.firstName, user.lastName);
  const encodedName = encodeURIComponent(name);
  
  // Use a deterministic background color based on user ID for consistency
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FECA57', 'DDA0DD', 'F8C471', '85C1E9'];
  const colorIndex = user.id.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=${backgroundColor}&color=fff&bold=true`;
}

/**
 * Checks if a user has a specific role
 * This function provides a clean way to check user permissions in components
 * 
 * @param user - User object to check
 * @param role - Role to check for
 * @returns true if user has the specified role, false otherwise
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Checks if a user has any of the specified roles
 * This function is useful for checking multiple role permissions at once
 * 
 * @param user - User object to check
 * @param roles - Array of roles to check against
 * @returns true if user has any of the specified roles, false otherwise
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  return user ? roles.includes(user.role) : false;
}

/**
 * Gets the user's display name with fallback options
 * This function ensures we always have something to display for a user
 * 
 * @param user - User object
 * @returns Display name string, using email as fallback if name is unavailable
 */
export function getUserDisplayName(user: User): string {
  const fullName = formatUserName(user.firstName, user.lastName);
  
  // If we don't have a proper name, use the email prefix as a fallback
  if (fullName === 'Anonymous User') {
    return user.email.split('@')[0] || 'User';
  }
  
  return fullName;
}

/**
 * Calculates user trust level based on trust score
 * This function converts numeric trust scores to human-readable trust levels
 * 
 * @param trustScore - Numeric trust score (0-5)
 * @returns Trust level string for display
 */
export function getTrustLevel(trustScore: number): string {
  if (trustScore >= 4.5) return 'Excellent';
  if (trustScore >= 4.0) return 'Very Good';
  if (trustScore >= 3.5) return 'Good';
  if (trustScore >= 3.0) return 'Fair';
  if (trustScore >= 2.0) return 'Poor';
  return 'New User';
}

/**
 * Formats trust score for display with appropriate precision
 * This function ensures consistent trust score formatting across the application
 * 
 * @param trustScore - Numeric trust score
 * @returns Formatted trust score string
 */
export function formatTrustScore(trustScore: number): string {
  return trustScore.toFixed(1);
}

/**
 * Sanitizes user input by removing potentially harmful characters
 * This function provides basic input sanitization for user-provided data
 * 
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML-like characters
    .substring(0, 1000); // Limit length to prevent abuse
}

/**
 * Creates a user-friendly error message from various error types
 * This function standardizes error message formatting for better user experience
 * 
 * @param error - Error object, string, or unknown error type
 * @returns User-friendly error message string
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Helper function to create LoginCredentials object from individual parameters
 * This function bridges the gap between old and new function signatures
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns LoginCredentials object
 */
export function createLoginCredentials(email: string, password: string): LoginCredentials {
  return { email, password };
}

/**
 * Helper function to create RegisterData object from individual parameters
 * This function bridges the gap between old and new function signatures
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email address
 * @param password - User's password
 * @param role - User's role
 * @param phone - User's phone number (optional)
 * @returns RegisterData object
 */
export function createRegisterData(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: UserRole,
  phone?: string
): RegisterData {
  return {
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
  };
}