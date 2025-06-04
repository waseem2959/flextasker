/**
 * Performance Monitoring Service
 * 
 * Comprehensive performance monitoring for frontend application including
 * API response times, component render times, and user interactions.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface APIMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
  error?: string;
}

interface ComponentMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
  props?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private componentMetrics: ComponentMetric[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializePerformanceObserver();
    this.setupAPIInterceptors();
  }

  // === CORE MONITORING ===
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'navigation',
            value: entry.duration,
            timestamp: Date.now(),
            metadata: {
              type: entry.entryType,
              name: entry.name,
            },
          });
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'resource-load',
            value: entry.duration,
            timestamp: Date.now(),
            metadata: {
              name: entry.name,
              size: (entry as any).transferSize || 0,
            },
          });
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Monitor largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'largest-contentful-paint',
            value: entry.startTime,
            timestamp: Date.now(),
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  // === API MONITORING ===
  private setupAPIInterceptors(): void {
    // This would typically be integrated with your API client
    // For now, we'll provide methods to manually track API calls
  }

  public trackAPICall(
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const metric: APIMetric = {
      endpoint,
      method,
      responseTime: endTime - startTime,
      status,
      timestamp: Date.now(),
      error,
    };

    this.apiMetrics.push(metric);
    this.trimMetrics();
  }

  // === COMPONENT MONITORING ===
  public trackComponentRender(
    componentName: string,
    renderTime: number,
    props?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: ComponentMetric = {
      componentName,
      renderTime,
      timestamp: Date.now(),
      props,
    };

    this.componentMetrics.push(metric);
    this.trimMetrics();
  }

  // === CUSTOM METRICS ===
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    this.trimMetrics();
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
      });
    };
  }

  // === ANALYTICS ===
  public getMetricsSummary(): {
    totalMetrics: number;
    averageAPIResponseTime: number;
    slowestAPI: APIMetric | null;
    averageComponentRenderTime: number;
    slowestComponent: ComponentMetric | null;
  } {
    const avgAPITime = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / this.apiMetrics.length
      : 0;

    const slowestAPI = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((slowest, current) => 
          current.responseTime > slowest.responseTime ? current : slowest
        )
      : null;

    const avgComponentTime = this.componentMetrics.length > 0
      ? this.componentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / this.componentMetrics.length
      : 0;

    const slowestComponent = this.componentMetrics.length > 0
      ? this.componentMetrics.reduce((slowest, current) => 
          current.renderTime > slowest.renderTime ? current : slowest
        )
      : null;

    return {
      totalMetrics: this.metrics.length + this.apiMetrics.length + this.componentMetrics.length,
      averageAPIResponseTime: avgAPITime,
      slowestAPI,
      averageComponentRenderTime: avgComponentTime,
      slowestComponent,
    };
  }

  public getRecentMetrics(minutes: number = 5): {
    metrics: PerformanceMetric[];
    apiMetrics: APIMetric[];
    componentMetrics: ComponentMetric[];
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);

    return {
      metrics: this.metrics.filter(m => m.timestamp > cutoff),
      apiMetrics: this.apiMetrics.filter(m => m.timestamp > cutoff),
      componentMetrics: this.componentMetrics.filter(m => m.timestamp > cutoff),
    };
  }

  // === REPORTING ===
  public async sendMetricsToServer(): Promise<void> {
    if (!this.isEnabled || this.metrics.length === 0) return;

    try {
      const summary = this.getMetricsSummary();
      const recentMetrics = this.getRecentMetrics(5);

      // Send to your monitoring endpoint
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          recentMetrics,
          timestamp: Date.now(),
        }),
      });

      // Clear old metrics after successful send
      this.clearOldMetrics();
    } catch (error) {
      console.warn('Failed to send metrics to server:', error);
    }
  }

  // === UTILITY METHODS ===
  private trimMetrics(): void {
    const maxMetrics = 1000;
    
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
    
    if (this.apiMetrics.length > maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-maxMetrics);
    }
    
    if (this.componentMetrics.length > maxMetrics) {
      this.componentMetrics = this.componentMetrics.slice(-maxMetrics);
    }
  }

  private clearOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > oneHourAgo);
    this.componentMetrics = this.componentMetrics.filter(m => m.timestamp > oneHourAgo);
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public clear(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.componentMetrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for component monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const startRender = () => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      performanceMonitor.trackComponentRender(componentName, endTime - startTime);
    };
  };

  return { startRender };
};

export default performanceMonitor;
