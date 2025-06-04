/**
 * Standardized Library Exports
 * 
 * This file provides centralized exports for all library utilities and components
 * with consistent naming conventions and proper TypeScript typing.
 */

// Query-related exports
export { default as queryClient, queryUtils } from './query-client';
export { default as QueryProvider } from './query-provider';
export * from './query-types';
export { default as queryTypes } from './query-types';

// UI-related exports
export { default as badgeUtils, badgeVariants } from './badge-utils';
export { SidebarContext, default as sidebarUtils, useSidebar } from './sidebar-utils';
export { default as toggleUtils, toggleVariants } from './toggle-utils';
export { cn, formatCurrency, truncateText, default as uiUtils } from './ui-utils';

// Validation exports
export * from '@/services/validation';
export { default as validationUtils } from '@/services/validation';

// Date utilities exports - now consolidated in utils.ts
export { formatDate } from './utils';

// Re-export specific constants from sidebar utils for convenience
export {
    SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE
} from './sidebar-utils';

