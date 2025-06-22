/**
 * Performance Monitoring Hook
 * 
 * Hook for monitoring component performance, memory usage, and render times
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
  isSlowRender: boolean;
}

// Performance monitoring options
export interface UsePerformanceOptions {
  enabled?: boolean;
  slowRenderThreshold?: number; // ms
  trackMemory?: boolean;
  logToConsole?: boolean;
  componentName?: string;
}

/**
 * Hook for monitoring component performance
 */
export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    slowRenderThreshold = 16, // 60fps = 16.67ms per frame
    trackMemory = false,
    logToConsole = false,
    componentName = 'Unknown Component'
  } = options;

  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const renderCountRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    isSlowRender: false,
  });

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  }, [enabled]);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (!enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCountRef.current += 1;
    renderTimes.current.push(renderTime);

    // Keep only last 100 render times to prevent memory bloat
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-100);
    }

    const totalTime = renderTimes.current.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / renderTimes.current.length;
    const isSlowRender = renderTime > slowRenderThreshold;

    const newMetrics: PerformanceMetrics = {
      renderCount: renderCountRef.current,
      lastRenderTime: renderTime,
      averageRenderTime: averageTime,
      totalRenderTime: totalTime,
      isSlowRender,
    };

    // Add memory usage if tracking is enabled
    if (trackMemory && 'memory' in performance) {
      newMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize;
    }

    setMetrics(newMetrics);

    // Log slow renders to console
    if (logToConsole && isSlowRender) {
      console.warn(
        `🐌 Slow render detected in ${componentName}:`,
        `${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`
      );
    }

    renderStartTime.current = 0;
  }, [enabled, slowRenderThreshold, trackMemory, logToConsole, componentName]);

  // Automatic measurement on every render
  useEffect(() => {
    startMeasurement();
    
    // End measurement in next tick to capture full render
    const timer = setTimeout(endMeasurement, 0);
    
    return () => clearTimeout(timer);
  });

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    renderTimes.current = [];
    setMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      isSlowRender: false,
    });
  }, []);

  // Get detailed performance report
  const getPerformanceReport = useCallback(() => {
    return {
      componentName,
      metrics,
      renderTimes: [...renderTimes.current],
      recommendations: generateRecommendations(metrics),
    };
  }, [componentName, metrics]);

  return {
    metrics,
    resetMetrics,
    getPerformanceReport,
    startMeasurement,
    endMeasurement,
  };
}

/**
 * Generate performance recommendations based on metrics
 */
function generateRecommendations(metrics: PerformanceMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.averageRenderTime > 16) {
    recommendations.push('Consider using React.memo() to prevent unnecessary re-renders');
  }

  if (metrics.renderCount > 100) {
    recommendations.push('High render count detected - check if state updates can be debounced');
  }

  if (metrics.isSlowRender) {
    recommendations.push('Last render was slow - consider code splitting or lazy loading');
  }

  if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
    recommendations.push('High memory usage detected - check for memory leaks');
  }

  return recommendations;
}

/**
 * Hook for measuring async operations performance
 */
export function useAsyncPerformance() {
  const [operations, setOperations] = useState<Map<string, number>>(new Map());

  const startOperation = useCallback((operationName: string) => {
    setOperations(prev => new Map(prev.set(operationName, performance.now())));
  }, []);

  const endOperation = useCallback((operationName: string) => {
    setOperations(prev => {
      const startTime = prev.get(operationName);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`⏱️ ${operationName} completed in ${duration.toFixed(2)}ms`);
        
        const newMap = new Map(prev);
        newMap.delete(operationName);
        return newMap;
      }
      return prev;
    });
  }, []);

  const measureOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    startOperation(operationName);
    try {
      const result = await operation();
      endOperation(operationName);
      return result;
    } catch (error) {
      endOperation(operationName);
      throw error;
    }
  }, [startOperation, endOperation]);

  const clearOperations = useCallback(() => {
    setOperations(new Map());
  }, []);

  return {
    startOperation,
    endOperation,
    measureOperation,
    clearOperations,
    activeOperations: Array.from(operations.keys()),
  };
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  const updateMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    }
  }, []);

  // Update memory info every 5 seconds
  useEffect(() => {
    const interval = setInterval(updateMemoryInfo, 5000);
    updateMemoryInfo(); // Initial call
    
    return () => clearInterval(interval);
  }, [updateMemoryInfo]);

  const getMemoryPressure = useCallback(() => {
    if (!memoryInfo.usedJSHeapSize || !memoryInfo.jsHeapSizeLimit) return 'unknown';
    
    const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
    
    if (usage > 0.9) return 'high';
    if (usage > 0.7) return 'medium';
    return 'low';
  }, [memoryInfo]);

  return {
    memoryInfo,
    updateMemoryInfo,
    getMemoryPressure,
    isMemoryApiAvailable: 'memory' in performance,
  };
}

export default usePerformance;