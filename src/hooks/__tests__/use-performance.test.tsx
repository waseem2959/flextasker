/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { usePerformance, useMemoryMonitor, useAsyncPerformance } from '../use-performance';

// Mock performance API
const mockPerformanceNow = jest.fn();
global.performance = {
  ...global.performance,
  now: mockPerformanceNow,
  memory: {
    usedJSHeapSize: 50000000, // 50MB
    totalJSHeapSize: 100000000, // 100MB
    jsHeapSizeLimit: 2000000000, // 2GB
  },
} as any;

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe.skip('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(16.7) // End time (good render)
      .mockReturnValueOnce(16.7) // Next start
      .mockReturnValueOnce(33.4); // Next end
  });

  it('should track render performance metrics', () => {
    const { result } = renderHook(() => 
      usePerformance({
        componentName: 'TestComponent',
        enabled: true,
        logToConsole: false
      })
    );

    expect(result.current.metrics.renderCount).toBe(1);
    expect(result.current.metrics.lastRenderTime).toBe(16.7);
    expect(result.current.metrics.averageRenderTime).toBe(16.7);
    expect(result.current.metrics.totalRenderTime).toBe(16.7);
    expect(result.current.metrics.isSlowRender).toBe(false);
  });

  it('should detect slow renders', () => {
    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(60); // Slow render (60ms)

    const { result } = renderHook(() => 
      usePerformance({
        componentName: 'SlowComponent',
        enabled: true,
        slowRenderThreshold: 50
      })
    );

    expect(result.current.metrics.isSlowRender).toBe(true);
    expect(result.current.metrics.lastRenderTime).toBe(60);
  });

  it('should calculate average render time correctly', () => {
    const { result, rerender } = renderHook(() => 
      usePerformance({
        componentName: 'TestComponent',
        enabled: true
      })
    );

    // First render: 16.7ms
    expect(result.current.metrics.averageRenderTime).toBe(16.7);

    // Second render: 33.4ms total, average should be 16.7ms
    rerender();
    expect(result.current.metrics.renderCount).toBe(2);
    expect(result.current.metrics.averageRenderTime).toBe(16.7);
  });

  it('should reset metrics when requested', () => {
    const { result } = renderHook(() => 
      usePerformance({
        componentName: 'TestComponent',
        enabled: true
      })
    );

    act(() => {
      result.current.resetMetrics();
    });

    expect(result.current.metrics.renderCount).toBe(0);
    expect(result.current.metrics.lastRenderTime).toBe(0);
    expect(result.current.metrics.averageRenderTime).toBe(0);
    expect(result.current.metrics.totalRenderTime).toBe(0);
  });

  it('should generate performance report with recommendations', () => {
    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(60); // Slow render

    const { result } = renderHook(() => 
      usePerformance({
        componentName: 'SlowComponent',
        enabled: true,
        slowRenderThreshold: 50
      })
    );

    const report = result.current.getPerformanceReport();

    expect(report.componentName).toBe('SlowComponent');
    expect(report.metrics).toEqual(result.current.metrics);
    expect(report.recommendations).toContain('Consider memoizing expensive calculations');
    expect(report.recommendations).toContain('Check for unnecessary re-renders');
  });

  it('should not track when disabled', () => {
    const { result } = renderHook(() => 
      usePerformance({
        componentName: 'TestComponent',
        enabled: false
      })
    );

    expect(result.current.metrics.renderCount).toBe(0);
    expect(result.current.metrics.lastRenderTime).toBe(0);
  });

  it('should log to console when enabled', () => {
    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(60); // Slow render to trigger console.warn

    renderHook(() => 
      usePerformance({
        componentName: 'SlowComponent',
        enabled: true,
        logToConsole: true,
        slowRenderThreshold: 50
      })
    );

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] Slow render detected')
    );
  });
});

describe.skip('useMemoryMonitor', () => {
  it('should return memory information when available', () => {
    const { result } = renderHook(() => useMemoryMonitor());

    expect(result.current.memoryInfo.usedJSHeapSize).toBe(50000000);
    expect(result.current.memoryInfo.totalJSHeapSize).toBe(100000000);
    expect(result.current.memoryInfo.jsHeapSizeLimit).toBe(2000000000);
  });

  it('should calculate memory pressure correctly', () => {
    const { result } = renderHook(() => useMemoryMonitor());

    // 50MB used / 2GB limit = 2.5% = low pressure
    expect(result.current.getMemoryPressure()).toBe('low');
  });

  it('should detect medium memory pressure', () => {
    // Mock higher memory usage
    Object.defineProperty(global.performance, 'memory', {
      value: {
        usedJSHeapSize: 1200000000, // 1.2GB
        totalJSHeapSize: 1400000000, // 1.4GB  
        jsHeapSizeLimit: 2000000000, // 2GB
      },
      configurable: true
    });

    const { result } = renderHook(() => useMemoryMonitor());

    // 1.2GB used / 2GB limit = 60% = medium pressure
    expect(result.current.getMemoryPressure()).toBe('medium');
  });

  it('should detect high memory pressure', () => {
    // Mock very high memory usage
    Object.defineProperty(global.performance, 'memory', {
      value: {
        usedJSHeapSize: 1700000000, // 1.7GB
        totalJSHeapSize: 1800000000, // 1.8GB
        jsHeapSizeLimit: 2000000000, // 2GB
      },
      configurable: true
    });

    const { result } = renderHook(() => useMemoryMonitor());

    // 1.7GB used / 2GB limit = 85% = high pressure
    expect(result.current.getMemoryPressure()).toBe('high');
  });

  it('should handle missing memory API', () => {
    // Mock browser without memory API
    Object.defineProperty(global.performance, 'memory', {
      value: undefined,
      configurable: true
    });

    const { result } = renderHook(() => useMemoryMonitor());

    expect(result.current.memoryInfo.usedJSHeapSize).toBeUndefined();
    expect(result.current.getMemoryPressure()).toBe('unknown');
  });
});

describe('useAsyncPerformance', () => {
  it('should track active operations', () => {
    const { result } = renderHook(() => useAsyncPerformance());

    expect(result.current.activeOperations).toEqual([]);

    act(() => {
      result.current.startOperation('fetchData');
    });

    expect(result.current.activeOperations).toContain('fetchData');

    act(() => {
      result.current.endOperation('fetchData');
    });

    expect(result.current.activeOperations).toEqual([]);
  });

  it('should track multiple operations simultaneously', () => {
    const { result } = renderHook(() => useAsyncPerformance());

    act(() => {
      result.current.startOperation('fetchData');
      result.current.startOperation('uploadFile');
      result.current.startOperation('processData');
    });

    expect(result.current.activeOperations).toHaveLength(3);
    expect(result.current.activeOperations).toEqual(
      expect.arrayContaining(['fetchData', 'uploadFile', 'processData'])
    );

    act(() => {
      result.current.endOperation('fetchData');
    });

    expect(result.current.activeOperations).toHaveLength(2);
    expect(result.current.activeOperations).not.toContain('fetchData');
  });

  it('should handle ending non-existent operations gracefully', () => {
    const { result } = renderHook(() => useAsyncPerformance());

    act(() => {
      result.current.endOperation('nonExistentOperation');
    });

    expect(result.current.activeOperations).toEqual([]);
  });

  it('should not add duplicate operations', () => {
    const { result } = renderHook(() => useAsyncPerformance());

    act(() => {
      result.current.startOperation('fetchData');
      result.current.startOperation('fetchData'); // Duplicate
    });

    expect(result.current.activeOperations).toHaveLength(1);
    expect(result.current.activeOperations).toContain('fetchData');
  });

  it.skip('should clear all operations', () => {
    const { result } = renderHook(() => useAsyncPerformance());

    act(() => {
      result.current.startOperation('fetchData');
      result.current.startOperation('uploadFile');
    });

    expect(result.current.activeOperations).toHaveLength(2);

    act(() => {
      result.current.clearOperations();
    });

    expect(result.current.activeOperations).toEqual([]);
  });
});