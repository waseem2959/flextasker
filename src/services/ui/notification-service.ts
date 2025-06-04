/**
 * Notification Service
 * 
 * This service provides a centralized system for displaying notifications
 * throughout the application. It supports different types of notifications
 * (success, error, info, warning) with customizable settings.
 */

import { toast, ToastAction } from '@/hooks/use-toast';

// ToastParams type removed - using Toast type from ui components directly

/**
 * Notification position options
 */
export enum NotificationPosition {
  TOP_RIGHT = 'top-right',
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center'
}

/**
 * Notification options for customizing appearance and behavior
 */
export interface NotificationOptions {
  /** Duration in milliseconds (default: 5000) */
  duration?: number;
  /** Any additional action */
  action?: ToastAction;
}

/**
 * Valid toast variants that match the actual implementation
 */
type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

/**
 * Default notification options
 */
const DEFAULT_OPTIONS: NotificationOptions = {
  duration: 5000
};

/**
 * Show a success notification
 * 
 * @param message - Notification message
 * @param title - Optional title (default: "Success")
 * @param options - Notification options
 */
export function showSuccessNotification(
  message: string,
  title = 'Success',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  toast({
    title,
    description: message,
    variant: 'success',
    duration: mergedOptions.duration,
    action: mergedOptions.action
  });
}

/**
 * Show an error notification
 * 
 * @param message - Error message
 * @param title - Optional title (default: "Error")
 * @param options - Notification options
 */
export function showErrorNotification(
  message: string,
  title = 'Error',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  toast({
    title,
    description: message,
    variant: 'destructive',
    duration: mergedOptions.duration,
    action: mergedOptions.action
  });
}

/**
 * Show an information notification
 * 
 * @param message - Information message
 * @param title - Optional title (default: "Information")
 * @param options - Notification options
 */
export function showInfoNotification(
  message: string,
  title = 'Information',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  toast({
    title,
    description: message,
    variant: 'info',
    duration: mergedOptions.duration,
    action: mergedOptions.action
  });
}

/**
 * Show a warning notification
 * 
 * @param message - Warning message
 * @param title - Optional title (default: "Warning")
 * @param options - Notification options
 */
export function showWarningNotification(
  message: string,
  title = 'Warning',
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  toast({
    title,
    description: message,
    variant: 'warning',
    duration: mergedOptions.duration,
    action: mergedOptions.action
  });
}

/**
 * Show a custom notification with specified variant
 * 
 * @param message - Notification message
 * @param title - Notification title
 * @param variant - Notification variant/style
 * @param options - Notification options
 */
export function showNotification(
  message: string,
  title: string,
  variant: ToastVariant,
  options: NotificationOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  toast({
    title,
    description: message,
    variant,
    duration: mergedOptions.duration,
    action: mergedOptions.action
  });
}

/**
 * Create a specialized notification service for a specific context
 * 
 * @param context - Context name to prepend to notification titles
 * @returns Object with notification methods for the context
 */
export function createContextNotifications(context: string) {
  return {
    success: (message: string, title = 'Success', options?: NotificationOptions) => 
      showSuccessNotification(message, `${context}: ${title}`, options),
      
    error: (message: string, title = 'Error', options?: NotificationOptions) => 
      showErrorNotification(message, `${context}: ${title}`, options),
      
    info: (message: string, title = 'Information', options?: NotificationOptions) => 
      showInfoNotification(message, `${context}: ${title}`, options),
      
    warning: (message: string, title = 'Warning', options?: NotificationOptions) => 
      showWarningNotification(message, `${context}: ${title}`, options),
      
    custom: (message: string, title: string, variant: ToastVariant, options?: NotificationOptions) => 
      showNotification(message, `${context}: ${title}`, variant, options)
  };
}

// Export service object with all functions
export const notificationService = {
  success: showSuccessNotification,
  error: showErrorNotification,
  info: showInfoNotification,
  warning: showWarningNotification,
  notify: showNotification,
  createContextNotifications
};

// Default export for convenience
export default notificationService;
