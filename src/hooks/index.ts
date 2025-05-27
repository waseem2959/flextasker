/**
 * Hooks Index with TypeScript Improvements
 * 
 * This file provides a central export point for all hooks
 * with improved TypeScript typing and organization.
 */

// Export core API hooks
export * from './use-api';
export * from './use-api-enhanced';

// Export authentication hooks
export * from './use-auth';

// Export domain-specific hooks with standard implementations
export * from './use-tasks';
export * from './use-bids';
export * from './use-users';

// Export domain-specific hooks with enhanced implementations
// These include optimistic updates, background refresh, and offline support
export * from './use-tasks-enhanced';
export * from './use-bids-enhanced';
export * from './use-users-enhanced';
export * from './use-reviews-enhanced';
export * from './use-notifications-enhanced';

// Export UI-related hooks
export * from './use-form-field';
export * from './use-form-validation';
export * from './use-mobile';
export * from './use-sidebar';
export * from './use-toast';
