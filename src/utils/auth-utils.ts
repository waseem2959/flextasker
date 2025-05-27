/**
 * Authentication Utilities with TypeScript Improvements
 * 
 * This file contains authentication-related utility functions with
 * improved TypeScript typing and error handling.
 */

import { User, UserRole, LoginCredentials, RegisterData } from '@/types';
import { isValidEmail, validatePassword } from './validation';
import { tokenManager } from '@/services/api/token-manager';
import axios from 'axios';

// Note: Email and password validation functions have been moved to validation.ts
// Export them here for backward compatibility
export { isValidEmail, validatePassword };

/**
 * Parse a JWT token and extract the payload
 * 
 * @param token - JWT token to parse
 * @returns Parsed token payload as an object
 */
export function parseJwt(token: string): any {
  try {
    // Extract the payload (middle part of the token)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode the payload
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
}

/**
 * Set up proactive token refresh to prevent session expiration
 * This system refreshes tokens before they expire rather than waiting for 401 errors
 * 
 * @param refreshEndpoint - API endpoint for refreshing tokens
 * @returns Object with methods to control the refresh timer
 */
export function setupTokenRefresh(refreshEndpoint: string = '/auth/refresh-token') {
  let refreshTimeout: number | null = null;
  
  /**
   * Schedule a token refresh based on token expiration
   * @param token - The JWT access token
   */
  function scheduleRefresh(token: string) {
    // Clear any existing refresh timer
    if (refreshTimeout !== null) {
      window.clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    
    try {
      // Parse token to get expiration time
      const payload = parseJwt(token);
      if (!payload || !payload.exp) {
        console.warn('Token does not contain expiration information');
        return;
      }
      
      // Calculate time until expiration in milliseconds
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Schedule refresh 5 minutes before expiration
      // But not less than 30 seconds from now and not more than 1 hour
      const refreshBuffer = 5 * 60 * 1000; // 5 minutes
      const minRefreshTime = 30 * 1000; // 30 seconds
      const maxRefreshTime = 60 * 60 * 1000; // 1 hour
      
      let timeUntilRefresh = Math.max(timeUntilExpiration - refreshBuffer, minRefreshTime);
      timeUntilRefresh = Math.min(timeUntilRefresh, maxRefreshTime);
      
      if (import.meta.env.DEV) {
        console.log(`Token will be refreshed in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      }
      
      // Set up the timer to refresh
      refreshTimeout = window.setTimeout(async () => {
        try {
          // Get current refresh token
          const refreshToken = tokenManager.getRefreshToken();
          if (!refreshToken) {
            console.warn('No refresh token available');
            return;
          }
          
          // Call the refresh endpoint
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const response = await axios.post(`${API_BASE_URL}${refreshEndpoint}`, { refreshToken });
          
          // Extract and store new tokens
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          tokenManager.setTokens(accessToken, newRefreshToken);
          
          // Schedule next refresh
          scheduleRefresh(accessToken);
          
          if (import.meta.env.DEV) {
            console.log('🔄 Token refreshed successfully');
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Don't clear tokens here - let the 401 handler do it if needed
        }
      }, timeUntilRefresh);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }
  
  // Initialize with current token
  const currentToken = tokenManager.getToken();
  if (currentToken) {
    scheduleRefresh(currentToken);
  }
  
  // Define our custom event type
  type TokenChangedEvent = CustomEvent<{ token: string }>;
  
  // Listen for token changes (e.g., after login)
  document.addEventListener('token-changed', ((e: Event) => {
    const tokenEvent = e as TokenChangedEvent;
    if (tokenEvent.detail?.token) {
      scheduleRefresh(tokenEvent.detail.token);
    }
  }) as EventListener);
  
  return {
    /**
     * Manually reschedule token refresh
     */
    reschedule: () => {
      const token = tokenManager.getToken();
      if (token) {
        scheduleRefresh(token);
      }
    },
    
    /**
     * Clear the refresh timer
     */
    clearTimer: () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
    }
  };
}

/**
 * Checks if a user has a specific role
 * 
 * @param user - User object to check
 * @param role - Role to check for
 * @returns true if user has the specified role, false otherwise
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Checks if a user has any of the specified roles
 * 
 * @param user - User object to check
 * @param roles - Array of roles to check against
 * @returns true if user has any of the specified roles, false otherwise
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Helper function to create LoginCredentials object from individual parameters
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns LoginCredentials object
 */
export function createLoginCredentials(email: string, password: string): LoginCredentials {
  return {
    email,
    password
  };
}

/**
 * Helper function to create RegisterData object from individual parameters
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
    phone
  };
}

/**
 * Creates a user-friendly error message from various error types
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
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return 'An unknown error occurred';
}
