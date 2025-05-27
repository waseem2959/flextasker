/**
 * Consolidated API Hooks with TypeScript Improvements
 * 
 * This file provides a comprehensive set of API hooks with proper TypeScript
 * typing, consistent error handling, and integration with React Query.
 * 
 * All API hook functionality has been consolidated here to eliminate duplication
 * and provide a single source of truth for API interactions.
 */

import { useState, useCallback } from 'react';
import { 
  useQuery, 
  useMutation, 
  UseQueryOptions, 
  UseMutationOptions,
  QueryKey
} from '@tanstack/react-query';
import { apiClient } from '@/services/api/base-client';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { AppError, handleApiError } from '@/types/errors';

// No utility conversion needed since we now extract data directly in the API functions

/**
 * Utility function to handle API GET requests with proper typing
 */
async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint);
  return response.data;
}

/**
 * Utility function to handle paginated API GET requests
 */
async function apiGetPaginated<T>(endpoint: string, params?: Record<string, any>): Promise<PaginatedApiResponse<T>> {
  const response = await apiClient.get<PaginatedApiResponse<T>>(endpoint, { params });
  return response.data;
}

/**
 * Utility function to handle API POST requests
 */
async function apiPost<T, D = any>(endpoint: string, data: D): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(endpoint, data);
  return response.data;
}

/**
 * Utility function to handle API PUT requests
 */
async function apiPut<T, D = any>(endpoint: string, data: D): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(endpoint, data);
  return response.data;
}

/**
 * Utility function to handle API PATCH requests
 */
async function apiPatch<T, D = any>(endpoint: string, data: D): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(endpoint, data);
  return response.data;
}

/**
 * Utility function to handle API DELETE requests
 */
async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(endpoint);
  return response.data;
}

/**
 * Basic API state interface with proper typing
 */
export interface ApiState<T> {
  /** The data returned from the API call */
  data: T | null;
  /** Whether the API call is in progress */
  loading: boolean;
  /** Any error that occurred during the API call */
  error: AppError | null;
  /** Whether the API call has been executed at least once */
  called: boolean;
}

/**
 * API function type definition with proper typing
 */
export type ApiFunction<TParams, TResponse> = (
  params: TParams
) => Promise<ApiResponse<TResponse>>;

/**
 * API hook interface with proper typing
 */
export interface ApiHook<TParams, TResponse> {
  /** The current state of the API call */
  state: ApiState<TResponse>;
  /** A function that executes the API call */
  execute: (params: TParams) => Promise<TResponse | null>;
  /** Resets the API state to its initial values */
  reset: () => void;
}

/**
 * Creates a hook for making API calls with consistent state management
 * 
 * @param apiFunction - The API function to call
 * @returns A hook that manages API state and execution
 * 
 * @example
 * ```tsx
 * // Define the hook
 * const useGetUser = createApiHook(userService.getUser);
 * 
 * // Use the hook in a component
 * function UserProfile({ userId }) {
 *   const { state, execute } = useGetUser();
 *   
 *   useEffect(() => {
 *     execute(userId);
 *   }, [userId, execute]);
 *   
 *   if (state.loading) {
 *     return <Loading />;
 *   }
 *   
 *   if (state.error) {
 *     return <Error message={state.error.message} />;
 *   }
 *   
 *   if (state.data) {
 *     return <UserDetails user={state.data} />;
 *   }
 *   
 *   return null;
 * }
 * ```
 */
export function createApiHook<TParams, TResponse>(
  apiFunction: ApiFunction<TParams, TResponse>
): () => ApiHook<TParams, TResponse> {
  return () => {
    const [state, setState] = useState<ApiState<TResponse>>({
      data: null,
      loading: false,
      error: null,
      called: false,
    });

    const execute = useCallback(
      async (params: TParams): Promise<TResponse | null> => {
        setState(prevState => ({
          ...prevState,
          loading: true,
          error: null,
        }));

        try {
          const response = await apiFunction(params);
          
          if (!response.success) {
            throw new Error(response.message || 'API request failed');
          }

          const data = response.data || null;
          
          setState({
            data,
            loading: false,
            error: null,
            called: true,
          });

          return data;
        } catch (error) {
          const appError = handleApiError(error);
          
          setState({
            data: null,
            loading: false,
            error: appError,
            called: true,
          });

          return null;
        }
      },
      [apiFunction]
    );

    const reset = useCallback(() => {
      setState({
        data: null,
        loading: false,
        error: null,
        called: false,
      });
    }, []);

    return { state, execute, reset };
  };
}

/**
 * Enhanced useQuery hook with improved TypeScript support
 * 
 * @param queryKey - React Query cache key
 * @param endpoint - API endpoint to fetch
 * @param options - Additional React Query options
 * @returns Query result with proper typing
 */
export function useApiQuery<TData>(
  queryKey: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AppError, ApiResponse<TData>, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<TData>, AppError>({
    queryKey,
    queryFn: () => apiGet<TData>(endpoint),
    ...options,
  });
}

/**
 * Enhanced useQuery hook for paginated data
 * 
 * @param queryKey - React Query cache key
 * @param endpoint - API endpoint to fetch
 * @param params - Query parameters for pagination, filtering, etc.
 * @param options - Additional React Query options
 * @returns Query result with proper typing for paginated data
 */
export function usePaginatedQuery<TData>(
  queryKey: QueryKey,
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<PaginatedApiResponse<TData>, AppError, PaginatedApiResponse<TData>, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedApiResponse<TData>, AppError>({
    queryKey: [...queryKey, params],
    queryFn: () => apiGetPaginated<TData>(endpoint, params),
    ...options,
  });
}

/**
 * Enhanced useMutation hook for POST requests
 * 
 * @param endpoint - API endpoint for the POST request
 * @param options - Additional React Query mutation options
 * @returns Mutation result with proper typing
 */
export function usePostMutation<TData, TVariables = any>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPost<TData, TVariables>(endpoint, variables),
    ...options,
  });
}

/**
 * Enhanced useMutation hook for PUT requests
 * 
 * @param endpoint - API endpoint for the PUT request
 * @param options - Additional React Query mutation options
 * @returns Mutation result with proper typing
 */
export function usePutMutation<TData, TVariables = any>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPut<TData, TVariables>(endpoint, variables),
    ...options,
  });
}

/**
 * Enhanced useMutation hook for PATCH requests
 * 
 * @param endpoint - API endpoint for the PATCH request
 * @param options - Additional React Query mutation options
 * @returns Mutation result with proper typing
 */
export function usePatchMutation<TData, TVariables = any>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPatch<TData, TVariables>(endpoint, variables),
    ...options,
  });
}

/**
 * Enhanced useMutation hook for DELETE requests
 * 
 * @param getEndpoint - Function to generate the endpoint from variables
 * @param options - Additional React Query mutation options
 * @returns Mutation result with proper typing
 */
export function useDeleteMutation<TData, TVariables = any>(
  getEndpoint: (variables: TVariables) => string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiDelete<TData>(getEndpoint(variables)),
    ...options,
  });
}
