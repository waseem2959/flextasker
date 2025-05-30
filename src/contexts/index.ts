/**
 * Contexts Index with TypeScript Improvements
 * 
 * This file provides a central export point for all contexts
 * with improved TypeScript typing and organization.
 */

// Export context instances
export { AuthContext, NotificationContext } from './contextInstance';

// Export context providers
export { AuthProvider } from './AuthContext';
export { NotificationProvider } from './NotificationContext';
export type { Notification } from './NotificationContext';
