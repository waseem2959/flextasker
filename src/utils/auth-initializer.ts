/**
 * Authentication Initializer
 * 
 * This utility provides a centralized way to initialize authentication
 * systems when the application starts.
 */

import { setupTokenRefresh } from './auth-utils';

/**
 * Global reference to token refresh controller
 */
let tokenRefreshController: ReturnType<typeof setupTokenRefresh> | null = null;

/**
 * Initialize authentication systems
 * - Sets up proactive token refresh
 * - Configures global auth-related event listeners
 */
export function initializeAuth() {
  // Set up token refresh system
  tokenRefreshController = setupTokenRefresh();
  
  // Listen for logout events to clear refresh timer
  document.addEventListener('auth-logout', () => {
    tokenRefreshController?.clearTimer();
  });
  
  // Return controller for testing/advanced usage
  return {
    tokenRefreshController
  };
}

/**
 * Clean up authentication systems
 * Useful for testing and hot module reloading
 */
export function cleanupAuth() {
  if (tokenRefreshController) {
    tokenRefreshController.clearTimer();
    tokenRefreshController = null;
  }
}
