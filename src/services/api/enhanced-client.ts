/**
 * Enhanced API Client
 * 
 * This module extends the base API client with advanced features:
 * - Performance monitoring
 * - Rate limiting
 * - Offline support
 * - Real-time synchronization
 */

import { AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api';
import { HttpMethod, QueueRequestOptions } from '@/types/api-requests';
import { 
  IApiClient, 
  BaseApiClient, 
  ApiClientConfig 
} from './base-client';
import { performanceMonitor } from '../analytics/performance-monitor';
import { rateLimiter } from './rate-limiter';
import { offlineQueueManager } from '@/utils/offline-queue';
import { socketService, SocketEventType } from '../socket/socket-service';
import { showErrorNotification, showSuccessNotification } from '@/services/error';

/**
 * Configuration for the enhanced API client
 */
export interface EnhancedApiClientConfig extends ApiClientConfig {
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
   * Whether to show UI notifications for errors
   */
  showErrorNotifications: boolean;
}

/**
 * Default configuration for the enhanced API client
 */
const DEFAULT_ENHANCED_CONFIG: EnhancedApiClientConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  enablePerformanceMonitoring: true,
  enableRateLimiting: true,
  enableOfflineSupport: true,
  enableRealTimeSync: true,
  maxRetries: 3,
  showErrorNotifications: true,
};

/**
 * Utility function to extract the endpoint name from a URL
 */
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

/**
 * Enhanced API client implementation
 */
export class EnhancedApiClient implements IApiClient {
  private baseClient: IApiClient;
  private config: EnhancedApiClientConfig;
  public performanceMonitor = performanceMonitor;
  
  /**
   * Create a new enhanced API client
   */
  constructor(
    baseClient?: IApiClient,
    config: Partial<EnhancedApiClientConfig> = {}
  ) {
    this.config = { ...DEFAULT_ENHANCED_CONFIG, ...config };
    this.baseClient = baseClient || new BaseApiClient(this.config);
    
    // Connect to WebSocket if real-time sync is enabled
    if (this.config.enableRealTimeSync) {
      socketService.connect();
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
    // Performance monitoring
    let startTime: number | undefined;
    if (this.config.enablePerformanceMonitoring) {
      startTime = performanceMonitor.startTiming(endpoint, method);
    }
    
    try {
      // Check if offline
      const isOffline = !navigator.onLine;
      
      // If offline and offline support is enabled, queue the request
      if (isOffline && this.config.enableOfflineSupport) {
        return this.handleOfflineRequest<T>(method, endpoint, data);
      }
      
      // Apply rate limiting if enabled
      if (this.config.enableRateLimiting) {
        await rateLimiter.limitRequest(endpoint, method, this.getPriorityForEndpoint(endpoint));
      }
      
      // Make the request using the base client
      const response = await this.baseClient.request<T>(method, endpoint, data, config);
      
      // Record performance metrics if enabled
      if (this.config.enablePerformanceMonitoring && startTime !== undefined) {
        performanceMonitor.recordRequest(
          endpoint,
          method,
          startTime,
          response.success ? 200 : 400,
          response.success,
          false,
          JSON.stringify(response).length,
          0
        );
      }
      
      return response;
    } catch (error) {
      // Record performance metrics for failed requests
      if (this.config.enablePerformanceMonitoring && startTime !== undefined) {
        performanceMonitor.recordRequest(
          endpoint,
          method,
          startTime,
          500,
          false,
          false,
          0,
          0
        );
      }
      
      // Show error notification if enabled
      if (this.config.showErrorNotifications) {
        showErrorNotification(error);
      }
      
      // Re-throw the error
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
    try {
      // Determine entity type and ID from the endpoint
      const entityInfo = this.extractEntityInfo(endpoint);
      
      // Queue the request
      const queueRequest: QueueRequestOptions = {
        url: this.config.baseURL + endpoint,
        method,
        data,
        priority: this.getPriorityForEndpoint(endpoint),
        maxRetries: this.config.maxRetries,
        ...entityInfo
      };
      
      await offlineQueueManager.enqueue(queueRequest);
      
      // Return an optimistic response
      showSuccessNotification(
        'Queued for offline processing',
        'This action will be completed when you are back online.'
      );
      
      return {
        success: true,
        message: 'Request queued for offline processing',
        data: null as any,
        timestamp: new Date().toISOString(),
        offline: true
      };
    } catch (error) {
      if (this.config.showErrorNotifications) {
        showErrorNotification(
          error,
          { title: 'Failed to queue offline request' }
        );
      }
      
      return {
        success: false,
        message: 'Failed to queue offline request',
        errors: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
        offline: true
      };
    }
  }
  
  /**
   * Extract entity type and ID from an endpoint
   */
  private extractEntityInfo(endpoint: string): { entityType?: string; entityId?: string } {
    const parts = endpoint.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      return {};
    }
    
    const entityType = parts[0];
    const entityId = parts.length > 1 ? parts[1] : undefined;
    
    return {
      entityType,
      entityId
    };
  }
  
  /**
   * Get priority level for an endpoint
   */
  private getPriorityForEndpoint(endpoint: string): number {
    // User and authentication requests get highest priority
    if (endpoint.includes('/auth') || endpoint.includes('/users')) {
      return 10;
    }
    
    // Tasks get medium priority
    if (endpoint.includes('/tasks')) {
      return 5;
    }
    
    // Everything else gets default priority
    return 1;
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
    if (this.config.enableRealTimeSync) {
      socketService.emit(eventType, data);
    }
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      score: performanceMonitor.getPerformanceScore(),
      slowestEndpoints: performanceMonitor.getSlowestEndpoints(5),
      totalRequests: performanceMonitor.getTotalRequests(),
      averageResponseTime: performanceMonitor.getAverageResponseTime(),
      successRate: performanceMonitor.getSuccessRate()
    };
  }
  
  /**
   * Get rate limiting status
   */
  getRateLimitingStatus() {
    return {
      isEnabled: this.config.enableRateLimiting,
      currentLimits: rateLimiter.getCurrentLimits(),
      isThrottled: rateLimiter.isThrottled()
    };
  }
  
  /**
   * Get offline queue status
   */
  async getOfflineQueueStatus() {
    return {
      isEnabled: this.config.enableOfflineSupport,
      queueLength: await offlineQueueManager.getQueueLength(),
      isProcessing: offlineQueueManager.isProcessing()
    };
  }
  
  /**
   * Reset all enhancement systems
   */
  reset(): void {
    performanceMonitor.reset();
    rateLimiter.reset();
  }
}

// Create and export a singleton instance with default configuration
export const enhancedApiClient = new EnhancedApiClient();

// Default export for convenience
export default enhancedApiClient;
