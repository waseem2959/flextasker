/**
 * Hooks Index
 * 
 * This file provides a central export point for all hooks
 * with consistent naming conventions and organization.
 */

// Authentication hooks
export { default as useAuth } from './use-auth';

// Socket/Realtime hooks
export { default as useSocket, useSocketEvent, useTaskUpdates } from './use-socket';

// Task-related hooks
export * from './use-tasks';

// Chat/Messaging hooks
export { default as useChat } from './use-chat';
export { useChat as useSocketChat } from './use-socket';

// Toast notifications
export { toast, useToast } from './use-toast';

// API hooks
export * from './use-api';

// Domain-specific hooks
export * from './use-bids';
export * from './use-notifications';
export * from './use-users';

// UI and form-related hooks
export * from './use-form';
// Don't export conflicting members from use-form-field
// If you need specific non-conflicting exports from use-form-field, add them like:
// export { NonConflictingExport1, NonConflictingExport2 } from './use-form-field';
// Don't export conflicting members from use-form-validation
// If you need the useFormValidation from use-form-validation, you can rename it:
// useFormValidation consolidated into @/utils/form-validation
export { useIsMobile } from './use-mobile';
export * from './use-sidebar';

