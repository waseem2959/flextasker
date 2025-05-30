/**
 * Authentication Service
 * 
 * This file provides a comprehensive authentication service that combines:
 * - API operations (login, register, logout)
 * - Token management (storage, parsing, refresh)
 * - Role checking and validation
 * - Initialization and cleanup
 */

import { User, UserRole } from '@/types';
import { formatErrorMessage } from '@/utils/error-handler';
import { isValidEmail, validatePassword } from '@/utils/validation';
import { apiClient } from '../api/base-client';
import axios from 'axios';
import { 
  AuthResult, 
  LoginCredentials, 
  RegisterData, 
  TokenRefreshConfig, 
  TokenRefreshController 
} from './types';

/**
 * ===========================
 * TOKEN MANAGEMENT UTILITIES
 * ===========================
 */

// Token manager singleton for handling token storage and retrieval
export const tokenManager = {
  // Token storage keys
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'auth_refresh_token',
  
  /**
   * Sets the authentication token
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  },
  
  /**
   * Gets the stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  },
  
  /**
   * Removes the stored authentication token
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  },
  
  /**
   * Sets both access and refresh tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.setToken(accessToken);
    this.setRefreshToken(refreshToken);
  },
  
  /**
   * Sets the refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  },
  
  /**
   * Gets the stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },
  
  /**
   * Removes the stored refresh token
   */
  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  },
  
  /**
   * Clears all authentication tokens
   */
  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }
};

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
    console.error('Error parsing JWT:', formatErrorMessage(error));
    return {};
  }
}

/**
 * Set up proactive token refresh to prevent session expiration
 * This system refreshes tokens before they expire rather than waiting for 401 errors
 * 
 * @param config - Configuration for token refresh
 * @returns Object with methods to control the refresh timer
 */
export function setupTokenRefresh(
  config: TokenRefreshConfig = { refreshEndpoint: '/auth/refresh-token' }
): TokenRefreshController {
  let refreshTimer: number | null = null;
  
  // Calculate when to refresh the token (e.g., 5 minutes before expiration)
  const calculateRefreshTime = (token: string): number => {
    try {
      const payload = parseJwt(token);
      if (!payload || !payload.exp) {
        return 5 * 60 * 1000; // Default to 5 minutes if no expiration found
      }
      
      // Get expiration time in milliseconds
      const expMs = payload.exp * 1000;
      const nowMs = Date.now();
      
      // Calculate time until expiration
      const timeUntilExpMs = expMs - nowMs;
      
      // Refresh 5 minutes before expiration, or halfway to expiration if less than 10 minutes
      const refreshBufferMs = Math.min(5 * 60 * 1000, timeUntilExpMs / 2);
      
      return Math.max(timeUntilExpMs - refreshBufferMs, 0);
    } catch (error) {
      console.warn('Error calculating token refresh time:', formatErrorMessage(error));
      return 5 * 60 * 1000; // Default to 5 minutes on error
    }
  };
  
  // Function to refresh the token
  const refreshToken = async (): Promise<void> => {
    try {
      // Get the current refresh token
      const currentRefreshToken = tokenManager.getRefreshToken();
      
      if (!currentRefreshToken) {
        console.warn('No refresh token available');
        return;
      }
      
      // Call the refresh endpoint
      const response = await axios.post(config.refreshEndpoint, {
        refreshToken: currentRefreshToken
      });
      
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        
        // Update stored tokens
        tokenManager.setTokens(accessToken, refreshToken);
        
        // Schedule next refresh
        scheduleRefresh(accessToken);
        
        // Call success callback if provided
        if (config.onRefreshSuccess) {
          config.onRefreshSuccess({ accessToken, refreshToken });
        }
      } else {
        console.warn('Token refresh failed:', response.data.message);
        clearTimer();
        
        // Call failure callback if provided
        if (config.onRefreshFailure) {
          config.onRefreshFailure(new Error(response.data.message || 'Token refresh failed'));
        }
        
        // Dispatch auth error event
        document.dispatchEvent(new CustomEvent('auth-token-expired'));
      }
    } catch (error) {
      console.error('Error refreshing token:', formatErrorMessage(error));
      clearTimer();
      
      // Call failure callback if provided
      if (config.onRefreshFailure) {
        config.onRefreshFailure(error instanceof Error ? error : new Error('Unknown error'));
      }
      
      // Dispatch auth error event
      document.dispatchEvent(new CustomEvent('auth-token-expired'));
    }
  };
  
  // Schedule the next token refresh
  const scheduleRefresh = (token: string): void => {
    // Clear any existing timer
    clearTimer();
    
    // Calculate when to refresh
    const refreshInMs = calculateRefreshTime(token);
    
    // Schedule refresh
    refreshTimer = window.setTimeout(refreshToken, refreshInMs);
    
    console.log(`Token refresh scheduled in ${Math.round(refreshInMs / 1000 / 60)} minutes`);
  };
  
  // Clear the refresh timer
  const clearTimer = (): void => {
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };
  
  // Initialize token refresh if we have a token
  const initialize = (): void => {
    const currentToken = tokenManager.getToken();
    
    if (currentToken) {
      scheduleRefresh(currentToken);
    }
  };
  
  // Return controller object with methods
  return {
    initialize,
    refreshToken,
    scheduleRefresh,
    clearTimer,
    getRefreshTimer: () => refreshTimer
  };
}

/**
 * ===========================
 * ROLE CHECKING UTILITIES
 * ===========================
 */

/**
 * Checks if a user has a specific role
 * 
 * @param user - User object to check
 * @param role - Role to check for
 * @returns true if user has the specified role, false otherwise
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) {
    return false;
  }
  
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
  if (!user) {
    return false;
  }
  
  return roles.includes(user.role);
}

/**
 * Checks if a user is an admin
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, UserRole.ADMIN);
}

/**
 * Checks if a user is a tasker
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is a tasker
 */
export function isTasker(user: User | null): boolean {
  return hasRole(user, UserRole.TASKER);
}

/**
 * Checks if a user is a regular user (client)
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is a regular user
 */
export function isClient(user: User | null): boolean {
  return hasRole(user, UserRole.USER);
}

/**
 * ===========================
 * CREDENTIAL UTILITIES
 * ===========================
 */

/**
 * Helper function to create LoginCredentials object from individual parameters
 * 
 * @param email - User's email address
 * @param password - User's password
 * @param rememberMe - Whether to enable remember me functionality
 * @returns LoginCredentials object with validation
 */
export function createLoginCredentials(
  email: string, 
  password: string,
  rememberMe: boolean = false
): LoginCredentials {
  // Validate email format
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password (simple presence check here, more detailed in registration)
  if (!password || password.length < 1) {
    throw new Error('Password is required');
  }
  
  return {
    email,
    password,
    rememberMe
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
 * @returns RegisterData object with validation
 */
export function createRegisterData(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: UserRole = UserRole.USER,
  phone?: string
): RegisterData {
  // Validate names
  if (!firstName || firstName.trim().length < 1) {
    throw new Error('First name is required');
  }
  
  if (!lastName || lastName.trim().length < 1) {
    throw new Error('Last name is required');
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate password using the utility
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors[0] || 'Invalid password');
  }
  
  // Validate role
  if (!Object.values(UserRole).includes(role)) {
    throw new Error('Invalid user role');
  }
  
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
    ...(phone ? { phone: phone.trim() } : {})
  };
}

/**
 * ===========================
 * AUTH SERVICE API OPERATIONS
 * ===========================
 */

/**
 * Core authentication service with API operations
 */
export const authService = {
  /**
   * Registers a new user
   * 
   * @param data Registration data
   * @returns Promise resolving to auth result
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const response = await apiClient.post<{ success: boolean; data?: AuthResult; message?: string }>(
      '/auth/register', 
      data
    );
    
    if (response.data?.success && response.data?.data) {
      const result = response.data.data;
      
      // Store tokens
      tokenManager.setToken(result.token);
      if (result.refreshToken) {
        tokenManager.setRefreshToken(result.refreshToken);
      }
      
      return result;
    }
    
    throw new Error(response.data?.message || 'Registration failed');
  },
  
  /**
   * Logs in an existing user
   * 
   * @param credentials Login credentials
   * @returns Promise resolving to auth result
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await apiClient.post<{ success: boolean; data?: AuthResult; message?: string }>(
      '/auth/login', 
      credentials
    );
    
    if (response.data?.success && response.data?.data) {
      const result = response.data.data;
      
      // Store tokens
      tokenManager.setToken(result.token);
      if (result.refreshToken) {
        tokenManager.setRefreshToken(result.refreshToken);
      }
      
      return result;
    }
    
    throw new Error(response.data?.message || 'Login failed');
  },
  
  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    try {
      // Attempt to notify the server
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Error during logout:', formatErrorMessage(error));
      // Continue with local logout even if server call fails
    } finally {
      // Clear tokens
      tokenManager.clearTokens();
      
      // Dispatch logout event
      document.dispatchEvent(new CustomEvent('auth-logout'));
    }
  },
  
  /**
   * Gets the current authenticated user
   * 
   * @returns Promise resolving to user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data?: { user: User }; message?: string }>(
      '/auth/me'
    );
    
    if (response.data?.success && response.data?.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data?.message || 'Failed to get current user');
  },
  
  /**
   * Verifies a user's email
   * 
   * @param token Verification token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },
  
  /**
   * Initiates password reset
   * 
   * @param email User's email
   */
  async forgotPassword(email: string): Promise<void> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    await apiClient.post('/auth/forgot-password', { email });
  },
  
  /**
   * Resets password using reset token
   * 
   * @param token Reset token
   * @param password New password
   */
  async resetPassword(token: string, password: string): Promise<void> {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || 'Invalid password');
    }
    
    await apiClient.post('/auth/reset-password', { token, password });
  },
  
  /**
   * Updates user profile
   * 
   * @param userData User data to update
   * @returns Updated user
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ success: boolean; data?: { user: User }; message?: string }>(
      '/auth/profile',
      userData
    );
    
    if (response.data?.success && response.data?.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data?.message || 'Failed to update profile');
  },
  
  /**
   * Changes user password
   * 
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0] || 'Invalid new password');
    }
    
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }
};

/**
 * ===========================
 * AUTH INITIALIZATION
 * ===========================
 */

// Global refresh controller
let refreshController: TokenRefreshController | null = null;

/**
 * Initialize authentication systems
 * - Sets up proactive token refresh
 * - Configures global auth-related event listeners
 * 
 * @returns Object containing references to initialized systems
 */
export function initializeAuth(): { refreshController: TokenRefreshController } {
  // Create token refresh controller
  refreshController = setupTokenRefresh({
    refreshEndpoint: '/auth/refresh-token',
    onRefreshFailure: (error) => {
      console.error('Token refresh failed:', formatErrorMessage(error));
      // Could trigger a global state update or re-authentication flow here
    }
  });
  
  // Initialize token refresh
  refreshController.initialize();
  
  // Return references to initialized systems
  return { refreshController };
}

/**
 * Clean up authentication systems
 * Useful for testing and hot module reloading
 */
export function cleanupAuth(): void {
  // Clear token refresh timer
  if (refreshController) {
    refreshController.clearTimer();
    refreshController = null;
  }
}
