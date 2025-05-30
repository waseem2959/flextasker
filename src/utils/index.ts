/**
 * Utility Functions Index with TypeScript Improvements
 * 
 * This file provides a central export point for all utility functions
 * with improved TypeScript typing and organization.
 */

// Export authentication utilities from consolidated auth module
// Note: We're being explicit about exports to avoid naming conflicts
import {
  parseJwt,
  setupTokenRefresh,
  hasRole,
  hasAnyRole,
  isAdmin,
  isTasker,
  isClient as isRegularUser,
  initializeAuth,
  cleanupAuth,
  createLoginCredentials,
  createRegisterData
} from '@/services/auth/service';

// Export consolidated type utilities
import {
  // Task type guards
  isOpenTask,
  isAcceptedTask,
  isInProgressTask,
  isCompletedTask,
  isCancelledTask,
  isDisputedTask,
  canAssignTask,
  canStartTask,
  canCompleteTask,
  canCancelTask,
  canDisputeTask,
  isUserRole,
  isBidStatus,
  
  // Type adapters
  toDiscriminatedTask,
  toRegularTask,
  isDiscriminatedTask,
  isRegularTask,
  ensureDiscriminatedTask,
  ensureRegularTask
} from './typeUtils';

// Export auth utilities
export {
  parseJwt,
  setupTokenRefresh,
  hasRole,
  hasAnyRole,
  isAdmin,
  isTasker,
  isRegularUser,
  initializeAuth,
  cleanupAuth,
  createLoginCredentials,
  createRegisterData
};

// Export type utilities
export {
  // Task type guards
  isOpenTask,
  isAcceptedTask,
  isInProgressTask,
  isCompletedTask,
  isCancelledTask,
  isDisputedTask,
  canAssignTask,
  canStartTask,
  canCompleteTask,
  canCancelTask,
  canDisputeTask,
  isUserRole,
  isBidStatus,
  
  // Type adapters
  toDiscriminatedTask,
  toRegularTask,
  isDiscriminatedTask,
  isRegularTask,
  ensureDiscriminatedTask,
  ensureRegularTask
};

// Export user-related utilities from consolidated module
export * from './user';

// Export error handling utilities
export * from './errorHandler';

// Export validation utilities
export * from './validation';

// Export date and time utilities
export * from './dateUtils';

// Export offline queue module
export * from './offlineQueue';
