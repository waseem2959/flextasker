/**
 * UI Notifications
 * 
 * This file provides notification utilities for the application.
 * It exports functions to display various types of notifications
 * and is used throughout the application for user feedback.
 */

// Re-export the notification functions from the error handler
import {
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification
} from './errorHandler';

// Export notification functions
export {
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
  showWarningNotification
};
