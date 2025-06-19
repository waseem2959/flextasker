/**
 * Performance Monitoring Service
 * 
 * Comprehensive performance monitoring and metrics collection for web applications.
 * Tracks Core Web Vitals, API response times, component render times, and user interactions.
 */

import { errorTracker } from './error-tracking';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  category: 'core-web-vitals' | 'navigation' | 'resource' | 'custom' | 'user-interaction' | 'api' | 'component';
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

interface NavigationTiming {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
  total: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private componentMetrics: ComponentMetric[] = [];
  private isEnabled: boolean = true;
  private maxMetrics = 1000;
  private observer?: PerformanceObserver;
  private vitalsThresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 }
  };

  constructor() {
    this.initializePerformanceObserver();
    this.setupAPIInterceptors();
    this.trackCoreWebVitals();
    this.setupUserInteractionTracking();
  }

  // === CORE MONITORING ===
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'navigation':
              this.handleNavigationEntry(entry as PerformanceNavigationTiming);
              break;
            case 'resource':
              this.handleResourceEntry(entry as PerformanceResourceTiming);
              break;
            case 'paint':
              this.handlePaintEntry(entry);
              break;
            case 'largest-contentful-paint':
              this.handleLCPEntry(entry);
              break;
            case 'first-input':
              this.handleFIDEntry(entry);
              break;
            case 'layout-shift':
              this.handleCLSEntry(entry);
              break;
          }
        });
      });

      // Observe all available entry types
      const entryTypes = ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'];
      
      entryTypes.forEach(type => {
        try {
          this.observer!.observe({ entryTypes: [type] });
        } catch (e) {
          console.debug(`Performance entry type "${type}" not supported`);
        }
      });
      
      this.trackNavigationTiming();
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  // === CORE WEB VITALS TRACKING ===
  private trackCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    this.observeWebVital('largest-contentful-paint', (value) => {
      this.recordMetric({
        name: 'LCP',
        value,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'core-web-vitals',
        tags: {
          threshold: this.getThresholdLabel('lcp', value)
        }
      });
    });

    // FID (First Input Delay)
    this.observeWebVital('first-input', (value) => {
      this.recordMetric({
        name: 'FID',
        value,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'core-web-vitals',
        tags: {
          threshold: this.getThresholdLabel('fid', value)
        }
      });
    });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    this.observeWebVital('layout-shift', (value) => {
      clsValue += value;
      this.recordMetric({
        name: 'CLS',
        value: clsValue,
        unit: 'score',
        timestamp: Date.now(),
        category: 'core-web-vitals',
        tags: {
          threshold: this.getThresholdLabel('cls', clsValue)
        }
      });
    });

    // FCP (First Contentful Paint)
    this.observeWebVital('paint', (value, entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.recordMetric({
          name: 'FCP',
          value,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'core-web-vitals',
          tags: {
            threshold: this.getThresholdLabel('fcp', value)
          }
        });
      }
    });
  }

  private observeWebVital(entryType: string, callback: (value: number, entry?: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const value = entry.entryType === 'layout-shift' 
            ? (entry as any).value 
            : entry.startTime;
          callback(value, entry);
        });
      });

      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.debug(`Web vital "${entryType}" observation failed:`, error);
    }
  }

  private trackNavigationTiming(): void {
    if (!('performance' in window) || !performance.timing) return;

    setTimeout(() => {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;

      const navigationTiming: NavigationTiming = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        load: timing.loadEventEnd - timing.loadEventStart,
        total: timing.loadEventEnd - navigationStart
      };

      Object.entries(navigationTiming).forEach(([key, value]) => {
        if (value > 0) {
          this.recordMetric({
            name: `navigation.${key}`,
            value,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'navigation'
          });
        }
      });

      // TTFB (Time to First Byte)
      const ttfb = timing.responseStart - navigationStart;
      this.recordMetric({
        name: 'TTFB',
        value: ttfb,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'core-web-vitals',
        tags: {
          threshold: this.getThresholdLabel('ttfb', ttfb)
        }
      });
    }, 0);
  }

  private setupUserInteractionTracking(): void {
    document.addEventListener('visibilitychange', () => {
      this.recordMetric({
        name: 'page.visibility',
        value: document.hidden ? 0 : 1,
        unit: 'boolean',
        timestamp: Date.now(),
        category: 'user-interaction',
        tags: {
          state: document.hidden ? 'hidden' : 'visible'
        }
      });
    });

    document.addEventListener('click', () => {
      this.recordMetric({
        name: 'user.click',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        category: 'user-interaction'
      });
    });

    window.addEventListener('beforeunload', () => {
      this.reportSessionMetrics();
    });
  }

  // === PERFORMANCE ENTRY HANDLERS ===
  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      'navigation.redirectTime': entry.redirectEnd - entry.redirectStart,
      'navigation.dnsTime': entry.domainLookupEnd - entry.domainLookupStart,
      'navigation.tcpTime': entry.connectEnd - entry.connectStart,
      'navigation.requestTime': entry.responseStart - entry.requestStart,
      'navigation.responseTime': entry.responseEnd - entry.responseStart,
      'navigation.domParseTime': entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      'navigation.loadTime': entry.loadEventEnd - entry.loadEventStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value >= 0) {
        this.recordMetric({
          name,
          value,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'navigation'
        });
      }
    });
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const size = entry.transferSize || entry.encodedBodySize || 0;

    this.recordMetric({
      name: 'resource.loadTime',
      value: entry.duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'resource',
      tags: {
        type: resourceType,
        name: this.getResourceName(entry.name)
      }
    });

    if (size > 0) {
      this.recordMetric({
        name: 'resource.size',
        value: size,
        unit: 'bytes',
        timestamp: Date.now(),
        category: 'resource',
        tags: {
          type: resourceType,
          name: this.getResourceName(entry.name)
        }
      });
    }
  }

  private handlePaintEntry(entry: PerformanceEntry): void {
    this.recordMetric({
      name: entry.name.replace('-', '.'),
      value: entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'core-web-vitals'
    });
  }

  private handleLCPEntry(entry: any): void {
    this.recordMetric({
      name: 'LCP',
      value: entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'core-web-vitals',
      tags: {
        element: entry.element?.tagName || 'unknown',
        threshold: this.getThresholdLabel('lcp', entry.startTime)
      }
    });
  }

  private handleFIDEntry(entry: any): void {
    this.recordMetric({
      name: 'FID',
      value: entry.processingStart - entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'core-web-vitals',
      tags: {
        threshold: this.getThresholdLabel('fid', entry.processingStart - entry.startTime)
      }
    });
  }

  private handleCLSEntry(entry: any): void {
    if (!entry.hadRecentInput) {
      this.recordMetric({
        name: 'layout.shift',
        value: entry.value,
        unit: 'score',
        timestamp: Date.now(),
        category: 'core-web-vitals'
      });
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

    const responseTime = endTime - startTime;

    const metric: APIMetric = {
      endpoint,
      method,
      responseTime,
      status,
      timestamp: Date.now(),
      error,
    };

    this.apiMetrics.push(metric);

    // Also record as performance metric
    this.recordMetric({
      name: 'api.responseTime',
      value: responseTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'api',
      tags: {
        endpoint: endpoint.split('?')[0], // Remove query params
        method,
        status: String(status),
        error: error ? 'true' : 'false'
      }
    });

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

    // Also record as performance metric
    this.recordMetric({
      name: 'component.renderTime',
      value: renderTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'component',
      tags: {
        component: componentName,
        propsCount: props ? String(Object.keys(props).length) : '0'
      }
    });

    this.trimMetrics();
  }

  // === CUSTOM METRICS ===
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send to error tracker for centralized monitoring
    errorTracker.trackPerformance({
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags
    });

    // Log significant performance issues
    if (this.isPerformanceIssue(metric)) {
      console.warn(`⚠️ Performance Issue: ${metric.name} = ${metric.value}${metric.unit}`, metric);
    }
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      this.recordMetric({
        name,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom'
      });
    };
  }

  public trackTiming(name: string, startTime: number, endTime?: number): void {
    const duration = (endTime || performance.now()) - startTime;
    
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'custom'
    });
  }

  public trackBundleMetrics(): void {
    if (!('performance' in window)) return;

    const jsResources = performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.includes('.js'))
      .reduce((total: number, entry: any) => total + (entry.transferSize || 0), 0);

    const cssResources = performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.includes('.css'))
      .reduce((total: number, entry: any) => total + (entry.transferSize || 0), 0);

    this.recordMetric({
      name: 'bundle.js.size',
      value: jsResources,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'resource'
    });

    this.recordMetric({
      name: 'bundle.css.size',
      value: cssResources,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'resource'
    });
  }

  // === ANALYTICS ===
  public getMetricsSummary(): {
    totalMetrics: number;
    averageAPIResponseTime: number;
    slowestAPI: APIMetric | null;
    averageComponentRenderTime: number;
    slowestComponent: ComponentMetric | null;
    coreWebVitals: Record<string, number>;
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
      coreWebVitals: this.getCoreWebVitals(),
    };
  }

  private getCoreWebVitals(): Record<string, number> {
    const vitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
    const result: Record<string, number> = {};

    vitals.forEach(vital => {
      const metric = this.metrics
        .filter(m => m.name === vital)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (metric) {
        result[vital] = metric.value;
      }
    });

    return result;
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

  private reportSessionMetrics(): void {
    const summary = this.getMetricsSummary();
    
    console.group('📊 Performance Session Summary');
    console.log('Core Web Vitals:', summary.coreWebVitals);
    console.log('Average API Response Time:', `${summary.averageAPIResponseTime.toFixed(2)}ms`);
    console.log('Average Component Render Time:', `${summary.averageComponentRenderTime.toFixed(2)}ms`);
    console.log('Total Metrics:', summary.totalMetrics);
    console.groupEnd();

    this.sendSessionData(summary);
  }

  private sendSessionData(summary: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Session data ready for transmission:', summary);
    }
  }

  // === UTILITY METHODS ===
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    return 'other';
  }

  private getResourceName(url: string): string {
    try {
      return new URL(url).pathname.split('/').pop() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private getThresholdLabel(metric: string, value: number): string {
    const thresholds = this.vitalsThresholds[metric as keyof typeof this.vitalsThresholds];
    if (!thresholds) return 'unknown';
    
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    if (metric.category !== 'core-web-vitals') return false;
    
    const thresholds = this.vitalsThresholds[metric.name.toLowerCase() as keyof typeof this.vitalsThresholds];
    return thresholds ? metric.value > thresholds.poor : false;
  }

  private trimMetrics(): void {
    const maxMetrics = this.maxMetrics;
    
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

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformanceMonitor = (componentName?: string) => {
  const startRender = () => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      if (componentName) {
        performanceMonitor.trackComponentRender(componentName, endTime - startTime);
      }
    };
  };

  return { 
    startRender,
    trackTiming: (name: string, startTime: number, endTime?: number) => {
      performanceMonitor.trackTiming(name, startTime, endTime);
    },
    
    recordMetric: (metric: Omit<PerformanceMetric, 'timestamp'>) => {
      performanceMonitor.recordMetric({
        ...metric,
        timestamp: Date.now()
      });
    },
    
    getPerformanceSummary: () => {
      return performanceMonitor.getMetricsSummary();
    },
    
    trackBundleMetrics: () => {
      performanceMonitor.trackBundleMetrics();
    }
  };
};

export default performanceMonitor;
