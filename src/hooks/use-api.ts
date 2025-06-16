/**
 * API Hooks with TypeScript Improvements
 * 
 * This file provides a comprehensive set of API hooks with proper TypeScript
 * typing, consistent error handling, and integration with React Query.
 */

import { apiClient } from '@/services/api/api-client';
import { ApiResponse, PaginatedApiResponse } from '@/types';
import { AppError } from '@/types/errors';
import {
    QueryKey,
    useMutation,
    UseMutationOptions,
    useQuery,
    UseQueryOptions
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// Utility functions for API calls
// Simplified API functions that properly handle the ApiResponse wrapper
export function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient.get(endpoint) as Promise<ApiResponse<T>>;
}

export function apiGetPaginated<T>(endpoint: string, params?: any): Promise<PaginatedApiResponse<T>> {
  // Using cast to handle the expected response format
  return apiClient.get(endpoint, { params }) as Promise<PaginatedApiResponse<T>>;
}

export function apiPost<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
  return apiClient.post(endpoint, data) as Promise<ApiResponse<T>>;
}

export function apiPut<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
  return apiClient.put(endpoint, data) as Promise<ApiResponse<T>>;
}

export function apiPatch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
  return apiClient.patch(endpoint, data) as Promise<ApiResponse<T>>;
}

export function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiClient.delete(endpoint) as Promise<ApiResponse<T>>;
}

/**
 * Basic API state interface with proper typing
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  called: boolean;
}

/**
 * API function type definition with proper typing
 */
export type ApiFunction<TParams, TResponse> = (params: TParams) => Promise<TResponse>;

/**
 * API hook interface with proper typing
 */
export interface ApiHook<TParams, TResponse> {
  state: ApiState<TResponse>;
  execute: (params: TParams) => Promise<TResponse | null>;
  reset: () => void;
}

/**
 * Creates a hook for making API calls with consistent state management
 */
export function createApiHook<TParams, TResponse>(
  apiFunction: ApiFunction<TParams, TResponse>
): () => ApiHook<TParams, TResponse> {
  return () => {
    const [state, setState] = useState<ApiState<TResponse>>({
      data: null,
      loading: false,
      error: null,
      called: false
    });

    const reset = useCallback(() => {
      setState({
        data: null,
        loading: false,
        error: null,
        called: false
      });
    }, []);

    const execute = useCallback(
      async (params: TParams): Promise<TResponse | null> => {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null
        }));

        try {
          const response = await apiFunction(params);
          setState({
            data: response,
            loading: false,
            error: null,
            called: true
          });
          return response;
        } catch (error) {
          let appError: AppError;
          
          if (error instanceof AppError) {
            appError = error;
          } else if (error instanceof Error) {
            appError = new AppError(error.message);
          } else {
            appError = new AppError('Unknown error');
          }
          
          setState({
            data: null,
            loading: false,
            error: appError,
            called: true
          });
          return null;
        }
      },
      [apiFunction]
    );

    return {
      state,
      execute,
      reset
    };
  };
}

/**
 * Enhanced useQuery hook with improved TypeScript support
 */
export function useApiQuery<TData>(
  queryKey: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AppError, ApiResponse<TData>, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<TData>, AppError>({
    queryKey,
    queryFn: () => apiGet<TData>(endpoint),
    ...options
  });
}

/**
 * Enhanced useQuery hook for paginated data
 */
export function usePaginatedQuery<TData>(
  queryKey: QueryKey,
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<PaginatedApiResponse<TData>, AppError, PaginatedApiResponse<TData>, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedApiResponse<TData>, AppError>({
    queryKey: params ? [...queryKey, params] : queryKey,
    queryFn: () => apiGetPaginated<TData>(endpoint, params),
    ...options
  });
}

/**
 * Enhanced useMutation hook for POST requests
 */
export function usePostMutation<TData, TVariables>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPost<TData>(endpoint, variables),
    ...options
  });
}

/**
 * Enhanced useMutation hook for PUT requests
 */
export function usePutMutation<TData, TVariables>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPut<TData>(endpoint, variables),
    ...options
  });
}

/**
 * Enhanced useMutation hook for PATCH requests
 */
export function usePatchMutation<TData, TVariables>(
  endpoint: string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiPatch<TData>(endpoint, variables),
    ...options
  });
}

/**
 * Enhanced useMutation hook for DELETE requests
 */
export function useDeleteMutation<TData, TVariables>(
  getEndpoint: (variables: TVariables) => string,
  options?: Omit<UseMutationOptions<ApiResponse<TData>, AppError, TVariables>, 'mutationFn'>
) {
  return useMutation<ApiResponse<TData>, AppError, TVariables>({
    mutationFn: (variables) => apiDelete<TData>(getEndpoint(variables)),
    ...options
  });
}
