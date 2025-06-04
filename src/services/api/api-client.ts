/**
 * API Client
 * 
 * This service provides a consistent and type-safe way to interact with the API,
 * handling common concerns like error handling, authentication, and request formatting.
 */

import { config } from '../../config';
// Cache service removed for simplicity
// Performance monitoring removed for simplicity
import {
    ApiClientConfig,
    ApiError,
    ApiResponse
} from '../../../shared/types/common/api-types';
import { ErrorType, HttpStatusCode } from '../../../shared/types/common/enums';
import {
    AppError,
    AuthenticationError,
    createErrorFromType,
    NetworkError,
    NotFoundError,
    ServerError,
    TimeoutError,
    ValidationError
} from '../../../shared/types/common/error-types';

/**
 * Enhanced fetch options that extends the standard RequestInit
 * with additional properties specific to our API client
 */
export interface EnhancedRequestInit extends Omit<RequestInit, 'cache'> {
  // Set timeout in milliseconds
  timeout?: number;
  
  // Cache options (separate from the standard cache property)
  // Cache options removed for simplicity
  
  // Error handling options
  suppressErrors?: boolean;
  errorHandlers?: Record<number, (error: ApiError) => void>;
  
  // Retry options
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryStatusCodes: number[];
  };
}

/**
 * Default request options
 */
const DEFAULT_OPTIONS: EnhancedRequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
  retry: {
    maxRetries: 2,
    retryDelay: 1000, // 1 second
    retryStatusCodes: [408, 429, 500, 502, 503, 504], // Retryable status codes
  },
};

/**
 * API Client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultOptions: EnhancedRequestInit;
  private authToken: string | null = null;
  
  /**
   * Create a new API client
   */
  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultOptions = {
      ...DEFAULT_OPTIONS,
      ...config,
      headers: {
        ...DEFAULT_OPTIONS.headers,
        ...(config.headers || {}),
      },
      timeout: config.timeout ?? DEFAULT_OPTIONS.timeout,
      retry: config.retry ? {
        maxRetries: config.retry.maxRetries,
        retryDelay: config.retry.retryDelay,
        retryStatusCodes: config.retry.retryStatusCodes,
      } : DEFAULT_OPTIONS.retry,
    };
    
    if (config.authToken) {
      this.setAuthToken(config.authToken);
    }
  }
  
  /**
   * Set the authentication token
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }
  
  /**
   * Get the authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }
  
  /**
   * Create a new request with the default options
   */
  private createRequest(endpoint: string, options: EnhancedRequestInit = {}): Request {
    const url = new URL(endpoint, this.baseUrl);
    
    // Merge headers
    const headers = new Headers(this.defaultOptions.headers as HeadersInit);
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      });
    }
    
    // Add auth token if available
    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    
    // Create request init without our custom properties
    const { timeout, suppressErrors, errorHandlers, retry, ...requestInit } = {
      ...this.defaultOptions,
      ...options,
      headers
    };
    
    // Create the request
    return new Request(url.toString(), requestInit);
  }
  
  /**
   * Parse the response based on content type
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType) {
      return null;
    }
    
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }
    
    if (contentType.includes('text/plain') || contentType.includes('text/html')) {
      return response.text();
    }
    
    if (contentType.includes('application/octet-stream')) {
      return response.blob();
    }
    
    return response.text();
  }
  
  /**
   * Handle API errors
   */
  private handleApiError(response: Response, data: any): AppError {
    // Handle JSON error responses
    if (data && typeof data === 'object' && data.error) {
      const { error } = data;
      
      // Create appropriate error type based on the error data
      if (error.type && Object.values(ErrorType).includes(error.type)) {
        return createErrorFromType(
          error.type,
          error.message ?? 'API error',
          error.code,
          error.details,
          error.path
        );
      }
      
      // Create a generic error
      return new AppError(
        error.message ?? 'API error',
        ErrorType.UNKNOWN,
        error.code ?? 'API_ERROR',
        response.status as HttpStatusCode
      );
    }
    
    // Handle different status codes
    switch (response.status) {
      case HttpStatusCode.UNAUTHORIZED:
        return new AuthenticationError('Unauthorized');
        
      case HttpStatusCode.NOT_FOUND:
        return new NotFoundError('Resource not found');
        
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        return new ValidationError('Validation failed');
        
      case HttpStatusCode.INTERNAL_SERVER_ERROR:
      case HttpStatusCode.SERVICE_UNAVAILABLE:
        return new ServerError(`Server error: ${response.statusText}`);
        
      default:
        return new AppError(
          `Request failed with status ${response.status}`,
          ErrorType.UNKNOWN,
          'API_ERROR',
          response.status as HttpStatusCode
        );
    }
  }
  
  /**
   * Execute an API request with timing and monitoring
   */
  private async executeRequest<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    const endpoint = new URL(request.url).pathname;
    
    // Performance monitoring removed for simplicity
    
    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new TimeoutError(`Request to ${endpoint} timed out after ${options.timeout}ms`));
        }, options.timeout);
      });
      
      // Execute the fetch request
      const response = await Promise.race([
        fetch(request),
        timeoutPromise,
      ]);
      
      // Parse response data
      const data = await this.parseResponse(response);
      
      // Performance tracking removed for simplicity
      
      // Handle successful response
      if (response.ok) {
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: response.headers.get('x-request-id') ?? undefined,
          },
        };
      }
      
      // Handle error response
      const error = this.handleApiError(response, data);
      
      // Error tracking removed for simplicity
      
      // Return error response
      return {
        success: false,
        error: error.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') ?? undefined,
        },
      };
    } catch (error) {
      // Performance tracking removed for simplicity
      
      // Create appropriate error type
      let apiError: AppError;
      
      if (error instanceof AppError) {
        apiError = error;
      } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
        apiError = new NetworkError('Network error: Unable to connect to the server');
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        apiError = new NetworkError('Network error: Failed to fetch');
      } else if (error instanceof TimeoutError) {
        apiError = error;
      } else {
        apiError = new AppError(
          error instanceof Error ? error.message : 'Unknown error',
          ErrorType.UNKNOWN,
          'UNKNOWN_ERROR',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
      
      // Error tracking removed for simplicity
      
      // Return error response
      return {
        success: false,
        error: apiError.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
  
  /**
   * Execute a request with retries
   */
  private async executeWithRetries<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    const { retry } = options;
    
    if (!retry || retry.maxRetries <= 0) {
      return this.executeRequest<T>(request, options);
    }
    
    let lastError: ApiResponse<T> | null = null;
    
    for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
      // Execute the request
      const response = await this.executeRequest<T>(request, options);
      
      // Return successful response
      if (response.success) {
        return response;
      }
      
      // Store the error
      lastError = response;
      
      // Check if we should retry
      const shouldRetry = response.error && 
        retry.retryStatusCodes.includes(response.error.status) &&
        attempt < retry.maxRetries;
      
      if (!shouldRetry) {
        break;
      }
      
      // Wait before retrying
      const delay = retry.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return lastError!;
  }
  
  /**
   * Execute a cached request
   */
  private async executeWithCache<T>(
    request: Request,
    options: EnhancedRequestInit
  ): Promise<ApiResponse<T>> {
    // Cache functionality removed for simplicity
    
    // Cache functionality removed - always execute with retries
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a GET request
   */
  public async get<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Build URL with query parameters
    let url = endpoint;
    
    if (queryParams) {
      const params = new URLSearchParams();
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Create the request
    const request = this.createRequest(url, {
      method: 'GET',
      ...options,
    });
    
    return this.executeWithCache<T>(request, options);
  }
  
  /**
   * Make a POST request
   */
  public async post<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = this.createRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a PUT request
   */
  public async put<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = this.createRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a PATCH request
   */
  public async patch<T>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = this.createRequest(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Make a DELETE request
   */
  public async delete<T>(
    endpoint: string,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create the request
    const request = this.createRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Upload a file
   */
  public async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    options: EnhancedRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Create form data
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    // Create the request with modified headers for FormData
    const { headers, ...restOptions } = options;
    const request = this.createRequest(endpoint, {
      method: 'POST',
      body: formData,
      ...restOptions,
    });
    
    return this.executeWithRetries<T>(request, options);
  }
  
  /**
   * Download a file
   */
  public async downloadFile(
    endpoint: string,
    options: EnhancedRequestInit = {}
  ): Promise<Blob> {
    // Create the request
    const request = this.createRequest(endpoint, {
      method: 'GET',
      ...options,
    });
    
    // Execute the request directly without using executeWithRetries
    // since we need the raw response
    const response = await fetch(request);
    
    if (!response.ok) {
      throw this.handleApiError(response, await this.parseResponse(response));
    }
    
    return response.blob();
  }
}

/**
 * Create an API client instance with the default configuration
 */
export const createApiClient = (baseUrl?: string): ApiClient => {
  return new ApiClient({
    baseUrl: baseUrl ?? config.apiUrl,
    timeout: 30000,
    retry: {
      maxRetries: 2,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  });
};

/**
 * Default API client instance
 */
export const apiClient = createApiClient();

export default apiClient;
