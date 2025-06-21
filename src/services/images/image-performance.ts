/**
 * Image Performance Monitor
 * 
 * Tracks image loading performance, optimization effectiveness,
 * and provides insights for further optimization.
 */

interface ImageLoadMetrics {
  src: string;
  loadTime: number;
  size?: number;
  format: string;
  wasLazy: boolean;
  wasCached: boolean;
  retryCount: number;
  timestamp: number;
  viewport: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
  };
}

interface PerformanceStats {
  totalImages: number;
  averageLoadTime: number;
  successRate: number;
  formatBreakdown: Record<string, number>;
  lazyLoadingSavings: number;
  slowestImages: ImageLoadMetrics[];
  recommendations: string[];
}

class ImagePerformanceMonitor {
  private metrics: ImageLoadMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private observers: Set<(stats: PerformanceStats) => void> = new Set();

  constructor() {
    // Setup performance observer for navigation timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
  }

  /**
   * Record image load metrics
   */
  public recordImageLoad(metrics: Omit<ImageLoadMetrics, 'timestamp' | 'viewport' | 'connection'>): void {
    const fullMetrics: ImageLoadMetrics = {
      ...metrics,
      timestamp: Date.now(),
      viewport: this.getViewportSize(),
      connection: this.getConnectionInfo()
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Get comprehensive performance statistics
   */
  public getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalImages: 0,
        averageLoadTime: 0,
        successRate: 100,
        formatBreakdown: {},
        lazyLoadingSavings: 0,
        slowestImages: [],
        recommendations: []
      };
    }

    const successfulLoads = this.metrics.filter(m => m.loadTime > 0);
    const totalLoadTime = successfulLoads.reduce((sum, m) => sum + m.loadTime, 0);
    const averageLoadTime = totalLoadTime / successfulLoads.length;

    // Format breakdown
    const formatBreakdown: Record<string, number> = {};
    this.metrics.forEach(m => {
      formatBreakdown[m.format] = (formatBreakdown[m.format] || 0) + 1;
    });

    // Calculate lazy loading savings
    const lazyImages = this.metrics.filter(m => m.wasLazy);
    const eagerImages = this.metrics.filter(m => !m.wasLazy);
    const lazyLoadingSavings = this.calculateLazyLoadingSavings(lazyImages, eagerImages);

    // Find slowest images
    const slowestImages = successfulLoads
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      totalImages: this.metrics.length,
      averageLoadTime,
      successRate: (successfulLoads.length / this.metrics.length) * 100,
      formatBreakdown,
      lazyLoadingSavings,
      slowestImages,
      recommendations
    };
  }

  /**
   * Get metrics for a specific time range
   */
  public getMetricsInRange(startTime: number, endTime: number): ImageLoadMetrics[] {
    return this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get Core Web Vitals related to images
   */
  public getWebVitals(): {
    lcp?: number;
    cls?: number;
    imageRelatedIssues: string[];
  } {
    const issues: string[] = [];

    // Check for slow LCP candidates
    const slowImages = this.metrics.filter(m => m.loadTime > 2500);
    if (slowImages.length > 0) {
      issues.push(`${slowImages.length} images took longer than 2.5s to load`);
    }

    // Check for images without dimensions (potential CLS)
    const unsizedImages = this.metrics.filter(m => !m.size);
    if (unsizedImages.length > 0) {
      issues.push(`${unsizedImages.length} images may cause layout shift`);
    }

    // Check for non-optimized formats
    const unoptimizedImages = this.metrics.filter(m => 
      !['webp', 'avif'].includes(m.format.toLowerCase())
    );
    if (unoptimizedImages.length > this.metrics.length * 0.5) {
      issues.push('Many images are not using modern formats (WebP/AVIF)');
    }

    return {
      imageRelatedIssues: issues
    };
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      webVitals: this.getWebVitals(),
      metrics: this.metrics
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Subscribe to performance updates
   */
  public subscribe(callback: (stats: PerformanceStats) => void): () => void {
    this.observers.add(callback);
    
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this.metrics = [];
    this.notifyObservers();
  }

  /**
   * Setup performance observer for additional metrics
   */
  private setupPerformanceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'largest-contentful-paint') {
            // Track LCP if it's likely an image
            const lcpElement = (entry as any).element;
            if (lcpElement?.tagName === 'IMG') {
              console.log('LCP Image detected:', entry.startTime);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Get current viewport size
   */
  private getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): { effectiveType: string; downlink: number } | undefined {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      return undefined;
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) return undefined;

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0
    };
  }

  /**
   * Calculate potential savings from lazy loading
   */
  private calculateLazyLoadingSavings(lazyImages: ImageLoadMetrics[], _eagerImages: ImageLoadMetrics[]): number {
    if (lazyImages.length === 0) return 0;

    // Estimate bandwidth saved by not loading images immediately
    const averageImageSize = 200; // KB estimate
    const lazyImagesOutsideViewport = lazyImages.filter(m => !this.wasInInitialViewport(m));

    return lazyImagesOutsideViewport.length * averageImageSize;
  }

  /**
   * Check if image was likely in initial viewport
   */
  private wasInInitialViewport(metrics: ImageLoadMetrics): boolean {
    // Simple heuristic: if loaded very quickly after page load, likely in viewport
    return metrics.loadTime < 1000 && !metrics.wasLazy;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getBasicStats();

    // Slow loading images
    if (stats.averageLoadTime > 1500) {
      recommendations.push('Consider optimizing image sizes and using a CDN');
    }

    // Format optimization
    const modernFormats = this.metrics.filter(m => 
      ['webp', 'avif'].includes(m.format.toLowerCase())
    );
    const modernFormatRatio = modernFormats.length / this.metrics.length;
    
    if (modernFormatRatio < 0.7) {
      recommendations.push('Use modern image formats (WebP, AVIF) for better compression');
    }

    // Lazy loading
    const lazyImages = this.metrics.filter(m => m.wasLazy);
    const lazyRatio = lazyImages.length / this.metrics.length;
    
    if (lazyRatio < 0.5) {
      recommendations.push('Implement lazy loading for images below the fold');
    }

    // Retry issues
    const imagesWithRetries = this.metrics.filter(m => m.retryCount > 0);
    if (imagesWithRetries.length > this.metrics.length * 0.1) {
      recommendations.push('Investigate network issues or image availability');
    }

    // Slow connection considerations
    const slowConnections = this.metrics.filter(m => 
      m.connection?.effectiveType === 'slow-2g' || m.connection?.effectiveType === '2g'
    );
    if (slowConnections.length > 0) {
      recommendations.push('Provide lower quality images for slow connections');
    }

    return recommendations;
  }

  /**
   * Get basic statistics
   */
  private getBasicStats() {
    if (this.metrics.length === 0) {
      return { averageLoadTime: 0, successRate: 100 };
    }

    const successfulLoads = this.metrics.filter(m => m.loadTime > 0);
    const totalLoadTime = successfulLoads.reduce((sum, m) => sum + m.loadTime, 0);
    
    return {
      averageLoadTime: totalLoadTime / successfulLoads.length,
      successRate: (successfulLoads.length / this.metrics.length) * 100
    };
  }

  /**
   * Notify observers of updates
   */
  private notifyObservers(): void {
    const stats = this.getStats();
    this.observers.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Error in performance observer callback:', error);
      }
    });
  }
}

// Export singleton instance
export const imagePerformanceMonitor = new ImagePerformanceMonitor();

// Export types
export type { ImageLoadMetrics, PerformanceStats };
export { ImagePerformanceMonitor };