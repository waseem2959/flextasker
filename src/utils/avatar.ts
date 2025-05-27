
/**
 * Avatar Utilities with TypeScript Improvements
 * 
 * This file provides utilities for generating and working with user avatars
 * in a type-safe manner.
 */

import { User } from '@/types';

/**
 * Extract initials from a user's name
 * 
 * @param name - Full name to extract initials from
 * @returns Uppercase initials string
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

/**
 * Generates a user avatar URL using a profile picture service
 * 
 * @param user - User object with name information
 * @param size - Avatar size in pixels (default: 40)
 * @returns URL string for the generated avatar
 */
export function generateAvatarUrl(user: User, size: number = 40): string {
  if (user.avatar) {
    return user.avatar;
  }
  
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const encodedName = encodeURIComponent(name);
  
  // Use a placeholder avatar service with the user's name
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=random`;
}
