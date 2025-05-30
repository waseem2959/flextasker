/**
 * Consolidated API Client
 * 
 * This module provides a comprehensive API client with all advanced features:
 * - Performance monitoring
 * - Rate limiting
 * - Offline support
 * - Real-time synchronization
 * - Error handling
 * 
 * It combines functionality previously spread across multiple client implementations.
 */

import { AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api';
import { HttpMethod, QueueRequestOptions } from '@/types/api-client';
import { 
  IApiClient, 
  BaseApiClient, 
  ApiClientConfig 
} from '../base-client';
import { performanceMonitor } from '../../analytics/performanceMonitor';
import { rateLimiter } from '../services/consolidated-rate-limiter';
import { offlineQueueManager } from '@/utils/offline-queue';
import { realtimeService, SocketEventType } from '../../realtime';
import { showErrorNotification, showSuccessNotification } from '@/services/error';

/**
 * Configuration for the consolidated API client
 */
export interface ConsolidatedApiClientConfig extends ApiClientConfig {
  /**
   * Whether to enable performance monitoring
   */
  enablePerformanceMonitoring: boolean;
  
  /**
   * Whether to enable rate limiting
   */
  enableRateLimiting: boolean;
  
  /**
   * Whether to enable offline support
   */
  enableOfflineSupport: boolean;
  
  /**
   * Whether to enable real-time synchronization
   */
  enableRealTimeSync: boolean;
  
  /**
   * Maximum number of retries for failed requests
   */
  maxRetries: number;
  
  /**
   * Whether to show notifications for errors and successes
   */
  showNotifications: boolean;
}

/**
 * Default configuration for the consolidated API client
 */
const DEFAULT_CONFIG: ConsolidatedApiClientConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  enablePerformanceMonitoring: true,
  enableRateLimiting: true,
  enableOfflineSupport: true,
  enableRealTimeSync: true,
  maxRetries: 2,
  showNotifications: true
};

/**
 * Utility function to extract the endpoint name from a URL
 */
function extractEndpoint(url: string): string {
  // Remove query parameters
  const urlWithoutQuery = url.split('?')[0];
  
  // Remove the base path
  const apiBase = '/api/v1/';
  const startIndex = urlWithoutQuery.indexOf(apiBase);
  if (startIndex !== -1) {
    return urlWithoutQuery.substring(startIndex + apiBase.length);
  }
  
  // If the URL doesn't include the base path, just use the path portion
  const urlObj = new URL(urlWithoutQuery, 'http://localhost');
  return urlObj.pathname;
}

/**
 * Consolidated API client implementation
 */
export class ConsolidatedApiClient implements IApiClient {
  private baseClient: IApiClient;
  private config: ConsolidatedApiClientConfig;
  
  public performanceMonitor = performanceMonitor;
  
  constructor(
    baseClient?: IApiClient,
    config: Partial<ConsolidatedApiClientConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.baseClient = baseClient || new BaseApiClient(this.config);
    
    // Connect to WebSocket if real-time sync is enabled
    if (this.config.enableRealTimeSync) {
      realtimeService.connect();
    }
  }
  
  /**
   * Make a request with enhanced features
   */
  async request<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    // Extract endpoint name for performance monitoring
    const endpointName = extractEndpoint(endpoint);
    
    // Check if we're offline
    if (this.config.enableOfflineSupport && !navigator.onLine) {
      return this.handleOfflineRequest<T>(method, endpoint, data);
    }
    
    // Add performance monitoring
    let requestId = '';
    if (this.config.enablePerformanceMonitoring) {
      requestId = String(performanceMonitor.startTiming(method, endpointName));
    }
    
    try {
      // Apply rate limiting if enabled
      let response: ApiResponse<T>;
      
      if (this.config.enableRateLimiting) {
        const priority = this.getPriorityForEndpoint(endpoint);
        
        response = await rateLimiter.execute<ApiResponse<T>>(
          endpointName,
          priority,
          () => this.baseClient.request<T>(method, endpoint, data, config)
        );
      } else {
        response = await this.baseClient.request<T>(method, endpoint, data, config);
      }
      
      // Record successful request
      if (this.config.enablePerformanceMonitoring) {
        performanceMonitor.recordRequest(requestId, {
          success: true,
          statusCode: 200,
          responseSize: JSON.stringify(response).length
        });
      }
      
      // Show success notification if configured
      if (
        this.config.showNotifications && 
        response.success && 
        response.message &&
        (method === 'POST' || method === 'PUT' || method === 'DELETE')
      ) {
        showSuccessNotification(response.message);
      }
      
      // If real-time sync is enabled, send an event for data mutations
      if (
        this.config.enableRealTimeSync && 
        (method === 'POST' || method === 'PUT' || method === 'DELETE')
      ) {
        const { entityType, entityId } = this.extractEntityInfo(endpoint);
        
        if (entityType) {
          this.sendSocketEvent(
            'TASK_UPDATED' as SocketEventType,
            {
              entityType,
              entityId,
              action: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
              data: response.data
            }
          );
        }
      }
      
      return response;
    } catch (error: any) {
      // Record failed request
      if (this.config.enablePerformanceMonitoring) {
        performanceMonitor.recordRequest(requestId, {
          success: false,
          statusCode: error.response?.status || 0,
          errorMessage: error.message
        });
      }
      
      // Add to offline queue if we're offline
      if (this.config.enableOfflineSupport && !navigator.onLine) {
        return this.handleOfflineRequest<T>(method, endpoint, data);
      }
      
      // Show error notification if configured
      if (this.config.showNotifications) {
        showErrorNotification(error);
      }
      
      // Rethrow to let the caller handle it
      throw error;
    }
  }
  
  /**
   * Handle a request when offline
   */
  private async handleOfflineRequest<T = any>(
    method: HttpMethod,
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    // Only queue certain types of requests
    if (method === 'GET') {
      return {
        success: false,
        message: 'Cannot fetch data while offline',
        errors: ['OFFLINE'],
        timestamp: new Date().toISOString(),
        data: null as unknown as T
      };
    }
    
    // Add to offline queue for later processing
    const { entityType, entityId } = this.extractEntityInfo(endpoint);
    
    // Create options that match the QueueRequestOptions interface
    const queueOptions = {
      method,
      path: endpoint,
      data,
      priority: this.getPriorityForEndpoint(endpoint),
      timestamp: Date.now()
    };
    
    offlineQueueManager.enqueue(queueOptions);
    
    // Return a placeholder response
    return {
      success: true,
      message: 'Your request has been queued and will be processed when you are back online',
      data: null as unknown as T,
      timestamp: new Date().toISOString(),
      // Additional info can be handled separately if needed
      errors: []
    };
  }
  
  /**
   * Extract entity type and ID from an endpoint
   */
  private extractEntityInfo(endpoint: string): { entityType?: string; entityId?: string } {
    const parts = endpoint.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      return {};
    }
    
    // Handle plurals by removing trailing 's'
    const entityType = parts[0].endsWith('s') 
      ? parts[0].substring(0, parts[0].length - 1) 
      : parts[0];
    
    // Get ID if present
    const entityId = parts.length > 1 && /^[a-z0-9-]+$/i.test(parts[1]) 
      ? parts[1] 
      : undefined;
    
    return { entityType, entityId };
  }
  
  /**
   * Get priority level for an endpoint
   */
  private getPriorityForEndpoint(endpoint: string): number {
    // Authentication endpoints get highest priority
    if (endpoint.includes('/auth/')) {
      return 10;
    }
    
    // User profile endpoints get high priority
    if (endpoint.includes('/users/me') || endpoint.includes('/profile')) {
      return 8;
    }
    
    // GET requests get medium priority
    if (endpoint.startsWith('GET ')) {
      return 5;
    }
    
    // Everything else gets normal priority
    return 3;
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
  
  /**
   * Send a WebSocket event
   */
  sendSocketEvent(eventType: SocketEventType, data: any): void {
    realtimeService.emit(eventType, data);
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    // Return performance stats in a format that matches the interface
    return this.config.enablePerformanceMonitoring
      ? { metrics: performanceMonitor.getStats?.() || {} }
      : null;
  }
  
  /**
   * Get rate limiting status
   */
  getRateLimitingStatus() {
    // Return rate limiting stats in a format that matches the interface
    return this.config.enableRateLimiting
      ? rateLimiter.getStats?.() || { active: true, queueSize: 0 }
      : null;
  }
  
  /**
   * Get offline queue status
   */
  getOfflineQueueStatus() {
    return this.config.enableOfflineSupport
      ? {
          queueLength: offlineQueueManager.getQueueLength(),
          pendingRequests: offlineQueueManager.getPendingRequests()
        }
      : null;
  }
  
  /**
   * Reset all enhancement systems
   */
  reset(): void {
    // Clear performance monitoring data
    if (this.config.enablePerformanceMonitoring) {
      // Reset the performance monitor using the available method
      if (typeof performanceMonitor.resetStats === 'function') {
        performanceMonitor.resetStats();
      }
    }
    
    // Reset rate limiter
    if (this.config.enableRateLimiting) {
      rateLimiter.reset();
    }
    
    // Clear offline queue
    if (this.config.enableOfflineSupport) {
      // Clear the offline queue using the available method
      if (typeof offlineQueueManager.reset === 'function') {
        offlineQueueManager.reset();
      }
    }
  }
}

// Create and export a singleton instance with default configuration
export const consolidatedApiClient = new ConsolidatedApiClient();

// Default export for convenience
export default consolidatedApiClient;
