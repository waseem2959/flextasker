/**
 * Authentication Service
 * 
 * This module provides comprehensive authentication functionality:
 * - API operations (login, register, logout)
 * - Token management (storage, parsing, refresh)
 * - Role checking and validation
 * - Initialization and cleanup
 */

import { User, UserRole } from '@/types';
// Error handler removed for simplicity
import { isValidEmail, validatePassword } from '@/utils/validation';
import axios from 'axios';
import { apiClient } from '../api/api-client';
import {
    AuthResult,
    LoginCredentials,
    RegisterData,
    TokenRefreshConfig,
    TokenRefreshController
} from './auth-types';

/**
 * Token manager for handling token storage and retrieval
 */
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
    console.error('Error parsing JWT:', error instanceof Error ? error.message : String(error));
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
      console.warn('Error calculating token refresh time:', error instanceof Error ? error.message : String(error));
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
      console.error('Error refreshing token:', error instanceof Error ? error.message : String(error));
      clearTimer();
      
      // Call failure callback if provided
      if (config.onRefreshFailure) {
        config.onRefreshFailure(error instanceof Error ? error : new Error(String(error)));
      }
      
      // Dispatch auth error event
      document.dispatchEvent(new CustomEvent('auth-token-expired'));
    }
  };
  
  // Function to clear the refresh timer
  const clearTimer = (): void => {
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };
  
  // Function to schedule the next token refresh
  const scheduleRefresh = (token: string): void => {
    clearTimer(); // Clear any existing timer
    
    const refreshTimeMs = calculateRefreshTime(token);
    
    if (refreshTimeMs > 0) {
      refreshTimer = window.setTimeout(refreshToken, refreshTimeMs);
    }
  };
  
  // Start the initial refresh cycle if a token exists
  const currentToken = tokenManager.getToken();
  if (currentToken) {
    scheduleRefresh(currentToken);
  }
  
  // Return controller
  return {
    scheduleRefresh,
    clearRefreshTimer: clearTimer
  };
}

/**
 * Role checking utilities
 */
export const roleUtils = {
  /**
   * Checks if a user has a specific role
   * 
   * @param user - User object to check
   * @param role - Role to check for
   * @returns true if user has the specified role, false otherwise
   */
  hasRole(user: User | null, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role;
  },
  
  /**
   * Checks if a user has any of the specified roles
   * 
   * @param user - User object to check
   * @param roles - Array of roles to check against
   * @returns true if user has any of the specified roles, false otherwise
   */
  hasAnyRole(user: User | null, roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  },
  
  /**
   * Checks if a user is an admin
   * 
   * @param user - User to check
   * @returns Boolean indicating if user is an admin
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, UserRole.ADMIN);
  },
  
  /**
   * Checks if a user is a tasker
   * 
   * @param user - User to check
   * @returns Boolean indicating if user is a tasker
   */
  isTasker(user: User | null): boolean {
    return this.hasRole(user, UserRole.TASKER);
  },
  
  /**
   * Checks if a user is a regular user (client)
   * 
   * @param user - User to check
   * @returns Boolean indicating if user is a regular user
   */
  isClient(user: User | null): boolean {
    return this.hasRole(user, UserRole.USER);
  }
};

/**
 * Credential utilities
 */
export const credentialUtils = {
  /**
   * Helper function to create LoginCredentials object from individual parameters
   * 
   * @param email - User's email address
   * @param password - User's password
   * @param rememberMe - Whether to enable remember me functionality
   * @returns LoginCredentials object with validation
   */
  createLoginCredentials(
    email: string, 
    password: string,
    rememberMe: boolean = false
  ): LoginCredentials {
    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Validate password
    if (!password) {
      throw new Error('Please enter your password');
    }
    
    return {
      email: email.trim().toLowerCase(),
      password,
      rememberMe
    };
  },
  
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
  createRegisterData(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: UserRole = UserRole.USER,
    phone?: string
  ): RegisterData {
    // Validate name
    if (!firstName.trim()) {
      throw new Error('Please enter your first name');
    }
    
    if (!lastName.trim()) {
      throw new Error('Please enter your last name');
    }
    
    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message || 'Invalid password');
    }
    
    // Create the registration data
    const registerData: RegisterData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role
    };
    
    // Add optional fields if provided
    if (phone) {
      registerData.phone = phone.trim();
    }
    
    return registerData;
  }
};

/**
 * Authentication service operations
 */
export const authService = {
  /**
   * Registers a new user
   * 
   * @param data Registration data
   * @returns Promise resolving to auth result
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/auth/register', data);
      
      if (response.success && response.data) {
        const { token, refreshToken, user } = (response.data as any);
        
        // Store the tokens
        tokenManager.setTokens(token, refreshToken);
        
        return {
          success: true,
          message: 'Registration successful',
          user
        };
      }
      
      return {
        success: false,
        message: (response as any).message || 'Registration failed'
      };
    } catch (error) {
      return {
        success: false,
        message: (error instanceof Error ? error.message : String(error)) || 'Registration failed'
      };
    }
  },
  
  /**
   * Logs in an existing user
   * 
   * @param credentials Login credentials
   * @returns Promise resolving to auth result
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { token, refreshToken, user } = (response.data as any);
        
        // Store the tokens
        tokenManager.setTokens(token, refreshToken);
        
        return {
          success: true,
          message: 'Login successful',
          user
        };
      }
      
      return {
        success: false,
        message: (response as any).message || 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        message: (error instanceof Error ? error.message : String(error)) || 'Login failed'
      };
    }
  },
  
  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    try {
      // Call the logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Error during logout:', error instanceof Error ? error.message : String(error));
    } finally {
      // Clear tokens even if the API call fails
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
    const response = await apiClient.get('/users/me');
    
    if (response.success && response.data) {
      return (response.data as any);
    }
    
    throw new Error((response as any).message || 'Failed to get current user');
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
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
  },
  
  /**
   * Resets password using reset token
   * 
   * @param token Reset token
   * @param password New password
   */
  async resetPassword(token: string, password: string): Promise<void> {
    if (!token) {
      throw new Error('Invalid password reset token');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
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
    const response = await apiClient.put('/users/me', userData);
    
    if (response.success && response.data) {
      return (response.data as any);
    }
    
    throw new Error((response as any).message || 'Failed to update profile');
  },
  
  /**
   * Changes user password
   * 
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!currentPassword) {
      throw new Error('Current password is required');
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message || 'Invalid new password');
    }
    
    await apiClient.put('/users/me/password', { 
      currentPassword, 
      newPassword 
    });
  }
};

/**
 * Initialize authentication systems
 * - Sets up proactive token refresh
 * - Configures global auth-related event listeners
 * 
 * @returns Object containing references to initialized systems
 */
export function initializeAuth(): { refreshController: TokenRefreshController } {
  // Initialize token refresh
  const refreshController = setupTokenRefresh({
    refreshEndpoint: '/auth/refresh-token', // Simplified endpoint
    onRefreshFailure: () => {
      // Clear tokens on refresh failure
      tokenManager.clearTokens();
      
      // Redirect to login page
      window.location.href = '/login?session=expired';
    }
  });
  
  // Set up event listeners
  window.addEventListener('storage', (event) => {
    if (event.key === tokenManager.TOKEN_KEY && !event.newValue) {
      // Token was removed in another tab
      document.dispatchEvent(new CustomEvent('auth-logout'));
    }
  });
  
  return { refreshController };
}

/**
 * Clean up authentication systems
 * Useful for testing and hot module reloading
 */
export function cleanupAuth(): void {
  // This is a stub that could be expanded if needed
  document.dispatchEvent(new CustomEvent('auth-cleanup'));
}

// All exports are already declared above with individual export statements
