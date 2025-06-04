/**
 * React Query Type Enhancement Utilities
 * 
 * This file provides type utilities for enhancing React Query hooks
 * with proper typing for API responses and error handling.
 */

import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { AppError } from '@/types/errors';

/**
 * Type for a standard API query result with proper error typing
 */
export type ApiQueryResult<T> = UseQueryResult<ApiResponse<T>, AppError>;

/**
 * Type for a paginated API query result with proper error typing
 */
export type PaginatedQueryResult<T> = UseQueryResult<PaginatedApiResponse<T>, AppError>;

/**
 * Type for a standard API mutation result with proper error typing
 */
export type ApiMutationResult<TData, TVariables = unknown> = 
  UseMutationResult<ApiResponse<TData>, AppError, TVariables>;

/**
 * Type for defining query keys with proper typing
 */
export type QueryKeyFactory<T extends string> = {
  all: readonly [T];
  lists: () => readonly [T, 'list'];
  list: <F extends Record<string, unknown>>(filters: F) => readonly [T, 'list', F];
  details: () => readonly [T, 'detail'];
  detail: (id: string) => readonly [T, 'detail', string];
};

/**
 * Creates a typed query key factory for a specific entity
 * 
 * @param entity - The entity name for which to create query keys
 * @returns A strongly typed query key factory
 */
export function createQueryKeys<T extends string>(entity: T): QueryKeyFactory<T> {
  return {
    all: [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: (filters) => [entity, 'list', filters] as const,
    details: () => [entity, 'detail'] as const,
    detail: (id) => [entity, 'detail', id] as const,
  };
}

/**
 * Creates a React Query error handler function with proper typing
 * 
 * @param fallbackMessage - Default message if error doesn't provide one
 * @returns A function that extracts error message from AppError
 */
export function createErrorHandler(fallbackMessage = 'An error occurred') {
  return (error: unknown): string => {
    if (error instanceof AppError) {
      return error.message || fallbackMessage;
    }
    
    if (error instanceof Error) {
      return error.message || fallbackMessage;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return fallbackMessage;
  };
}

export default {
  createQueryKeys,
  createErrorHandler
};
