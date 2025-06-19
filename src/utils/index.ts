/**
 * Utility Functions Index with TypeScript Improvements
 *
 * This file provides a central export point for all utility functions
 * with improved TypeScript typing and organization.
 *
 * @deprecated Most utilities have been moved to @/lib/utils for better organization.
 * Use specific imports from @/lib/utils, @/lib/validation-utils, etc.
 */

// Re-export commonly used utilities from centralized locations
export * from '@/lib/utils';
export * from '@/lib/validation-utils';

// Export authentication utilities from consolidated auth module
export {
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

// Export type utilities from consolidated type adapters file
export {
    ensureDiscriminatedTask,
    ensureRegularTask,
    isBidStatus,
    isDiscriminatedTask,
    isRegularTask,
    isUserRole,
    toDiscriminatedTask,
    toRegularTask
} from './type-adapters';

// Export task utilities
export {
    formatBudget,
    formatTaskStatus,
    getStatusColor,
    getStatusIcon,
    getTaskStatusDisplayText,
    isTaskCompleted,
    isTaskInProgress,
    isTaskOpen
} from './task-utils';

// Export budget utilities
export {
    formatTaskBudget,
    getCurrencySymbol,
    calculatePlatformFee,
    validateBudget
} from './budget-utils';

// Export UI utilities
export {
    getResponsiveImageSrc,
    getResponsiveImageSrcSet
} from './ui-utils';

// Export security utilities
export {
    sanitizeHtml,
    sanitizeHTML,
    validateCSRFToken,
    isAuthenticated
} from './security';

// Export SEO utilities (placeholder version)
export {
    SEO,
    defaultSeoConfig,
    generateBreadcrumbSchema,
    generateOrganizationSchema,
    generateLocalBusinessSchema,
    generateProductSchema,
    generatePersonSchema,
    generateFAQSchema,
    generateJobPostingSchema
} from './seo';

// Export accessibility utilities
export {
    announceToScreenReader,
    focusElement,
    getAccessibleName,
    trapFocus
} from './accessibility';

// Export error handling utilities
export {
    createErrorBoundary,
    handleAsyncError,
    logError,
    handleDatabaseError,
    isDatabaseError,
    formatDatabaseError
} from './error-handler';

// Export form validation utilities (consolidated)
export {
    useFormValidation,
    registerSchema,
    loginSchema,
    profileUpdateSchema,
    passwordChangeSchema,
    contactFormSchema,
    createTaskSchema,
    taskUpdateSchema,
    taskSearchSchema
} from './form-validation';

