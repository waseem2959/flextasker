/**
 * Base API Client
 * 
 * This module provides the foundation for API clients in the application.
 * It defines the core interfaces and base implementation.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';
import { HttpMethod } from '@/types/api-requests';
import { handleApiError } from '@/services/error';
import { tokenManager } from './token-manager';

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Default API client configuration
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

/**
 * Interface for API client implementations
 */
export interface IApiClient {
  /**
   * Make a GET request
   */
  get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  
  /**
   * Make a POST request
   */
  post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  
  /**
   * Make a PUT request
   */
  put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  
  /**
   * Make a PATCH request
   */
  patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  
  /**
   * Make a DELETE request
   */
  delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  
  /**
   * Make a request with any HTTP method
   */
  request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>>;
}

/**
 * Base implementation of the API client
 */
export class BaseApiClient implements IApiClient {
  protected axiosInstance: AxiosInstance;
  protected config: ApiClientConfig;
  
  /**
   * Create a new API client
   */
  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Create Axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
      withCredentials: this.config.withCredentials,
    });
    
    // Set up request interceptors
    this.setupRequestInterceptors();
    
    // Set up response interceptors
    this.setupResponseInterceptors();
  }
  
  /**
   * Set up request interceptors
   */
  protected setupRequestInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add authentication token if available
        const token = await tokenManager.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add timing information for performance tracking
        config._timing = {
          start: Date.now(),
        };
        
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  /**
   * Set up response interceptors
   */
  protected setupResponseInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Format successful responses
        return this.formatSuccessResponse(response);
      },
      async (error) => {
        // Handle token expiration
        if (error.response?.status === 401 && tokenManager.hasToken()) {
          try {
            // Try to refresh the token
            const refreshed = await tokenManager.refreshToken();
            if (refreshed && error.config) {
              // Retry the request with the new token
              return this.axiosInstance.request(error.config);
            }
          } catch (refreshError) {
            // If refresh fails, clear token and reject
            await tokenManager.clearToken();
          }
        }
        
        // Format error response
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Format a successful response
   */
  protected formatSuccessResponse<T = any>(response: AxiosResponse): ApiResponse<T> {
    // If the response already has the expected format, return it
    if (response.data?.success !== undefined) {
      return response.data;
    }
    
    // Otherwise, format it according to our standard
    return {
      success: true,
      message: 'Operation successful',
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Make a request with the specified method
   */
  async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request<ApiResponse<T>>({
        method,
        url: endpoint,
        data: method !== 'GET' && method !== 'HEAD' ? data : undefined,
        params: method === 'GET' || method === 'HEAD' ? data : undefined,
        ...config,
      });
      
      return response.data;
    } catch (error) {
      return handleApiError<T>(error);
    }
  }
  
  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }
  
  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }
  
  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

// Create and export a singleton instance of the base API client
export const apiClient = new BaseApiClient();

// Default export for convenience
export default apiClient;
