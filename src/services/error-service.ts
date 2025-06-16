/**
 * Minimal Error Service
 * 
 * Provides basic error handling functions to maintain compatibility
 * while using the centralized error types.
 */

import { AppError } from '@/types/errors';

/**
 * Simple error service with basic notification functions
 */
export const errorService = {
  /**
   * Handle and log errors
   */
  handleError(error: unknown, context?: string): void {
    console.error(context || 'Error occurred:', error);
    
    // In a real implementation, this would integrate with a notification system
    if (error instanceof AppError) {
      console.error(`${context}: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`${context}: ${error.message}`);
    } else {
      console.error(`${context}: Unknown error`);
    }
  },

  /**
   * Show error notification (placeholder)
   */
  showErrorNotification(message: string): void {
    console.error('Error:', message);
    // In a real implementation, this would show a toast notification
  },

  /**
   * Show success notification (placeholder)
   */
  showSuccessNotification(message: string): void {
    console.log('Success:', message);
    // In a real implementation, this would show a toast notification
  }
};

/**
 * Show error notification function (standalone)
 */
export function showErrorNotification(message: string): void {
  errorService.showErrorNotification(message);
}

/**
 * Show success notification function (standalone)
 */
export function showSuccessNotification(message: string): void {
  errorService.showSuccessNotification(message);
}

export default errorService;
