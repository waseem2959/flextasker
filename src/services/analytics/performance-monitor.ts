/**
 * API Performance Monitoring System
 * 
 * This module provides performance monitoring capabilities for tracking and analyzing
 * API request performance across the application.
 */

import { EndpointStats, PerformanceThresholds, RecordRequestParams, RequestMetric } from './types/performance';

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slow: 1000, // 1 second
  verySlow: 3000, // 3 seconds
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  maxSize: 1024 * 1024 // 1MB
};

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: RequestMetric[] = [];
  private readonly endpointStats: Map<string, EndpointStats> = new Map();
  private readonly thresholds: PerformanceThresholds;
  private readonly maxMetricsCount = 1000;
  private readonly listeners: Set<(metric: RequestMetric) => void> = new Set();
  private readonly slowRequestListeners: Set<(metric: RequestMetric) => void> = new Set();

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    
    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Start timing a request
   */
  startTiming(): number {
    return performance.now();
  }

  /**
   * Record a completed request
   */
  recordRequest(params: RecordRequestParams): RequestMetric {
    const { endpoint, method, startTime, status, success, cached = false, size = 0, retryCount = 0 } = params;
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metric: RequestMetric = {
      endpoint,
      method,
      startTime,
      endTime,
      duration,
      status,
      success,
      cached,
      size,
      retryCount
    };
    
    // Add to metrics collection
    this.metrics.push(metric);
    
    // Update endpoint stats
    this.updateEndpointStats(metric);
    
    // Handle slow requests
    if (duration > this.thresholds.slow) {
      this.handleSlowRequest(metric);
    }
    
    // Notify listeners
    this.notifyListeners(metric);
    
    // Keep metrics collection from growing too large
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics.shift();
    }
    
    return metric;
  }

  /**
   * Update endpoint statistics with new metric
   */
  private updateEndpointStats(metric: RequestMetric): void {
    const key = `${metric.method}:${metric.endpoint}`;
    const existing = this.endpointStats.get(key);
    
    if (existing) {
      // Update existing stats
      existing.callCount++;
      existing.totalDuration += metric.duration;
      existing.averageDuration = existing.totalDuration / existing.callCount;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      
      const successCount = existing.successRate * (existing.callCount - 1) + (metric.success ? 1 : 0);
      existing.successRate = successCount / existing.callCount;
      
      const cacheHits = existing.cacheHitRate * (existing.callCount - 1) + (metric.cached ? 1 : 0);
      existing.cacheHitRate = cacheHits / existing.callCount;
      
      existing.lastCalled = new Date();
      
      // Recalculate p95
      const endpointMetrics = this.getEndpointMetrics(metric.endpoint, metric.method);
      const durations = endpointMetrics.map(m => m.duration).sort((a, b) => a - b);
      const p95Index = Math.floor(durations.length * 0.95);
      existing.p95Duration = durations[p95Index] || existing.averageDuration;
    } else {
      // Create new stats
      this.endpointStats.set(key, {
        endpoint: metric.endpoint,
        method: metric.method,
        callCount: 1,
        totalDuration: metric.duration,
        averageDuration: metric.duration,
        minDuration: metric.duration,
        maxDuration: metric.duration,
        successRate: metric.success ? 1 : 0,
        p95Duration: metric.duration,
        cacheHitRate: metric.cached ? 1 : 0,
        lastCalled: new Date()
      });
    }
  }

  /**
   * Handle slow requests
   */
  private handleSlowRequest(metric: RequestMetric): void {
    this.slowRequestListeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in slow request listener:', error);
      }
    });
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const now = performance.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Keep only metrics from the last 24 hours
    this.metrics = this.metrics.filter(metric => now - metric.startTime < dayInMs);
  }

  /**
   * Notify all metric listeners
   */
  private notifyListeners(metric: RequestMetric): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in performance metric listener:', error);
      }
    });
  }

  /**
   * Get all metrics for an endpoint
   */
  getEndpointMetrics(endpoint: string, method: string): RequestMetric[] {
    return this.metrics.filter(m => 
      m.endpoint === endpoint && m.method === method
    );
  }

  /**
   * Get statistics for all endpoints
   */
  getAllEndpointStats(): EndpointStats[] {
    return Array.from(this.endpointStats.values());
  }

  /**
   * Get statistics for a specific endpoint
   */
  getEndpointStats(endpoint: string, method: string): EndpointStats | undefined {
    return this.endpointStats.get(`${method}:${endpoint}`);
  }

  /**
   * Get the slowest endpoints
   */
  getSlowestEndpoints(limit: number = 5): EndpointStats[] {
    return Array.from(this.endpointStats.values())
      .filter(stats => stats.callCount >= 5) // Require minimum sample size
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }

  /**
   * Get endpoints with the lowest success rate
   */
  getLeastReliableEndpoints(limit: number = 5): EndpointStats[] {
    return Array.from(this.endpointStats.values())
      .filter(stats => stats.callCount >= 5) // Require minimum sample size
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, limit);
  }

  /**
   * Get overall API performance score (0-100)
   */
  getPerformanceScore(): number {
    const stats = this.getAllEndpointStats();
    if (stats.length === 0) return 100;
    
    // Calculate weighted score based on:
    // - Speed (avg response time)
    // - Reliability (success rate)
    // - Consistency (p95/avg ratio)
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const stat of stats) {
      const weight = Math.log(stat.callCount + 1); // Weight by call count
      totalWeight += weight;
      
      // Speed score (0-40)
      let speedScore = 0;
      if (stat.averageDuration < this.thresholds.slow / 2) {
        speedScore = 40;
      } else if (stat.averageDuration < this.thresholds.slow) {
        speedScore = 30;
      } else if (stat.averageDuration < this.thresholds.verySlow) {
        speedScore = 20;
      } else if (stat.averageDuration < this.thresholds.timeout) {
        speedScore = 10;
      }
      
      // Reliability score (0-40)
      const reliabilityScore = Math.round(stat.successRate * 40);
      
      // Consistency score (0-20)
      const consistencyRatio = stat.p95Duration / stat.averageDuration;
      let consistencyScore = 0;
      if (consistencyRatio < 1.5) {
        consistencyScore = 20;
      } else if (consistencyRatio < 2) {
        consistencyScore = 15;
      } else if (consistencyRatio < 3) {
        consistencyScore = 10;
      } else if (consistencyRatio < 5) {
        consistencyScore = 5;
      }
      
      // Combined score
      const endpointScore = speedScore + reliabilityScore + consistencyScore;
      totalScore += endpointScore * weight;
    }
    
    return Math.round(totalScore / totalWeight);
  }

  /**
   * Track error for monitoring
   */
  trackError(source: string, message: string, metadata: Record<string, any> = {}): void {
    console.error(`[${source}] ${message}`, metadata);
    
    // In a real implementation, this would send error data to your monitoring service
    // For example: Sentry, LogRocket, or your own error tracking backend
    
    // For now, we'll just aggregate error stats locally
    const metric: RequestMetric = {
      endpoint: source,
      method: 'ERROR',
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      status: 500,
      success: false,
      cached: false,
      size: 0,
      retryCount: 0
    };
    
    this.recordRequest({
      ...metric,
      success: false
    });
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for monitoring performance
 */
export function usePerformanceMonitoring() {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    recordRequest: performanceMonitor.recordRequest.bind(performanceMonitor),
    getPerformanceScore: performanceMonitor.getPerformanceScore.bind(performanceMonitor),
    getSlowestEndpoints: performanceMonitor.getSlowestEndpoints.bind(performanceMonitor),
    getLeastReliableEndpoints: performanceMonitor.getLeastReliableEndpoints.bind(performanceMonitor),
    getAllEndpointStats: performanceMonitor.getAllEndpointStats.bind(performanceMonitor)
  };
}