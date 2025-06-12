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


// Extract nested functions for easier access (with safe checks)
export const createLoginCredentials = credentialUtils?.createLoginCredentials || (() => ({}));
export const createRegisterData = credentialUtils?.createRegisterData || (() => ({}));
export const hasRole = roleUtils?.hasRole || (() => false);
export const hasAnyRole = roleUtils?.hasAnyRole || (() => false);
export const isAdmin = roleUtils?.isAdmin || (() => false);
export const isClient = roleUtils?.isClient || (() => false);
export const isTasker = roleUtils?.isTasker || (() => false);

// Simplified exports (removed complex type re-exports)
export { authService, cleanupAuth, credentialUtils, initializeAuth, parseJwt, roleUtils, setupTokenRefresh, tokenManager };

// Default export for convenience
export default authService;