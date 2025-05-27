/**
 * API Error Handling
 * 
 * NOTICE: This file is deprecated and will be removed in a future version.
 * Please import error types and utilities directly from '@/types/errors'.
 * 
 * This module now re-exports error types from the centralized types/errors.ts file
 * for backwards compatibility.
 */

import type { ApiResponse } from '@/types/api';
import {
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  isAppError,
  ErrorType,
  classifyError,
  createError,
  createErrorResponse,
  handleApiError as baseHandleApiError
} from '@/types/errors';

// Re-export all error classes and utilities for backwards compatibility
export {
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  isAppError,
  ErrorType,
  classifyError,
  createError,
  createErrorResponse
};

/**
 * Main error handling function
 * @deprecated Use handleApiError from '@/types/errors' instead
 */
export function handleApiError<T = any>(error: unknown): ApiResponse<T> {
  console.error('API Error:', error);
  
  // Use the base error handler to convert to an AppError
  const appError = baseHandleApiError(error);
  
  // Convert AppError to API response format
  return createErrorResponse(appError);
}
