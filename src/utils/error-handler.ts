/**
 * Error Handler Utilities
 * 
 * This module provides utilities for handling and formatting errors
 * throughout the application, including database-specific error handling.
 */

import { AppError, ConflictError, NotFoundError, ErrorType } from '@/types/errors';

export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Define a simplified database error interface for consistent error handling
interface DatabaseError {
  code: string;
  meta?: {
    target?: string[];
    modelName?: string;
    field_name?: string;
    relation_name?: string;
    table?: string;
    column?: string;
  };
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
 * Handle database-specific errors (Prisma, etc.)
 * Map database error codes to appropriate application errors
 */
export function handleDatabaseError(error: DatabaseError, context?: string): never {
  const contextMessage = context ? ` (${context})` : '';
  
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const fields = error.meta?.target as string[] || [];
      throw new ConflictError(
        `A record with this information already exists${contextMessage}`,
        { 
          businessRule: 'UNIQUE_CONSTRAINT',
          metadata: { fields }
        }
      );
      
    case 'P2025': // Record not found
      throw new NotFoundError(
        `The requested resource does not exist${contextMessage}`
      );
      
    case 'P2003': // Foreign key constraint failed
      throw new ConflictError(
        `Cannot perform operation due to related data${contextMessage}`,
        { 
          businessRule: 'FOREIGN_KEY_CONSTRAINT',
          metadata: { relation: error.meta?.relation_name }
        }
      );
      
    case 'P2014': // Required relation is missing
      throw new ConflictError(
        `Missing required relationship${contextMessage}`,
        { 
          businessRule: 'REQUIRED_RELATION_MISSING',
          metadata: { relation: error.meta?.relation_name }
        }
      );
      
    case 'P2000': // Value out of range for field
      throw new ConflictError(
        `Invalid value provided${contextMessage}`,
        { 
          businessRule: 'VALUE_OUT_OF_RANGE',
          metadata: { field: error.meta?.field_name }
        }
      );
      
    case 'P2001': // Record searched for does not exist
      throw new NotFoundError(
        `Record not found${contextMessage}`
      );
      
    case 'P2015': // Related record not found
      throw new NotFoundError(
        `Related record not found${contextMessage}`
      );
      
    case 'P2021': // Table does not exist
    case 'P2022': // Column does not exist
      throw new AppError(
        `Database schema error${contextMessage}`,
        ErrorType.DATABASE,
        500,
        { 
          businessRule: 'SCHEMA_ERROR',
          metadata: { 
            table: error.meta?.table,
            column: error.meta?.column 
          }
        }
      );
      
    default:
      // Generic database error
      throw new AppError(
        `Database operation failed${contextMessage}`,
        ErrorType.DATABASE,
        500,
        { 
          businessRule: 'DATABASE_ERROR',
          metadata: error.meta
        }
      );
  }
}

/**
 * Check if an error is a database error
 */
export function isDatabaseError(error: any): boolean {
  return error?.code && error.code.startsWith('P');
}

/**
 * Format database error for user display
 */
export function formatDatabaseError(error: DatabaseError): string {
  switch (error.code) {
    case 'P2002':
      const fields = error.meta?.target as string[] || [];
      if (fields.includes('email')) {
        return 'An account with this email address already exists.';
      }
      return 'This information is already in use.';
      
    case 'P2025':
    case 'P2001':
      return 'The requested item was not found.';
      
    case 'P2003':
      return 'Cannot delete this item because it is being used elsewhere.';
      
    case 'P2014':
      return 'Missing required information.';
      
    default:
      return 'A database error occurred. Please try again.';
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
  logError,
  handleDatabaseError,
  isDatabaseError,
  formatDatabaseError
};
