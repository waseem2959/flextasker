/**
 * API Performance Adapter
 * 
 * This module provides a wrapper for the API client that integrates performance monitoring.
 * It automatically tracks all API requests and provides performance metrics.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { performanceMonitor } from '../analytics/performance-monitor';
import { ApiResponse } from '@/types/api';

// Function to extract endpoint name from URL
function extractEndpoint(url: string): string {
  // Remove query parameters
  const urlWithoutParams = url.split('?')[0];
  
  // Get the path portion of the URL
  try {
    const urlObj = new URL(urlWithoutParams);
    return urlObj.pathname;
  } catch (e) {
    // If not a complete URL, just return the path
    return urlWithoutParams;
  }
}

// Create a performance-enhanced Axios instance
export function createPerformanceAxiosInstance(
  baseURL: string,
  defaultConfig: AxiosRequestConfig = {}
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    ...defaultConfig
  });
  
  // Request interceptor to start timing
  instance.interceptors.request.use(
    (config) => {
      // Start timing the request
      const startTime = performanceMonitor.startTiming(
        extractEndpoint(config.url || ''),
        config.method?.toUpperCase() || 'GET'
      );
      
      // Store the start time in the config for later use
      config.metadata = {
        ...config.metadata,
        startTime,
        retryCount: config.metadata?.retryCount || 0
      };
      
      return config;
    },
    (error) => {
      // Request error (e.g., network error)
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to record metrics
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Record successful request
      if (response.config.metadata?.startTime) {
        const endpoint = extractEndpoint(response.config.url || '');
        const method = response.config.method?.toUpperCase() || 'GET';
        
        performanceMonitor.recordRequest(
          endpoint,
          method,
          response.config.metadata.startTime,
          response.status,
          true, // success
          response.config.metadata?.fromCache || false,
          response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0,
          response.config.metadata?.retryCount || 0
        );
      }
      
      return response;
    },
    (error) => {
      // Record failed request
      if (error.config?.metadata?.startTime) {
        const endpoint = extractEndpoint(error.config.url || '');
        const method = error.config.method?.toUpperCase() || 'GET';
        
        performanceMonitor.recordRequest(
          endpoint,
          method,
          error.config.metadata.startTime,
          error.response?.status || 0,
          false, // failure
          error.config.metadata?.fromCache || false,
          error.response?.headers?.['content-length'] 
            ? parseInt(error.response.headers['content-length'], 10) 
            : 0,
          error.config.metadata?.retryCount || 0
        );
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
}

// Enhanced API request function with performance monitoring
export async function apiRequestWithPerformance<T>(
  instance: AxiosInstance,
  method: string,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    let response;
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await instance.get<ApiResponse<T>>(url, config);
        break;
      case 'POST':
        response = await instance.post<ApiResponse<T>>(url, data, config);
        break;
      case 'PUT':
        response = await instance.put<ApiResponse<T>>(url, data, config);
        break;
      case 'PATCH':
        response = await instance.patch<ApiResponse<T>>(url, data, config);
        break;
      case 'DELETE':
        response = await instance.delete<ApiResponse<T>>(url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    return response.data;
  } catch (error: any) {
    // Error handling logic (similar to standard API client)
    const errorResponse: ApiResponse<T> = {
      success: false,
      message: error.response?.data?.message || error.message || 'An error occurred',
      data: null as T,
      error: {
        code: error.response?.status || 500,
        details: error.response?.data?.error?.details || error.message
      },
      timestamp: new Date().toISOString()
    };
    
    return errorResponse;
  }
}
