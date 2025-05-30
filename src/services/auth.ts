/**
 * Authentication Service (Legacy Bridge)
 * 
 * IMPORTANT: This file provides backward compatibility with the legacy auth service implementation.
 * New code should use the consolidated implementation from auth/service.ts.
 * 
 * This bridge ensures existing code continues to function while we transition to the improved structure.
 */

// Import the consolidated auth service
import { authService as consolidatedAuthService } from './auth/service';
import { LoginCredentials, User, UserRole } from '@/types';

// Log deprecation warning in development
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'DEPRECATION NOTICE: Using services/auth.ts is deprecated. ' +
    'Please use services/auth/service.ts for all new code.'
  );
}

// Re-export the AuthResult interface for backward compatibility
export interface AuthResult {
  token: string;
  user: User;
}

/**
 * Authentication service that delegates to the consolidated implementation
 */
export const authService = {
  // Registration functionality
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<AuthResult> {
    return consolidatedAuthService.register(data);
  },

  // Login functionality
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    return consolidatedAuthService.login(credentials);
  },

  // Logout functionality
  async logout(): Promise<void> {
    return consolidatedAuthService.logout();
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    return consolidatedAuthService.getCurrentUser();
  },

  // Email verification
  async verifyEmail(token: string): Promise<void> {
    return consolidatedAuthService.verifyEmail(token);
  },

  // Password reset request
  async forgotPassword(email: string): Promise<void> {
    return consolidatedAuthService.forgotPassword(email);
  },

  // Password reset with token
  async resetPassword(token: string, password: string): Promise<void> {
    return consolidatedAuthService.resetPassword(token, password);
  }
};