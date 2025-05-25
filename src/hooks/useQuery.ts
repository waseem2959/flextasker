import {
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  useMutation as useReactMutation,
  useQuery as useReactQuery,
} from '@tanstack/react-query';

/**
 * Window Environment Variables Interface
 * 
 * Educational Note: Instead of using 'any' types, we create a specific interface
 * that describes the structure of environment variables that might be injected
 * into the window object by build tools like Vite or Create React App.
 */
interface WindowEnvironment {
  REACT_APP_API_URL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
}

/**
 * Extended Window Interface
 * 
 * Educational Note: This approach uses TypeScript's declaration merging to extend
 * the global Window interface safely, rather than casting to 'any'. This provides
 * type safety while allowing access to custom properties that might be added by
 * build tools or deployment processes.
 */
declare global {
  interface Window {
    __ENV__?: WindowEnvironment;
  }
}

/**
 * Environment Configuration
 * 
 * Educational Note: By centralizing configuration, we create a single source of truth
 * for environment-dependent values. This makes testing easier because we can mock
 * this configuration object, and it prevents scattered environment variable access
 * throughout our codebase.
 */
interface AppConfig {
  readonly apiUrl: string;
  readonly environment: 'development' | 'production' | 'test';
}

/**
 * Get environment variable with comprehensive type safety
 * 
 * Educational Note: This function demonstrates a defensive programming approach.
 * We check multiple possible sources for environment variables in order of
 * preference, with proper type guards at each step. This handles the reality
 * that different build tools and deployment environments inject variables differently.
 * 
 * Type Narrowing Insight: Notice that we don't need type assertions here because
 * TypeScript automatically narrows the types within our conditional blocks.
 * When we check `if (window.__ENV__?.[name])`, TypeScript knows the value is
 * a string inside that block, making `as string` assertions redundant.
 */
function getEnvironmentVariable(name: string, defaultValue: string): string {
  // First, check if we're in a browser environment with injected variables
  // TypeScript automatically narrows the type from 'string | undefined' to 'string'
  // within this conditional block, so no type assertion is needed
  if (typeof window !== 'undefined' && window.__ENV__?.[name]) {
    return window.__ENV__[name];
  }
  
  // Next, check if process.env is available (Node.js or build-time injection)
  // Again, TypeScript's type narrowing makes the type assertion unnecessary
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }
  
  // Finally, fall back to our default value
  return defaultValue;
}

/**
 * Application configuration with environment-aware defaults
 * 
 * Educational Note: Using 'as const' here creates a deeply readonly object,
 * which prevents accidental mutations and helps TypeScript provide better
 * type inference throughout your application.
 */
const appConfig: AppConfig = {
  apiUrl: getEnvironmentVariable('REACT_APP_API_URL', 'http://localhost:3000/api/v1'),
  environment: getEnvironmentVariable('NODE_ENV', 'development') as AppConfig['environment'],
} as const;

/**
 * API Response Types
 * 
 * Educational Note: These interfaces create a contract between frontend and backend.
 * By defining these types precisely, we catch integration errors at compile time
 * rather than runtime, leading to more reliable applications.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  pagination?: PaginationInfo;
  timestamp: string;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
  value?: unknown;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Type-safe response data interface
 * 
 * Educational Note: Instead of using 'any', we create a union type that represents
 * the possible shapes of response data. This maintains type safety while being
 * flexible enough to handle various API response formats.
 */
type ResponseData = 
  | ApiResponse<unknown>
  | { message?: string; errors?: ApiError[] }
  | { error?: string }
  | Record<string, unknown>;

/**
 * API Client with Enhanced Type Safety
 * 
 * Educational Note: This class demonstrates the Single Responsibility Principle
 * by focusing solely on HTTP communication. It encapsulates all the complexity
 * of making requests, handling authentication, and processing responses in one place.
 */
class ApiClientClass {
  private readonly baseURL: string;
  private readonly config: AppConfig;
  private token: string | null = null;

  constructor(config: AppConfig = appConfig) {
    this.config = config;
    this.baseURL = config.apiUrl;
  }

  /**
   * Authentication token management
   * 
   * Educational Note: These methods provide a clean interface for managing
   * authentication state. By keeping the token private and only exposing
   * these controlled methods, we prevent accidental token exposure or corruption.
   */
  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Header management with proper typing
   * 
   * Educational Note: This method centralizes header logic, making it easy to
   * add global headers like API versioning, request tracing, or client identification.
   * The return type is explicitly typed to ensure consistency.
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Environment': this.config.environment,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * HTTP method implementations with proper generics
   * 
   * Educational Note: Each method uses the same pattern but for different HTTP verbs.
   * The generic type parameter <T> flows through to the response handling, ensuring
   * end-to-end type safety from the API call to the consuming component.
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * Enhanced response handling with proper error management
   * 
   * Educational Note: This method implements comprehensive error handling that
   * covers network failures, JSON parsing errors, and HTTP status codes. Instead
   * of using 'any', we use a union type to represent possible response formats.
   */
  private async handleResponse<T>(response: Response, endpoint: string): Promise<ApiResponse<T>> {
    // Handle network-level errors
    if (!response) {
      throw new ApiClientError(
        'Network error: No response received',
        0,
        endpoint
      );
    }

    let responseData: ResponseData;
    try {
      responseData = await response.json() as ResponseData;
    } catch (parseError) {
      // Educational Note: Here we properly handle the JSON parsing error
      // instead of just catching and ignoring it. We create a meaningful
      // error message that helps with debugging.
      const errorMessage = parseError instanceof Error 
        ? `Invalid JSON response: ${parseError.message}`
        : `Invalid JSON response: ${response.statusText}`;
      
      throw new ApiClientError(
        errorMessage,
        response.status,
        endpoint
      );
    }

    // Handle HTTP error status codes
    if (!response.ok) {
      // Use nullish coalescing instead of logical OR for safer default handling
      const errorMessage = this.extractErrorMessage(responseData) ?? 
        `HTTP ${response.status}: ${response.statusText}`;
      
      const validationErrors = this.extractValidationErrors(responseData);
      
      throw new ApiClientError(errorMessage, response.status, endpoint, validationErrors);
    }

    // Type-safe response casting with validation
    return responseData as ApiResponse<T>;
  }

  /**
   * Helper methods for extracting error information
   * 
   * Educational Note: These helper methods encapsulate the logic for extracting
   * error information from various response formats. This makes the main response
   * handler cleaner and these methods are easier to test independently.
   */
  private extractErrorMessage(responseData: ResponseData): string | null {
    if (responseData && typeof responseData === 'object') {
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message;
      }
      if ('error' in responseData && typeof responseData.error === 'string') {
        return responseData.error;
      }
    }
    return null;
  }

  private extractValidationErrors(responseData: ResponseData): ApiError[] | undefined {
    if (responseData && typeof responseData === 'object' && 'errors' in responseData) {
      const errors = responseData.errors;
      if (Array.isArray(errors)) {
        return errors as ApiError[];
      }
    }
    return undefined;
  }
}

/**
 * Enhanced API Client Error Class
 * 
 * Educational Note: This error class provides rich context about failures,
 * making debugging much easier. The helper methods make it simple to identify
 * specific types of errors throughout your application.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly endpoint: string;
  public readonly validationErrors?: ApiError[];

  constructor(message: string, status: number, endpoint: string, validationErrors?: ApiError[]) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.endpoint = endpoint;
    this.validationErrors = validationErrors;

    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }

  isAuthenticationError(): boolean {
    return this.status === 401;
  }

  isAuthorizationError(): boolean {
    return this.status === 403;
  }

  isValidationError(): boolean {
    return this.status === 422 && this.validationErrors !== undefined;
  }

  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /**
   * Determine if an error is worth retrying
   * 
   * Educational Note: This method encapsulates retry logic in one place.
   * Generally, server errors (5xx) and rate limiting (429) are retryable,
   * while client errors (4xx) indicate problems with the request itself.
   */
  isRetryable(): boolean {
    return this.status >= 500 || this.isRateLimitError();
  }
}

// Export singleton instance
export const apiClient = new ApiClientClass();

/**
 * Enhanced React Query Wrapper with Modern API
 * 
 * Educational Note: This wrapper provides FlexTasker-specific behavior while
 * maintaining full React Query compatibility. Note that we removed the 'onError'
 * callback from the options because React Query v4+ handles errors differently.
 */
export function useQuery<
  TData = unknown,
  TError = ApiClientError,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useReactQuery<TData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    // Intelligent retry logic based on error characteristics
    retry: (failureCount, error) => {
      if (failureCount >= 3) {
        return false;
      }

      if (error instanceof ApiClientError) {
        return error.isRetryable();
      }

      return true;
    },
    // Exponential backoff with jitter
    retryDelay: (attemptIndex) => {
      const baseDelay = 1000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 0.1 * baseDelay;
      return Math.min(baseDelay + jitter, 30000);
    },
    ...options,
  });
}

/**
 * Enhanced Mutation Wrapper
 * 
 * Educational Note: For mutations, we handle errors in the consuming component
 * rather than in a global onError callback. This gives more control over
 * error handling for different types of operations.
 */
export function useMutation<
  TData = unknown,
  TError = ApiClientError,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useReactMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
  });
}

/**
 * Authenticated Query Hook with Error Handling
 * 
 * Educational Note: This hook demonstrates composition - it builds on our base
 * useQuery hook while adding authentication-specific behavior. The error
 * handling is now done through React Query's error boundary system or
 * component-level error handling.
 */
export function useAuthQuery<TData = unknown>(
  queryKey: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, ApiClientError, TData, QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, ApiClientError> {
  return useQuery<TData, ApiClientError>(
    queryKey,
    async () => {
      const response = await apiClient.get<TData>(endpoint);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new ApiClientError(
          response.message ?? 'API request failed',
          500,
          endpoint
        );
      }
    },
    options
  );
}

/**
 * Authenticated Mutation Hook
 * 
 * Educational Note: This hook provides a consistent pattern for making
 * authenticated mutations while letting the consuming component handle
 * success and error cases as appropriate for the specific use case.
 */
export function useAuthMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiClientError, TVariables>
): UseMutationResult<TData, ApiClientError, TVariables> {
  return useMutation<TData, ApiClientError, TVariables>(mutationFn, options);
}

/**
 * HTTP Method-Specific Utility Hooks
 * 
 * Educational Note: These hooks provide convenient, method-specific ways to
 * make API calls. They handle the common pattern of extracting data from
 * the standardized API response format while maintaining full type safety.
 */
export function usePostMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: UseMutationOptions<TData, ApiClientError, TVariables>
): UseMutationResult<TData, ApiClientError, TVariables> {
  return useAuthMutation<TData, TVariables>(
    async (variables: TVariables) => {
      const response = await apiClient.post<TData>(endpoint, variables);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new ApiClientError(
          response.message ?? 'POST request failed',
          500,
          endpoint,
          response.errors
        );
      }
    },
    options
  );
}

export function usePutMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: UseMutationOptions<TData, ApiClientError, TVariables>
): UseMutationResult<TData, ApiClientError, TVariables> {
  return useAuthMutation<TData, TVariables>(
    async (variables: TVariables) => {
      const response = await apiClient.put<TData>(endpoint, variables);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new ApiClientError(
          response.message ?? 'PUT request failed',
          500,
          endpoint,
          response.errors
        );
      }
    },
    options
  );
}

export function usePatchMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: UseMutationOptions<TData, ApiClientError, TVariables>
): UseMutationResult<TData, ApiClientError, TVariables> {
  return useAuthMutation<TData, TVariables>(
    async (variables: TVariables) => {
      const response = await apiClient.patch<TData>(endpoint, variables);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new ApiClientError(
          response.message ?? 'PATCH request failed',
          500,
          endpoint,
          response.errors
        );
      }
    },
    options
  );
}

export function useDeleteMutation<TData = unknown, TVariables = string>(
  getEndpoint: (variables: TVariables) => string,
  options?: UseMutationOptions<TData, ApiClientError, TVariables>
): UseMutationResult<TData, ApiClientError, TVariables> {
  return useAuthMutation<TData, TVariables>(
    async (variables: TVariables) => {
      const endpoint = getEndpoint(variables);
      const response = await apiClient.delete<TData>(endpoint);
      
      if (response.success && response.data !== undefined) {
        return response.data;
      } else {
        throw new ApiClientError(
          response.message ?? 'DELETE request failed',
          500,
          endpoint,
          response.errors
        );
      }
    },
    options
  );
}