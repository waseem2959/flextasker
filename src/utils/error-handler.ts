/**
 * Error Handler Utilities
 * 
 * This module provides utilities for handling and formatting errors
 * throughout the application.
 */

export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Format an error message for display to users
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.statusText) {
    return error.response.statusText;
  }

  return 'An unexpected error occurred';
}

/**
 * Extract error details from various error formats
 */
export function extractErrorDetails(error: any): ErrorDetails {
  const message = formatErrorMessage(error);
  
  return {
    message,
    code: error?.code || error?.response?.data?.code,
    status: error?.status || error?.response?.status,
    details: error?.response?.data || error?.details
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('Network Error') ||
         !error?.response;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  return status === 401 || status === 403;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  return status === 400 || status === 422;
}

/**
 * Create an error boundary component (simplified version)
 */
export function createErrorBoundary(): any {
  // This is a placeholder - in a real implementation, you'd create a React error boundary
  return null;
}

/**
 * Handle async errors
 */
export function handleAsyncError(error: Error, context?: string): void {
  console.error(`Async error in ${context || 'unknown context'}:`, error);

  // In a real implementation, you might send this to an error tracking service
  if (typeof window !== 'undefined') {
    const errorEvent = new CustomEvent('asyncError', {
      detail: { error, context }
    });
    window.dispatchEvent(errorEvent);
  }
}

/**
 * Log error to console and external services
 */
export function logError(error: Error, context?: string): void {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // In production, you might want to send to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: errorTrackingService.captureException(error, { context });
  }
}

/**
 * Default export
 */
export default {
  formatErrorMessage,
  extractErrorDetails,
  isNetworkError,
  isAuthError,
  isValidationError,
  createErrorBoundary,
  handleAsyncError,
  logError
};
