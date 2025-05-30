/**
 * Hooks Index
 * 
 * This file provides a central export point for all hooks
 * with consistent naming conventions and organization.
 */

// Authentication hooks
export { default as useAuth } from './useAuth';

// Socket/Realtime hooks
export { default as useSocket } from './useSocket';
export { useSocketEvent } from './useSocket';

// Task-related hooks
export { default as useTask, useTaskList } from './useTask';
export * from './useTasks';

// Chat/Messaging hooks
export { default as useChat } from './useChat';

// Toast notifications
export { default as useToast, toast } from './useToast';

// API hooks
export * from './useApi';

// Domain-specific hooks
export * from './useBids';
export * from './useUsers';
export * from './useNotifications';

// UI and form-related hooks
export * from './useForm';
export * from './useMobile';
export * from './useSidebar';
