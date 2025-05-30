/**
 * Authentication Module
 * 
 * This module provides a comprehensive set of authentication-related functionality,
 * including API operations, token management, role checking, and initialization.
 */

// Re-export everything from the service file
export * from './service';
export * from './types';

// Export common aliases for backward compatibility
import { isAdmin, isClient, isTasker } from './service';

// These aliases maintain compatibility with previous code that used these function names
export const isAdminUser = isAdmin;
export const isClientUser = isClient;
export const isTaskerUser = isTasker;
