/**
 * Authentication Types
 * 
 * This file defines types specific to authentication functionality.
 */

import { User, UserRole } from '@/types';

/**
 * Authentication result returned from login/register operations
 */
export interface AuthResult {
  token: string;
  refreshToken?: string;
  user: User;
}

/**
 * Data required for user registration
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
}

/**
 * Data required for user login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Configuration for token refresh
 */
export interface TokenRefreshConfig {
  refreshEndpoint: string;
  onRefreshSuccess?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onRefreshFailure?: (error: Error) => void;
}

/**
 * Token refresh controller object
 */
export interface TokenRefreshController {
  initialize: () => void;
  refreshToken: () => Promise<void>;
  scheduleRefresh: (token: string) => void;
  clearTimer: () => void;
  getRefreshTimer: () => number | null;
}
