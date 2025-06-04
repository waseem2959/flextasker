/**
 * Rate Limiter Service
 * 
 * Provides rate limiting functionality to prevent API abuse and ensure
 * fair usage of resources. This service can:
 * - Limit requests per time period
 * - Queue requests when limits are reached
 * - Provide feedback on rate limit status
 */

interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  enableQueueing: boolean;
  queueTimeout: number; // in milliseconds
}

interface QueuedRequest {
  id: string;
  timestamp: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class RateLimiter {
  private config: RateLimiterConfig | null = null;
  private minuteRequests: { timestamp: number }[] = [];
  private hourRequests: { timestamp: number }[] = [];
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;

  /**
   * Initialize the rate limiter with configuration
   */
  initialize(config: RateLimiterConfig): void {
    this.config = config;
    this.cleanupOldRequests();
  }

  /**
   * Reset the rate limiter state
   */
  reset(): void {
    this.minuteRequests = [];
    this.hourRequests = [];
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Execute a function with rate limiting applied
   * Returns a promise that resolves with the function result
   * or rejects if rate limit is exceeded and queueing is disabled
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config) {
      console.warn('Rate limiter not initialized, executing without limits');
      return fn();
    }

    this.cleanupOldRequests();

    // Check if we're over the rate limits
    const isOverMinuteLimit = this.minuteRequests.length >= this.config.maxRequestsPerMinute;
    const isOverHourLimit = this.hourRequests.length >= this.config.maxRequestsPerHour;

    if (isOverMinuteLimit || isOverHourLimit) {
      if (!this.config.enableQueueing) {
        throw new Error(
          `Rate limit exceeded. ${isOverMinuteLimit ? 'Minute' : 'Hour'} limit reached.`
        );
      }

      // Queue the request instead
      return this.queueRequest(fn);
    }

    // Track this request
    const now = Date.now();
    this.minuteRequests.push({ timestamp: now });
    this.hourRequests.push({ timestamp: now });

    // Execute the request
    return fn();
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    if (!this.config) return { initialized: false };

    this.cleanupOldRequests();

    return {
      initialized: true,
      minuteUsage: {
        current: this.minuteRequests.length,
        limit: this.config.maxRequestsPerMinute,
        remaining: this.config.maxRequestsPerMinute - this.minuteRequests.length,
      },
      hourUsage: {
        current: this.hourRequests.length,
        limit: this.config.maxRequestsPerHour,
        remaining: this.config.maxRequestsPerHour - this.hourRequests.length,
      },
      queueLength: this.requestQueue.length,
    };
  }

  /**
   * Clean up requests that are outside the time window
   */
  private cleanupOldRequests(): void {
    if (!this.config) return;

    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;

    this.minuteRequests = this.minuteRequests.filter(
      (req) => req.timestamp > minuteAgo
    );
    this.hourRequests = this.hourRequests.filter(
      (req) => req.timestamp > hourAgo
    );
  }

  /**
   * Queue a request for later execution
   */
  private queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.config) {
        reject(new Error('Rate limiter not initialized'));
        return;
      }

      const requestId = Math.random().toString(36).substring(2, 15);
      const queuedRequest: QueuedRequest = {
        id: requestId,
        timestamp: Date.now(),
        execute: fn,
        resolve: resolve as (value: any) => void,
        reject,
      };

      this.requestQueue.push(queuedRequest);

      // Set timeout for this queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex((req) => req.id === requestId);
        if (index !== -1) {
          const [removedRequest] = this.requestQueue.splice(index, 1);
          removedRequest.reject(
            new Error('Request timed out while waiting in rate limit queue')
          );
        }
      }, this.config.queueTimeout);

      // Start processing the queue if not already doing so
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests when rate limits allow
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.config) return;

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        this.cleanupOldRequests();

        // Check if we can process more requests
        const isOverMinuteLimit =
          this.minuteRequests.length >= this.config.maxRequestsPerMinute;
        const isOverHourLimit =
          this.hourRequests.length >= this.config.maxRequestsPerHour;

        if (isOverMinuteLimit || isOverHourLimit) {
          // Wait before checking again
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        // Process the next request
        const nextRequest = this.requestQueue.shift();
        if (!nextRequest) continue;

        // Track this request
        const now = Date.now();
        this.minuteRequests.push({ timestamp: now });
        this.hourRequests.push({ timestamp: now });

        // Execute the request
        try {
          const result = await nextRequest.execute();
          nextRequest.resolve(result);
        } catch (error) {
          nextRequest.reject(error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();