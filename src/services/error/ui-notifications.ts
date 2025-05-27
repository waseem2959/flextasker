/**
 * UI Error Notifications
 * 
 * This module provides standardized error notifications for the UI layer.
 * It formats error messages and displays them using the toast system.
 */

import { toast } from '@/hooks/use-toast';
import { AppError, ErrorType } from './api-errors';

/**
 * Error notification configuration
 */
interface ErrorNotificationOptions {
  /**
   * Title of the notification
   */
  title?: string;
  
  /**
   * Whether to log the error to the console
   */
  logToConsole?: boolean;
  
  /**
   * Whether to show the error details in the notification
   */
  showDetails?: boolean;
  
  /**
   * Additional description text
   */
  description?: string;
  
  /**
   * Duration in milliseconds
   */
  duration?: number;
}

/**
 * Default options for error notifications
 */
const defaultOptions: ErrorNotificationOptions = {
  title: 'Error',
  logToConsole: true,
  showDetails: true,
  duration: 5000,
};

/**
 * Get the appropriate title for an error type
 */
function getTitleForErrorType(error: AppError | Error): string {
  if (!(error instanceof AppError)) {
    return 'Error';
  }
  
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Network Error';
    case ErrorType.AUTH:
      return 'Authentication Error';
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.PERMISSION:
      return 'Permission Denied';
    case ErrorType.SERVER:
      return 'Server Error';
    case ErrorType.TIMEOUT:
      return 'Request Timeout';
    default:
      return 'Error';
  }
}

/**
 * Show an error notification
 */
export function showErrorNotification(error: unknown, options: ErrorNotificationOptions = {}): void {
  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Determine error details
  let errorMessage: string;
  let errorTitle: string;
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorTitle = mergedOptions.title || getTitleForErrorType(error);
    
    // Log to console if enabled
    if (mergedOptions.logToConsole) {
      console.error(`${errorTitle}:`, error);
    }
  } else {
    errorMessage = 'An unknown error occurred';
    errorTitle = mergedOptions.title || 'Error';
    
    if (mergedOptions.logToConsole) {
      console.error(`${errorTitle}:`, error);
    }
  }
  
  // Show the toast notification
  toast({
    title: errorTitle,
    description: mergedOptions.description || 
      (mergedOptions.showDetails ? errorMessage : undefined),
    variant: 'destructive',
    duration: mergedOptions.duration,
  });
}

/**
 * Show a success notification
 */
export function showSuccessNotification(
  title: string, 
  description?: string, 
  duration = 3000
): void {
  toast({
    title,
    description,
    variant: 'default',
    duration,
  });
}

/**
 * Show an info notification
 */
export function showInfoNotification(
  title: string, 
  description?: string, 
  duration = 4000
): void {
  toast({
    title,
    description,
    variant: 'default',
    duration,
  });
}

/**
 * Show a warning notification
 */
export function showWarningNotification(
  title: string, 
  description?: string, 
  duration = 5000
): void {
  toast({
    title,
    description,
    variant: 'default',
    duration,
  });
}
