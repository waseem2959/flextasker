/**
 * Consolidated API Rate Limiter and Graceful Degradation
 * 
 * This module provides rate limiting protection and graceful degradation
 * for the API client, helping to prevent rate limit errors and provide a
 * better user experience when the API is under heavy load.
 */

import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

// Rate limiting configuration
export interface RateLimitConfig {
  // Maximum number of requests per time window
  maxRequests: number;
  
  // Time window in milliseconds
  timeWindow: number;
  
  // Whether to queue requests that exceed the rate limit
  queueExceedingRequests: boolean;
  
  // Maximum queue length
  maxQueueLength: number;
  
  // Maximum time a request can be queued (ms)
  maxQueueTime: number;
}

// Default rate limiting configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 50,
  timeWindow: 60 * 1000, // 1 minute
  queueExceedingRequests: true,
  maxQueueLength: 100,
  maxQueueTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Request item interface
 */
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

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private requestHistory: number[] = [];
  private requestQueue: QueuedRequest[] = [];
  private processing = false;
  private rateLimitedUntil: number = 0;
  private endpointLimits: Map<string, { count: number, resetTime: number }> = new Map();
  private degradationLevel: number = 0;
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Periodically process the queue
    setInterval(() => this.processQueue(), 1000);
    
    // Periodically adjust degradation level based on API health
    setInterval(() => this.adjustDegradationLevel(), 60 * 1000);
  }
  
  /**
   * Execute a request through the rate limiter
   * 
   * @param endpoint API endpoint
   * @param priority Priority level (higher numbers = higher priority)
   * @param executeRequest Function that executes the actual request
   * @returns Promise that resolves with the request result
   */
  public execute<T>(
    endpoint: string,
    priority: number = 1,
    executeRequest: () => Promise<T>
  ): Promise<T> {
    // Check if we're rate limited
    if (this.isRateLimited()) {
      const timeUntilReset = this.getTimeUntilRateLimitExpires();
      
      // If queueing is enabled, queue the request
      if (this.config.queueExceedingRequests) {
        return this.queueRequest(endpoint, priority, executeRequest);
      }
      
      // Otherwise, reject with rate limit error
      return Promise.reject(new Error(
        `Rate limit exceeded. Please try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`
      ));
    }
    
    // Check if we've exceeded the rate limit for this endpoint
    const endpointLimit = this.endpointLimits.get(endpoint);
    const maxRequests = this.getMaxRequestsForEndpoint(endpoint);
    const now = Date.now();
    
    if (endpointLimit && endpointLimit.count >= maxRequests && now < endpointLimit.resetTime) {
      // If queueing is enabled, queue the request
      if (this.config.queueExceedingRequests) {
        return this.queueRequest(endpoint, priority, executeRequest);
      }
      
      // Otherwise, reject with rate limit error
      const timeUntilReset = Math.ceil((endpointLimit.resetTime - now) / 1000);
      return Promise.reject(new Error(
        `Rate limit exceeded for ${endpoint}. Please try again in ${timeUntilReset} seconds.`
      ));
    }
    
    // Track this request
    this.requestHistory.push(Date.now());
    this.updateEndpointCounter(endpoint);
    
    // Execute the request
    return executeRequest();
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
      // Check if the queue is full
      if (this.requestQueue.length >= this.config.maxQueueLength) {
        // Find the lowest priority request to replace
        const lowestPriorityIndex = this.requestQueue.reduce(
          (lowestIdx, request, idx, arr) => 
            request.priority < arr[lowestIdx].priority ? idx : lowestIdx, 
          0
        );
        
        // If the new request has higher priority, replace the lowest priority one
        if (this.requestQueue[lowestPriorityIndex].priority < priority) {
          // Reject the request we're removing
          const removedRequest = this.requestQueue[lowestPriorityIndex];
          clearTimeout(removedRequest.timeoutId);
          removedRequest.reject(new Error('Request was replaced by a higher priority request'));
          
          // Remove it from the queue
          this.requestQueue.splice(lowestPriorityIndex, 1);
        } else {
          // Reject this request since it's lower priority than everything in the queue
          return reject(new Error('Request queue is full and this request has too low priority'));
        }
      }
      
      // Create a unique ID for this request
      const id = Math.random().toString(36).substring(2);
      
      // Set a timeout to reject the request if it stays in the queue too long
      const timeoutId = setTimeout(() => {
        // Find and remove the request from the queue
        const index = this.requestQueue.findIndex(req => req.id === id);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Request timed out in queue'));
        }
      }, this.config.maxQueueTime) as unknown as number;
      
      // Add the request to the queue
      this.requestQueue.push({
        id,
        timestamp: Date.now(),
        endpoint,
        priority,
        execute: executeRequest,
        resolve,
        reject,
        timeoutId
      });
      
      // Sort the queue by priority (highest first) and then by timestamp (oldest first)
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
      
      // Start processing the queue
      this.processQueue();
    });
  }
  
  /**
   * Process queued requests
   */
  private processQueue(): void {
    // If already processing or queue is empty, return
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }
    
    // If we're rate limited, wait until the rate limit expires
    if (this.isRateLimited()) {
      return;
    }
    
    this.processing = true;
    
    // Take the first request from the queue
    const request = this.requestQueue.shift();
    if (!request) {
      this.processing = false;
      return;
    }
    
    // Clear the timeout
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
    }
    
    // Execute the request
    this.execute(request.endpoint, request.priority, request.execute)
      .then(result => {
        request.resolve(result);
        
        // Continue processing the queue after a short delay
        setTimeout(() => {
          this.processing = false;
          this.processQueue();
        }, 100);
      })
      .catch(error => {
        request.reject(error);
        
        // If this is a rate limit error, pause queue processing
        if (error.message && error.message.includes('Rate limit exceeded')) {
          // Set rate limited until
          this.rateLimitedUntil = Date.now() + 10000; // 10 seconds
          
          // Continue processing the queue after the rate limit expires
          setTimeout(() => {
            this.processing = false;
            this.processQueue();
          }, 10000);
        } else {
          // Continue processing the queue after a short delay
          setTimeout(() => {
            this.processing = false;
            this.processQueue();
          }, 100);
        }
      });
  }
  
  /**
   * Update the counter for an endpoint
   */
  private updateEndpointCounter(endpoint: string): void {
    const now = Date.now();
    const timeWindow = this.getTimeWindowForEndpoint(endpoint);
    
    // Get or create the endpoint limit
    const limit = this.endpointLimits.get(endpoint) || { count: 0, resetTime: now + timeWindow };
    
    // If the reset time has passed, reset the counter
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + timeWindow;
    } else {
      // Otherwise increment the counter
      limit.count++;
    }
    
    // Update the map
    this.endpointLimits.set(endpoint, limit);
  }
  
  /**
   * Get the maximum requests allowed for an endpoint
   * This can be customized per endpoint based on knowledge of API limits
   */
  private getMaxRequestsForEndpoint(endpoint: string): number {
    // You can customize this based on known API limits
    if (endpoint.includes('upload') || endpoint.includes('files')) {
      return 10; // Stricter limit for file operations
    }
    
    if (endpoint.includes('search')) {
      return 20; // Stricter limit for search operations
    }
    
    // Default to the global limit, adjusted for degradation
    return this.getMaxRequestsForWindow();
  }
  
  /**
   * Get the time window for an endpoint
   */
  private getTimeWindowForEndpoint(endpoint: string): number {
    // You can customize this based on known API limits
    if (endpoint.includes('upload') || endpoint.includes('files')) {
      return 120 * 1000; // 2 minutes for file operations
    }
    
    return this.config.timeWindow;
  }
  
  /**
   * Get the maximum requests allowed in the current window
   * This is adjusted based on the current degradation level
   */
  private getMaxRequestsForWindow(): number {
    // Calculate the number of requests in the current window
    const now = Date.now();
    const windowStart = now - this.config.timeWindow;
    
    // Remove requests outside the window
    this.requestHistory = this.requestHistory.filter(time => time >= windowStart);
    
    // Apply degradation level (0-5, where 5 is maximum degradation)
    const degradationFactor = 1 - (this.degradationLevel * 0.15);
    return Math.max(5, Math.floor(this.config.maxRequests * degradationFactor));
  }
  
  /**
   * Adjust the degradation level based on recent API health
   */
  private adjustDegradationLevel(): void {
    // This would ideally be based on API response times, error rates, etc.
    // For now we'll just use a simple heuristic based on queue size
    
    const queueSize = this.requestQueue.length;
    
    if (queueSize > this.config.maxQueueLength * 0.8) {
      // Increase degradation level if queue is getting full
      this.degradationLevel = Math.min(5, this.degradationLevel + 1);
    } else if (queueSize < this.config.maxQueueLength * 0.2) {
      // Decrease degradation level if queue is mostly empty
      this.degradationLevel = Math.max(0, this.degradationLevel - 1);
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
    // If we have an explicit rate limit end time
    if (this.rateLimitedUntil > Date.now()) {
      return true;
    }
    
    // Check if we've exceeded the request limit
    const now = Date.now();
    const windowStart = now - this.config.timeWindow;
    
    // Count requests in the current window
    const requestsInWindow = this.requestHistory.filter(time => time >= windowStart).length;
    
    return requestsInWindow >= this.getMaxRequestsForWindow();
  }
  
  /**
   * Get time until rate limit expires (in ms)
   */
  public getTimeUntilRateLimitExpires(): number {
    // If we have an explicit rate limit end time
    if (this.rateLimitedUntil > Date.now()) {
      return this.rateLimitedUntil - Date.now();
    }
    
    // Otherwise calculate based on the oldest request that would need to expire
    const now = Date.now();
    const maxRequests = this.getMaxRequestsForWindow();
    
    // If we haven't exceeded the limit, return 0
    if (this.requestHistory.length <= maxRequests) {
      return 0;
    }
    
    // Sort request history by time
    const sortedHistory = [...this.requestHistory].sort((a, b) => a - b);
    
    // Find the oldest request that needs to expire
    const oldestRequest = sortedHistory[sortedHistory.length - maxRequests];
    
    // Calculate time until it expires
    return (oldestRequest + this.config.timeWindow) - now;
  }
  
  /**
   * Reset the rate limiter
   */
  public reset(): void {
    this.requestHistory = [];
    this.rateLimitedUntil = 0;
    this.endpointLimits.clear();
    this.degradationLevel = 0;
    
    // Reject all queued requests
    this.requestQueue.forEach(request => {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.reject(new Error('Rate limiter was reset'));
    });
    
    this.requestQueue = [];
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();

/**
 * React hook for using the rate limiter
 */
export function useRateLimiter() {
  const [queueLength, setQueueLength] = useState(rateLimiter.getQueueLength());
  const [degradationLevel, setDegradationLevel] = useState(rateLimiter.getDegradationLevel());
  const [isLimited, setIsLimited] = useState(rateLimiter.isRateLimited());
  
  useEffect(() => {
    // Update status every second
    const interval = setInterval(() => {
      setQueueLength(rateLimiter.getQueueLength());
      setDegradationLevel(rateLimiter.getDegradationLevel());
      setIsLimited(rateLimiter.isRateLimited());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    queueLength,
    degradationLevel,
    isLimited,
    timeUntilReset: rateLimiter.getTimeUntilRateLimitExpires(),
    reset: () => rateLimiter.reset()
  };
}

// Export default for convenience
export default rateLimiter;
