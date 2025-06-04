/**
 * Authentication Initializer
 * 
 * This module handles the initialization of the authentication system,
 * including token refreshing, session management, and auth state persistence.
 */
import { logger } from '../services/logging';
import { AuthSecurity, setupSecurityEventListeners } from './security';

/**
 * Initialize the authentication system
 * 
 * This function should be called early in the application lifecycle,
 * typically before rendering the app.
 */
export function initializeAuth(): void {
  try {
    // Set up security event listeners for token refresh and session management
    setupSecurityEventListeners();
      // Validate existing tokens
    const authData = AuthSecurity.getAuthData();
    if (authData?.token && AuthSecurity.isTokenExpired(authData.token)) {
      // Token is expired, clear it to trigger re-login
      AuthSecurity.clearAuthData();
      logger.warn('Expired authentication token detected and cleared');
    }
    
    // Log success
    logger.info('Auth initialization successful');
  } catch (error) {
    // Log error but don't crash the application
    logger.error('Failed to initialize authentication system', { error });
  }
}

/**
 * Check if the user is authenticated
 * 
 * @returns True if the user is authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  // This is a simple check - actual implementation would likely be more complex
  const token = localStorage.getItem('auth_token');
  return !!token && !isTokenExpired(token);
}

/**
 * Check if a token is expired
 * 
 * @param token The JWT token to check
 * @returns True if the token is expired, false otherwise
 */
function isTokenExpired(token: string): boolean {
  try {
    // Parse the token (JWT format: header.payload.signature)
    const payload = token.split('.')[1];
    
    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedPayload.exp < currentTime;
  } catch {
    // If we can't parse the token, consider it expired
    return true;
  }
}

export default {
  initializeAuth,
  isAuthenticated
};
