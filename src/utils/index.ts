/**
 * Utility Functions Index with TypeScript Improvements
 * 
 * This file provides a central export point for all utility functions
 * with improved TypeScript typing and organization.
 */

// Export authentication utilities from consolidated auth module
// Note: We're being explicit about exports to avoid naming conflicts
import {
    cleanupAuth,
    createLoginCredentials,
    createRegisterData,
    hasAnyRole,
    hasRole,
    initializeAuth,
    isAdmin,
    isClient as isRegularUser,
    isTasker,
    parseJwt,
    setupTokenRefresh
} from '@/services/auth';

export {
    cleanupAuth,
    createLoginCredentials,
    createRegisterData, hasAnyRole, hasRole, initializeAuth, isAdmin, isRegularUser, isTasker, parseJwt,
    setupTokenRefresh
};

// Export type utilities from consolidated type adapters file
    import {
        ensureDiscriminatedTask,
        ensureRegularTask,
        isBidStatus,
        isDiscriminatedTask,
        isRegularTask,
        isUserRole,
        // Type adapters
        toDiscriminatedTask,
        toRegularTask
    } from './type-adapters';

export {
    ensureDiscriminatedTask,
    ensureRegularTask,
    isBidStatus,
    isDiscriminatedTask,
    isRegularTask,
    isUserRole,
    // Type adapters
    toDiscriminatedTask,
    toRegularTask
};

// Export user-related utilities from consolidated module
    export * from '@/services/user';

// Export error handling utilities
// Error utils removed for simplicity

// Export validation utilities
export * from '@/services/validation';

// Export date and time utilities
export * from '@/services/date';

// Export offline queue module
export * from '@/services/offline';

// Export UI utilities from lib
export { cn, formatCurrency, truncateText, uiUtils } from '@/lib';

