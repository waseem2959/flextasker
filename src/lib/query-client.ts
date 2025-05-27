/**
 * Enhanced React Query Client with TypeScript improvements
 * Consolidates functionality from react-query.ts and react-query.tsx
 */

import {
  MutationCache,
  QueryCache,
  QueryClient,
  DefaultOptions
} from '@tanstack/react-query';
import { NetworkError, ValidationError } from '@/types/errors';

/**
 * Type-safe error handling configuration for React Query
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Only show error notifications for user-facing queries
    if (query.meta?.showErrorNotification) {
      if (error instanceof NetworkError) {
        console.error(`Network error [${query.queryKey.join(',')}]:`, error.message);
        // Network-specific error handling
      } else if (error instanceof ValidationError) {
        console.error(`Validation error [${query.queryKey.join(',')}]:`, error.details);
        // Validation-specific error handling
      } else {
        console.error(`Query error [${query.queryKey.join(',')}]:`, error);
      }
    }
  },
});

/**
 * Type-safe mutation error handling
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Only show error notifications if not handled locally
    if (mutation.meta?.showErrorNotification !== false) {
      if (error instanceof NetworkError) {
        console.error('Network error during mutation:', error.message);
      } else if (error instanceof ValidationError) {
        console.error('Validation error during mutation:', error.details);
      } else {
        console.error('Mutation error:', error);
      }
    }
  },
});

/**
 * Retry logic with discriminated error types
 */
function retry(failureCount: number, error: unknown): boolean {
  // Don't retry for validation errors
  if (error instanceof ValidationError) {
    return false;
  }
  
  // Retry network errors up to 3 times
  if (error instanceof NetworkError) {
    return failureCount < 3;
  }
  
  // Default: retry twice for other errors
  return failureCount < 2;
}

/**
 * Exponential backoff for retries
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Default options for React Query with TypeScript enhancements
 */
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry,
    retryDelay,
    refetchOnWindowFocus: import.meta.env.PROD,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false, // Don't retry mutations by default
  },
};

/**
 * Enhanced QueryClient with TypeScript improvements
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions,
});

/**
 * Helper to invalidate queries with proper typing
 */
export function invalidateQueries<T>(queryKey: readonly unknown[]): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Helper to set query data with proper typing
 */
export function setQueryData<TData>(
  queryKey: readonly unknown[],
  updater: TData | ((oldData: TData | undefined) => TData)
): TData {
  return queryClient.setQueryData<TData>(queryKey, updater);
}

/**
 * Helper to get query data with proper typing
 */
export function getQueryData<TData>(queryKey: readonly unknown[]): TData | undefined {
  return queryClient.getQueryData<TData>(queryKey);
}
