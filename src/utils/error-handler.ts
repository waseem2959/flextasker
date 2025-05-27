/**
 * Error Handler Utility
 * 
 * This utility provides consistent error handling throughout the application,
 * with support for different error types, error logging, and user-friendly
 * error messages.
 * 
 * Uses the consolidated error types from src/types/errors.ts
 */

import { toast } from '@/hooks/use-toast';
import {
  AppError,
  ValidationError,
  AuthError as AuthenticationError,
  PermissionError as AuthorizationError,
  NotFoundError,
  NetworkError,
  isAppError
} from '@/types/errors';

// Re-export the error types for convenience
export { AppError };

// Define a type for error handler options
interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  throwError?: boolean;
  context?: string;
}

// Default options
const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  throwError: false,
  context: undefined
};

/**
 * Handle errors consistently throughout the application
 * 
 * @param error - The error to handle
 * @param options - Options for error handling behavior
 * @returns The formatted error message
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): string {
  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  const { showToast, logToConsole, throwError, context } = mergedOptions;
  
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: Record<string, any> = {};
  
  if (isAppError(error)) {
    // Using the consolidated AppError and its subclasses
    errorMessage = error.message;
    errorDetails = {
      code: error.code,
      status: error.status
    };
    
    // Add specific details based on error type
    if (error instanceof ValidationError) {
      errorDetails.fieldErrors = error.fieldErrors;
      errorDetails.details = error.details;
    } else if (error instanceof NotFoundError) {
      errorDetails.resourceType = error.resourceType;
      errorDetails.resourceId = error.resourceId;
    } else if (error instanceof NetworkError) {
      errorDetails.originalError = error.originalError;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Add context to the error message if provided
  const contextPrefix = context ? `[${context}] ` : '';
  const fullErrorMessage = `${contextPrefix}${errorMessage}`;
  
  // Show toast notification if enabled
  if (showToast) {
    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage
    });
  }
  
  // Log to console if enabled
  if (logToConsole) {
    console.error(`${contextPrefix}Error:`, error);
    if (Object.keys(errorDetails).length > 0) {
      console.error('Error details:', errorDetails);
    }
  }
  
  // Throw the error if enabled
  if (throwError) {
    throw error;
  }
  
  return fullErrorMessage;
}

/**
 * Create a context-specific error handler
 * 
 * @param context - The context for the error handler (e.g., component or service name)
 * @returns A pre-configured error handler function
 * 
 * @example
 * ```tsx
 * // In a TaskList component
 * const handleTaskError = createErrorHandler('TaskList');
 * 
 * try {
 */
export function createErrorHandler(context: string) {
  return (error: unknown, options: Partial<ErrorHandlerOptions> = {}) => {
    // Check for specific error types to provide better handling
    if (error instanceof AuthenticationError) {
      // Handle authentication errors (e.g., redirect to login)
      console.warn(`[${context}] Authentication error:`, error.message);
    } else if (error instanceof AuthorizationError) {
      // Handle authorization errors (e.g., show permission denied message)
      console.warn(`[${context}] Authorization error:`, error.message);
    }
    
    // Use the base error handler for consistent error handling
    return handleError(error, {
      ...options,
      context,
    });
  };
}
