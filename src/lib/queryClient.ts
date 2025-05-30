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
 * Type-safe mutation error handling configuration
 */
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Only show error notifications for user-facing mutations
    if (mutation.meta?.showErrorNotification) {
      if (error instanceof NetworkError) {
        console.error(`Network error [${mutation.meta.name || 'mutation'}]:`, error.message);
      } else if (error instanceof ValidationError) {
        console.error(`Validation error [${mutation.meta.name || 'mutation'}]:`, error.details);
      } else {
        console.error(`Mutation error [${mutation.meta.name || 'mutation'}]:`, error);
      }
    }
  }
});

const retry = (failureCount: number, error: unknown): boolean => {
  // Don't retry on validation errors
  if (error instanceof ValidationError) {
    return false;
  }

  // Retry network errors a few times
  if (error instanceof NetworkError) {
    return failureCount < 3;
  }

  // Default retry behavior
  return failureCount < 2;
};

const retryDelay = (attemptIndex: number): number => {
  // Exponential backoff: 1s, 2s, 4s, etc.
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

/**
 * Default options for React Query with TypeScript enhancements
 */
const defaultOptions: DefaultOptions = {
  queries: {
    retry,
    retryDelay,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (replacing cacheTime which is deprecated)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  mutations: {
    retry,
    retryDelay
  }
};

/**
 * Create and export the query client instance with advanced type safety
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions
});

/**
 * Typed helpers for working with the query client
 */

// Helper to invalidate queries with proper typing
export async function invalidateQueries(queryKey: readonly unknown[]): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
}

// Helper to set query data with proper typing
export function setQueryData<TData>(
  queryKey: readonly unknown[],
  updater: TData | ((oldData: TData | undefined) => TData)
): TData {
  return queryClient.setQueryData(queryKey, updater) as TData;
}

// Helper to get query data with proper typing
export function getQueryData<TData>(queryKey: readonly unknown[]): TData | undefined {
  return queryClient.getQueryData<TData>(queryKey);
}

export default queryClient;
