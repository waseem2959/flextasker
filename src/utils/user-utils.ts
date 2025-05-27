/**
 * User Utilities with TypeScript Improvements
 * 
 * This file contains user-related utility functions with improved
 * TypeScript typing for better type safety.
 */

import { User } from '@/types';

/**
 * Formats a user's full name for display purposes
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name (optional)
 * @returns Formatted full name string
 */
export function formatUserName(firstName: string, lastName?: string): string {
  if (!firstName && !lastName) {
    return 'User';
  }
  
  if (!lastName) {
    return firstName.trim();
  }
  
  if (!firstName) {
    return lastName.trim();
  }
  
  return `${firstName.trim()} ${lastName.trim()}`;
}

// Note: generateAvatarUrl has been moved to avatar.ts for centralized avatar handling

/**
 * Gets the user's display name with fallback options
 * 
 * @param user - User object
 * @returns Display name string, using email as fallback if name is unavailable
 */
export function getUserDisplayName(user: User): string {
  if (user.firstName && user.lastName) {
    return formatUserName(user.firstName, user.lastName);
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.lastName) {
    return user.lastName;
  }
  
  // Use email as fallback, but truncate the domain part for privacy
  if (user.email) {
    const emailParts = user.email.split('@');
    return emailParts[0];
  }
  
  return 'User';
}

/**
 * Calculates user trust level based on trust score
 * 
 * @param trustScore - Numeric trust score (0-5)
 * @returns Trust level string for display
 */
export function getTrustLevel(trustScore: number): string {
  if (trustScore >= 4.5) return 'Excellent';
  if (trustScore >= 4.0) return 'Very Good';
  if (trustScore >= 3.5) return 'Good';
  if (trustScore >= 3.0) return 'Satisfactory';
  if (trustScore >= 2.0) return 'Fair';
  if (trustScore >= 1.0) return 'Poor';
  return 'Untrusted';
}

/**
 * Formats trust score for display with appropriate precision
 * 
 * @param trustScore - Numeric trust score
 * @returns Formatted trust score string
 */
export function formatTrustScore(trustScore: number): string {
  // Ensure the score is within valid range
  const score = Math.max(0, Math.min(5, trustScore));
  
  // Format with one decimal place
  return score.toFixed(1);
}

/**
 * Sanitizes user input by removing potentially harmful characters
 * 
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Basic sanitization by removing potentially harmful characters
  // Note: For production use, consider a more robust sanitization library
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
