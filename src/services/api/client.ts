/**
 * API Client
 * Provides the core HTTP client for making API requests
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenManager } from '../auth/auth-service';

// Default base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Enhanced request configuration
 */
export interface EnhancedRequestInit extends AxiosRequestConfig {
  includeAuth?: boolean;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

/**
 * API Client class that wraps axios with additional functionality
 */
class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
    
    this.setupInterceptors();
  }
  
  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for adding auth headers
    this.client.interceptors.request.use(
      (config) => {
        const token = tokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for handling global responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle unauthorized errors (401)
        if (error.response?.status === 401) {
          // Clear tokens if unauthorized
          tokenManager.clearTokens();
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: EnhancedRequestInit = {}
  ): Promise<T> {
    const response = await this.client.get<T>(endpoint, {
      ...options,
      params,
    });
    return response.data;
  }
  
  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, options);
    return response.data;
  }
  
  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, options);
    return response.data;
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: EnhancedRequestInit = {}
  ): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, options);
    return response.data;
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: EnhancedRequestInit = {}
  ): Promise<T> {
    const response = await this.client.delete<T>(endpoint, options);
    return response.data;
  }
}

// Create and export default instance
const apiClient = new ApiClient();
export default apiClient;
