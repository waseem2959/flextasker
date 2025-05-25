// src/lib/react-query.ts
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientConfig
} from '@tanstack/react-query';

// Define custom error type for better error handling
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Create query cache with global error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Only show error notifications for user-facing queries
    if (query.meta?.showErrorNotification) {
      const apiError = error as ApiError;
      console.error(`Query error [${query.queryKey}]:`, apiError.message);
      // Show notification to user
      // notificationService.error(apiError.message);
    }
  },
});

// Create mutation cache with global error handling
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Only show error notifications if not handled locally
    if (mutation.meta?.showErrorNotification !== false) {
      const apiError = error as ApiError;
      console.error('Mutation error:', apiError.message);
      // Show notification to user
      // notificationService.error(apiError.message);
    }
  },
});

// Create the configuration
const queryClientConfig: QueryClientConfig = {
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Consider data stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000,
      
      // Network mode - how queries behave with respect to network status
      networkMode: 'offlineFirst',
      
      // Retry configuration with type-safe error handling
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        
        // Don't retry on specific HTTP status codes
        if (apiError.status && [400, 401, 403, 404, 422].includes(apiError.status)) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus only in production
      refetchOnWindowFocus: import.meta.env.PROD,
      
      // Always refetch on reconnect
      refetchOnReconnect: 'always',
    },
    
    mutations: {
      // Network mode for mutations
      networkMode: 'online',
      
      // Retry failed mutations once
      retry: 1,
      
      // Fixed retry delay for mutations
      retryDelay: 1000,
    },
  },
};

// Create the query client
export const queryClient = new QueryClient(queryClientConfig);

// Helper function to invalidate queries with proper typing
export function invalidateQueries(queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}

// Helper function to set query data with proper typing
export function setQueryData<T>(
  queryKey: readonly unknown[],
  updater: T | ((oldData: T | undefined) => T)
) {
  return queryClient.setQueryData(queryKey, updater);
}

// Helper function to get query data with proper typing
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}