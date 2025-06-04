/**
 * Enhanced React Query Client with TypeScript improvements
 * 
 * This standardized implementation provides a type-safe query client
 * for data fetching and mutation operations using React Query.
 */

import { NetworkError, ValidationError } from '@/types/errors';
import {
    DefaultOptions,
    MutationCache,
    QueryCache,
    QueryClient
} from '@tanstack/react-query';

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
        console.error(`Network error [${mutation.meta.name ?? 'mutation'}]:`, error.message);
      } else if (error instanceof ValidationError) {
        console.error(`Validation error [${mutation.meta.name ?? 'mutation'}]:`, error.details);
      } else {
        console.error(`Mutation error [${mutation.meta.name ?? 'mutation'}]:`, error);
      }
    }
  }
});

/**
 * Custom retry delay function that implements exponential backoff
 */
const retryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

/**
 * Default options for React Query with TypeScript enhancements
 */
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on validation errors or if we've already tried 3 times
      if (error instanceof ValidationError) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  },
  mutations: {
    retry: (failureCount, error) => {
      // Don't retry validation errors or if we've already tried twice
      if (error instanceof ValidationError) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay,
  },
};

/**
 * Enhanced query client with type-safe methods
 */
const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions,
});

/**
 * Helper methods with improved TypeScript typing
 */
export const queryUtils = {
  // Helper to invalidate queries with proper typing
  invalidateQueries: async (queryKey: readonly unknown[]): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey });
  },

  // Helper to set query data with proper typing
  setQueryData: <TData>(
    queryKey: readonly unknown[],
    updater: TData | ((oldData: TData | undefined) => TData)
  ): TData => {
    return queryClient.setQueryData(queryKey, updater) as TData;
  },

  // Helper to get query data with proper typing
  getQueryData: <TData>(queryKey: readonly unknown[]): TData | undefined => {
    return queryClient.getQueryData<TData>(queryKey);
  }
};

// Export the queryClient as default
export default queryClient;
