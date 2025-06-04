/**
 * Authentication Types
 * 
 * This module provides type definitions for the authentication service
 */

import { User } from '@/types';

/**
 * Login credentials
 */
export interface LoginCredentials {
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's password
   */
  password: string;
  
  /**
   * Whether to enable remember me functionality
   */
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegisterData {
  /**
   * User's first name
   */
  firstName: string;
  
  /**
   * User's last name
   */
  lastName: string;
  
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's password
   */
  password: string;
  
  /**
   * User's role
   */
  role?: string;
  
  /**
   * User's phone number (optional)
   */
  phone?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  /**
   * Whether the authentication was successful
   */
  success: boolean;
  
  /**
   * Status message
   */
  message: string;
  
  /**
   * User data (if authentication was successful)
   */
  user?: User;
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
  /**
   * Endpoint for token refresh
   */
  refreshEndpoint: string;
  
  /**
   * Callback for successful token refresh
   */
  onRefreshSuccess?: (tokens: { accessToken: string; refreshToken: string }) => void;
  
  /**
   * Callback for failed token refresh
   */
  onRefreshFailure?: (error: Error) => void;
}

/**
 * Token refresh controller
 */
export interface TokenRefreshController {
  /**
   * Schedule a token refresh
   */
  scheduleRefresh: (token: string) => void;
  
  /**
   * Clear the refresh timer
   */
  clearRefreshTimer: () => void;
}
