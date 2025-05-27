/**
 * API Performance Monitoring System
 * 
 * This service tracks API call performance metrics, identifies slow requests,
 * and provides analytics for optimizing application performance.
 */

import { ApiResponse } from '@/types/api';

// Performance metric types
export interface RequestMetric {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  cached: boolean;
  size: number;
  retryCount: number;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  callCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  p95Duration: number; // 95th percentile
  cacheHitRate: number;
  lastCalled: Date;
}

// Configurable thresholds
export interface PerformanceThresholds {
  slow: number; // ms
  verySlow: number; // ms
  timeout: number; // ms
  maxRetries: number;
  maxSize: number; // bytes
}

// Default thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slow: 1000, // 1 second
  verySlow: 3000, // 3 seconds
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  maxSize: 1024 * 1024 // 1MB
};

// Performance monitor class
export class PerformanceMonitor {
  private metrics: RequestMetric[] = [];
  private thresholds: PerformanceThresholds;
  private endpointStats: Map<string, EndpointStats> = new Map();
  private maxMetricsCount = 1000; // Maximum number of metrics to store
  private listeners: Set<(metric: RequestMetric) => void> = new Set();
  private slowRequestListeners: Set<(metric: RequestMetric) => void> = new Set();
  
  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    
    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000); // 5 minutes
  }
  
  // Start timing a request
  public startTiming(endpoint: string, method: string): number {
    return performance.now();
  }
  
  // Record a completed request
  public recordRequest(
    endpoint: string,
    method: string,
    startTime: number,
    status: number,
    success: boolean,
    cached: boolean = false,
    size: number = 0,
    retryCount: number = 0
  ): RequestMetric {
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
    
    // Add to metrics history (limit size)
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics.shift();
    }
    
    // Update endpoint statistics
    this.updateEndpointStats(metric);
    
    // Notify listeners
    this.notifyListeners(metric);
    
    // Check for slow requests
    if (duration > this.thresholds.slow) {
      this.handleSlowRequest(metric);
    }
    
    return metric;
  }
  
  // Update endpoint statistics with new metric
  private updateEndpointStats(metric: RequestMetric): void {
    const key = `${metric.method}:${metric.endpoint}`;
    const existing = this.endpointStats.get(key);
    
    if (existing) {
      // Update existing stats
      const newCallCount = existing.callCount + 1;
      const newTotalDuration = existing.totalDuration + metric.duration;
      
      // Update min/max durations
      const minDuration = Math.min(existing.minDuration, metric.duration);
      const maxDuration = Math.max(existing.maxDuration, metric.duration);
      
      // Update success rate
      const newSuccessCount = existing.successRate * existing.callCount + (metric.success ? 1 : 0);
      const newSuccessRate = newSuccessCount / newCallCount;
      
      // Update cache hit rate
      const newCacheHits = existing.cacheHitRate * existing.callCount + (metric.cached ? 1 : 0);
      const newCacheHitRate = newCacheHits / newCallCount;
      
      // Create sorted list of durations for percentile calculation
      const durations = [...this.getEndpointMetrics(metric.endpoint, metric.method)
        .map(m => m.duration)]
        .sort((a, b) => a - b);
      
      // Calculate 95th percentile
      const p95Index = Math.floor(durations.length * 0.95);
      const p95Duration = durations[p95Index] || maxDuration;
      
      this.endpointStats.set(key, {
        endpoint: metric.endpoint,
        method: metric.method,
        callCount: newCallCount,
        totalDuration: newTotalDuration,
        averageDuration: newTotalDuration / newCallCount,
        minDuration,
        maxDuration,
        successRate: newSuccessRate,
        p95Duration,
        cacheHitRate: newCacheHitRate,
        lastCalled: new Date()
      });
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
  
  // Handle slow requests
  private handleSlowRequest(metric: RequestMetric): void {
    // Log slow requests in development
    if (import.meta.env.DEV) {
      console.warn(
        `Slow API call: ${metric.method} ${metric.endpoint} took ${metric.duration.toFixed(2)}ms`,
        metric
      );
    }
    
    // Notify slow request listeners
    this.slowRequestListeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in slow request listener:', error);
      }
    });
  }
  
  // Clean up old metrics to prevent memory leaks
  private cleanupOldMetrics(): void {
    const now = performance.now();
    const ONE_HOUR = 60 * 60 * 1000;
    
    // Keep only metrics from the last hour
    this.metrics = this.metrics.filter(metric => (now - metric.startTime) < ONE_HOUR);
  }
  
  // Notify all metric listeners
  private notifyListeners(metric: RequestMetric): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (error) {
        console.error('Error in metric listener:', error);
      }
    });
  }
  
  // Get all metrics for an endpoint
  public getEndpointMetrics(endpoint: string, method: string): RequestMetric[] {
    return this.metrics.filter(
      metric => metric.endpoint === endpoint && metric.method === method
    );
  }
  
  // Get statistics for all endpoints
  public getAllEndpointStats(): EndpointStats[] {
    return Array.from(this.endpointStats.values());
  }
  
  // Get statistics for a specific endpoint
  public getEndpointStats(endpoint: string, method: string): EndpointStats | undefined {
    return this.endpointStats.get(`${method}:${endpoint}`);
  }
  
  // Get the slowest endpoints
  public getSlowestEndpoints(limit: number = 5): EndpointStats[] {
    return Array.from(this.endpointStats.values())
      .filter(stats => stats.callCount >= 5) // Only consider endpoints with enough data
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }
  
  // Get endpoints with the lowest success rate
  public getLeastReliableEndpoints(limit: number = 5): EndpointStats[] {
    return Array.from(this.endpointStats.values())
      .filter(stats => stats.callCount >= 5) // Only consider endpoints with enough data
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, limit);
  }
  
  // Subscribe to all request metrics
  public subscribe(listener: (metric: RequestMetric) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // Subscribe to slow request notifications
  public subscribeToSlowRequests(listener: (metric: RequestMetric) => void): () => void {
    this.slowRequestListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.slowRequestListeners.delete(listener);
    };
  }
  
  // Get overall API performance score (0-100)
  public getPerformanceScore(): number {
    if (this.endpointStats.size === 0) {
      return 100; // No data yet
    }
    
    const stats = Array.from(this.endpointStats.values());
    
    // Calculate average success rate (30% of score)
    const avgSuccessRate = stats.reduce((sum, stat) => sum + stat.successRate, 0) / stats.length;
    const successScore = avgSuccessRate * 30;
    
    // Calculate speed score (50% of score)
    // We consider anything under 300ms to be "perfect" and anything over threshold.slow to be "bad"
    const avgSpeed = stats.reduce((sum, stat) => sum + stat.averageDuration, 0) / stats.length;
    const speedRatio = Math.min(1, Math.max(0, (this.thresholds.slow - avgSpeed) / (this.thresholds.slow - 300)));
    const speedScore = speedRatio * 50;
    
    // Calculate cache usage (20% of score)
    const avgCacheRate = stats.reduce((sum, stat) => sum + stat.cacheHitRate, 0) / stats.length;
    const cacheScore = avgCacheRate * 20;
    
    return Math.round(successScore + speedScore + cacheScore);
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for monitoring performance
export function usePerformanceMonitoring() {
  return {
    monitor: performanceMonitor,
    getPerformanceScore: performanceMonitor.getPerformanceScore.bind(performanceMonitor),
    getSlowestEndpoints: performanceMonitor.getSlowestEndpoints.bind(performanceMonitor),
    getLeastReliableEndpoints: performanceMonitor.getLeastReliableEndpoints.bind(performanceMonitor),
    getAllEndpointStats: performanceMonitor.getAllEndpointStats.bind(performanceMonitor)
  };
}
