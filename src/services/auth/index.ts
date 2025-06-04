/**
 * Authentication Service Index
 * 
 * This file centralizes exports for authentication-related services.
 */

import {
    authService,
    cleanupAuth,
    credentialUtils,
    initializeAuth,
    parseJwt,
    roleUtils,
    setupTokenRefresh,
    tokenManager
} from './auth-service';


// Extract nested functions for easier access
export const createLoginCredentials = credentialUtils.createLoginCredentials;
export const createRegisterData = credentialUtils.createRegisterData;
export const hasRole = roleUtils.hasRole;
export const hasAnyRole = roleUtils.hasAnyRole;
export const isAdmin = roleUtils.isAdmin;
export const isClient = roleUtils.isClient;
export const isTasker = roleUtils.isTasker;

// Simplified exports (removed complex type re-exports)
export { authService, cleanupAuth, credentialUtils, initializeAuth, parseJwt, roleUtils, setupTokenRefresh, tokenManager };

// Default export for convenience
export default authService;