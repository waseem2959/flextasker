/**
 * API Rate Limiter and Graceful Degradation
 * 
 * This module provides rate limiting protection and graceful degradation
 * for the API client, helping to prevent rate limit errors and provide a
 * better user experience when the API is under heavy load.
 */

import { toast } from '@/hooks/use-toast';

// Rate limiting configuration
export interface RateLimitConfig {
  // Maximum number of requests per time window
  maxRequests: number;
  
  // Time window in milliseconds
  timeWindow: number;
  
  // Whether to queue requests that exceed the rate limit
  queueExceedingRequests: boolean;
  
  // Maximum queue size
  maxQueueSize: number;
  
  // Retry delay in milliseconds when rate limited
  retryDelay: number;
  
  // Whether to show notifications to the user
  showNotifications: boolean;
}

// Default rate limit configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 50, // 50 requests per window
  timeWindow: 60 * 1000, // 1 minute
  queueExceedingRequests: true,
  maxQueueSize: 100,
  retryDelay: 1000, // 1 second
  showNotifications: true
};

// Request item interface
interface QueuedRequest {
  id: string;
  timestamp: number;
  endpoint: string;
  priority: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeoutId?: number;
}

// Rate limiter class
export class RateLimiter {
  private config: RateLimitConfig;
  private requestHistory: number[] = [];
  private requestQueue: QueuedRequest[] = [];
  private processing = false;
  private rateLimitedUntil: number = 0;
  private endpointLimits: Map<string, { count: number, resetTime: number }> = new Map();
  private degradationLevel: number = 0; // 0-3, higher means more aggressive limiting
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Periodically process the queue
    setInterval(() => this.processQueue(), 1000);
    
    // Periodically adjust degradation level based on API health
    setInterval(() => this.adjustDegradationLevel(), 60 * 1000);
  }
  
  /**
   * Execute a request through the rate limiter
   * @param endpoint API endpoint
   * @param priority Priority level (higher numbers = higher priority)
   * @param executeRequest Function that executes the actual request
   * @returns Promise that resolves with the request result
   */
  public async execute<T>(
    endpoint: string,
    priority: number = 1,
    executeRequest: () => Promise<T>
  ): Promise<T> {
    // Check if we're currently rate limited
    if (Date.now() < this.rateLimitedUntil) {
      const waitTime = this.rateLimitedUntil - Date.now();
      console.warn(`Rate limited for ${waitTime}ms, queuing request to ${endpoint}`);
      
      if (this.config.showNotifications && this.degradationLevel >= 2) {
        toast({
          title: 'API Rate Limit',
          description: 'We\'re processing too many requests. Your action will be completed shortly.',
          variant: 'default'
        });
      }
      
      // Queue the request if enabled
      if (this.config.queueExceedingRequests) {
        return this.queueRequest(endpoint, priority, executeRequest);
      } else {
        // Wait for the rate limit to expire
        await new Promise(resolve => setTimeout(resolve, waitTime + 100));
      }
    }
    
    // Check if we're already at the rate limit for this endpoint
    const endpointLimit = this.endpointLimits.get(endpoint);
    if (endpointLimit && endpointLimit.count >= this.getMaxRequestsForEndpoint(endpoint) && Date.now() < endpointLimit.resetTime) {
      console.warn(`Endpoint ${endpoint} rate limited until ${new Date(endpointLimit.resetTime).toISOString()}`);
      
      // Queue the request if enabled
      if (this.config.queueExceedingRequests) {
        return this.queueRequest(endpoint, priority, executeRequest);
      } else {
        throw new Error(`Rate limit exceeded for endpoint: ${endpoint}`);
      }
    }
    
    // Check if we're approaching the global rate limit
    const currentWindow = Date.now() - this.config.timeWindow;
    this.requestHistory = this.requestHistory.filter(time => time > currentWindow);
    
    if (this.requestHistory.length >= this.getMaxRequestsForWindow()) {
      const oldestRequest = Math.min(...this.requestHistory);
      const resetTime = oldestRequest + this.config.timeWindow;
      const waitTime = resetTime - Date.now();
      
      console.warn(`Global rate limit approached, waiting ${waitTime}ms`);
      this.rateLimitedUntil = Date.now() + waitTime + 100;
      
      // Queue the request if enabled
      if (this.config.queueExceedingRequests) {
        return this.queueRequest(endpoint, priority, executeRequest);
      } else {
        // Wait for the rate limit to expire
        await new Promise(resolve => setTimeout(resolve, waitTime + 100));
      }
    }
    
    // Execute the request
    try {
      // Record this request
      this.requestHistory.push(Date.now());
      
      // Update endpoint counter
      this.updateEndpointCounter(endpoint);
      
      // Execute the actual request
      const result = await executeRequest();
      
      // Reset degradation level if successful
      if (this.degradationLevel > 0) {
        this.degradationLevel = Math.max(0, this.degradationLevel - 1);
      }
      
      return result;
    } catch (error: any) {
      // Check for rate limit errors
      if (error.response?.status === 429 || (error.response?.data?.error?.code === 'RATE_LIMITED')) {
        const retryAfter = error.response?.headers?.['retry-after'];
        const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.config.retryDelay * (1 + this.degradationLevel);
        
        console.warn(`Rate limited by server, retry after ${retryMs}ms`);
        this.rateLimitedUntil = Date.now() + retryMs;
        
        // Increase degradation level
        this.degradationLevel = Math.min(3, this.degradationLevel + 1);
        
        if (this.config.showNotifications) {
          toast({
            title: 'API Rate Limit Exceeded',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
        }
        
        // Queue the request for retry
        if (this.config.queueExceedingRequests) {
          return this.queueRequest(endpoint, priority, executeRequest);
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Queue a request for later execution
   */
  private queueRequest<T>(
    endpoint: string,
    priority: number,
    executeRequest: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check if queue is full
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        // Remove lowest priority request if queue is full
        const lowestPriorityIndex = this.requestQueue.reduce(
          (lowestIdx, request, idx, arr) => 
            arr[lowestIdx].priority < request.priority ? lowestIdx : idx, 
          0
        );
        
        const removed = this.requestQueue.splice(lowestPriorityIndex, 1)[0];
        if (removed.timeoutId) {
          window.clearTimeout(removed.timeoutId);
        }
        removed.reject(new Error('Request dropped due to queue overflow'));
      }
      
      // Add request to queue
      const id = Math.random().toString(36).substring(2, 15);
      this.requestQueue.push({
        id,
        timestamp: Date.now(),
        endpoint,
        priority,
        execute: executeRequest,
        resolve,
        reject,
        timeoutId: window.setTimeout(() => {
          // Auto-remove from queue after 5 minutes to prevent stale requests
          const index = this.requestQueue.findIndex(req => req.id === id);
          if (index !== -1) {
            const request = this.requestQueue.splice(index, 1)[0];
            request.reject(new Error('Request timed out in queue'));
          }
        }, 5 * 60 * 1000) // 5 minutes
      });
      
      // Sort queue by priority (higher first) and then by timestamp (older first)
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
      
      // Start processing if not already
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process queued requests
   */
  private async processQueue(): void {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    // Check if we can process requests now
    if (Date.now() < this.rateLimitedUntil) {
      this.processing = false;
      return;
    }
    
    // Get the next request
    const request = this.requestQueue.shift();
    if (!request) {
      this.processing = false;
      return;
    }
    
    // Clear timeout
    if (request.timeoutId) {
      window.clearTimeout(request.timeoutId);
    }
    
    try {
      // Execute the request
      const result = await this.execute(
        request.endpoint,
        request.priority,
        request.execute
      );
      
      // Resolve the promise
      request.resolve(result);
    } catch (error) {
      // Reject the promise
      request.reject(error);
    } finally {
      this.processing = false;
      
      // Continue processing if there are more requests
      if (this.requestQueue.length > 0) {
        // Add a small delay between requests to avoid overwhelming the server
        setTimeout(() => this.processQueue(), 100 * (this.degradationLevel + 1));
      }
    }
  }
  
  /**
   * Update the counter for an endpoint
   */
  private updateEndpointCounter(endpoint: string): void {
    const now = Date.now();
    const limit = this.endpointLimits.get(endpoint);
    
    if (!limit || now > limit.resetTime) {
      // Create new counter
      this.endpointLimits.set(endpoint, {
        count: 1,
        resetTime: now + this.getTimeWindowForEndpoint(endpoint)
      });
    } else {
      // Update existing counter
      this.endpointLimits.set(endpoint, {
        count: limit.count + 1,
        resetTime: limit.resetTime
      });
    }
  }
  
  /**
   * Get the maximum requests allowed for an endpoint
   * This can be customized per endpoint based on knowledge of API limits
   */
  private getMaxRequestsForEndpoint(endpoint: string): number {
    // Example: Different limits for different endpoints
    if (endpoint.includes('/users/')) {
      return 10; // Stricter limit for user operations
    } else if (endpoint.includes('/tasks/')) {
      return 20; // Medium limit for task operations
    } else if (endpoint.includes('/notifications/')) {
      return 30; // Higher limit for notifications
    }
    
    // Apply degradation to the default limit
    return Math.floor(this.config.maxRequests / (this.degradationLevel + 1));
  }
  
  /**
   * Get the time window for an endpoint
   */
  private getTimeWindowForEndpoint(endpoint: string): number {
    // Default to the configured time window
    return this.config.timeWindow;
  }
  
  /**
   * Get the maximum requests allowed in the current window
   * This is adjusted based on the current degradation level
   */
  private getMaxRequestsForWindow(): number {
    // Reduce the limit when in degradation mode
    const degradationFactor = Math.pow(2, this.degradationLevel);
    return Math.floor(this.config.maxRequests / degradationFactor);
  }
  
  /**
   * Adjust the degradation level based on recent API health
   */
  private adjustDegradationLevel(): void {
    // This would ideally be based on API response times, error rates, etc.
    // For now, we'll keep it simple and just decay the degradation level over time
    if (this.degradationLevel > 0) {
      this.degradationLevel--;
    }
  }
  
  /**
   * Get the current queue length
   */
  public getQueueLength(): number {
    return this.requestQueue.length;
  }
  
  /**
   * Get the current degradation level
   */
  public getDegradationLevel(): number {
    return this.degradationLevel;
  }
  
  /**
   * Check if rate limiting is currently active
   */
  public isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }
  
  /**
   * Get time until rate limit expires (in ms)
   */
  public getTimeUntilRateLimitExpires(): number {
    return Math.max(0, this.rateLimitedUntil - Date.now());
  }
  
  /**
   * Reset the rate limiter
   */
  public reset(): void {
    this.requestHistory = [];
    this.rateLimitedUntil = 0;
    this.degradationLevel = 0;
    this.endpointLimits.clear();
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();

// React hook for using the rate limiter
export function useRateLimiter() {
  return {
    execute: rateLimiter.execute.bind(rateLimiter),
    isRateLimited: rateLimiter.isRateLimited.bind(rateLimiter),
    getQueueLength: rateLimiter.getQueueLength.bind(rateLimiter),
    getDegradationLevel: rateLimiter.getDegradationLevel.bind(rateLimiter),
    getTimeUntilRateLimitExpires: rateLimiter.getTimeUntilRateLimitExpires.bind(rateLimiter),
    reset: rateLimiter.reset.bind(rateLimiter)
  };
}
