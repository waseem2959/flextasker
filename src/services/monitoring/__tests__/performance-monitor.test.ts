/**
 * Performance Monitor Test Suite
 * 
 * Comprehensive tests for the performance monitoring service.
 */

import { performanceMonitor } from '../performance-monitor';

// Mock performance API
const mockPerformanceObserver = jest.fn();
const mockPerformanceNow = jest.fn();

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  value: mockPerformanceObserver,
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: mockPerformanceNow,
  },
});

// Mock fetch
global.fetch = jest.fn();

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.clear();
  });

  // === METRIC RECORDING ===
  describe('Metric Recording', () => {
    it('should record custom metrics', () => {
      const metric = {
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      };

      performanceMonitor.recordMetric(metric);
      const summary = performanceMonitor.getMetricsSummary();

      expect(summary.totalMetrics).toBe(1);
    });

    it('should track API calls', () => {
      const startTime = 1000;
      const endTime = 1200;

      performanceMonitor.trackAPICall(
        '/api/test',
        'GET',
        startTime,
        endTime,
        200
      );

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.averageAPIResponseTime).toBe(200);
    });

    it('should track component render times', () => {
      performanceMonitor.trackComponentRender('TestComponent', 50);

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.averageComponentRenderTime).toBe(50);
    });
  });

  // === TIMER FUNCTIONALITY ===
  describe('Timer Functionality', () => {
    it('should create and use timers', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1150); // End time

      const stopTimer = performanceMonitor.startTimer('test-operation');
      stopTimer();

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.totalMetrics).toBe(1);
    });

    it('should handle multiple concurrent timers', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Timer 1 start
        .mockReturnValueOnce(1100) // Timer 2 start
        .mockReturnValueOnce(1200) // Timer 1 end
        .mockReturnValueOnce(1300); // Timer 2 end

      const stopTimer1 = performanceMonitor.startTimer('operation-1');
      const stopTimer2 = performanceMonitor.startTimer('operation-2');
      
      stopTimer1();
      stopTimer2();

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.totalMetrics).toBe(2);
    });
  });

  // === ANALYTICS ===
  describe('Analytics', () => {
    it('should calculate average API response time', () => {
      performanceMonitor.trackAPICall('/api/test1', 'GET', 1000, 1100, 200);
      performanceMonitor.trackAPICall('/api/test2', 'GET', 1000, 1300, 200);

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.averageAPIResponseTime).toBe(200); // (100 + 300) / 2
    });

    it('should identify slowest API call', () => {
      performanceMonitor.trackAPICall('/api/fast', 'GET', 1000, 1050, 200);
      performanceMonitor.trackAPICall('/api/slow', 'GET', 1000, 1500, 200);

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.slowestAPI?.endpoint).toBe('/api/slow');
      expect(summary.slowestAPI?.responseTime).toBe(500);
    });

    it('should identify slowest component', () => {
      performanceMonitor.trackComponentRender('FastComponent', 10);
      performanceMonitor.trackComponentRender('SlowComponent', 100);

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.slowestComponent?.componentName).toBe('SlowComponent');
      expect(summary.slowestComponent?.renderTime).toBe(100);
    });
  });

  // === RECENT METRICS ===
  describe('Recent Metrics', () => {
    it('should filter metrics by time range', () => {
      const now = Date.now();
      const oldTimestamp = now - (10 * 60 * 1000); // 10 minutes ago
      const recentTimestamp = now - (2 * 60 * 1000); // 2 minutes ago

      // Mock Date.now for consistent timestamps
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(oldTimestamp)
        .mockReturnValueOnce(recentTimestamp);

      performanceMonitor.recordMetric({
        name: 'old-metric',
        value: 100,
        timestamp: oldTimestamp,
      });

      performanceMonitor.recordMetric({
        name: 'recent-metric',
        value: 200,
        timestamp: recentTimestamp,
      });

      Date.now = originalDateNow;

      const recentMetrics = performanceMonitor.getRecentMetrics(5);
      expect(recentMetrics.metrics).toHaveLength(1);
      expect(recentMetrics.metrics[0].name).toBe('recent-metric');
    });
  });

  // === METRIC LIMITS ===
  describe('Metric Limits', () => {
    it('should limit the number of stored metrics', () => {
      // Record more than the limit (1000)
      for (let i = 0; i < 1200; i++) {
        performanceMonitor.recordMetric({
          name: `metric-${i}`,
          value: i,
          timestamp: Date.now(),
        });
      }

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.totalMetrics).toBeLessThanOrEqual(1000);
    });
  });

  // === SERVER REPORTING ===
  describe('Server Reporting', () => {
    it('should send metrics to server', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });

      await performanceMonitor.sendMetricsToServer();

      expect(mockFetch).toHaveBeenCalledWith('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('summary'),
      });
    });

    it('should handle server reporting errors gracefully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });

      await performanceMonitor.sendMetricsToServer();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send metrics to server:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  // === ENABLE/DISABLE ===
  describe('Enable/Disable', () => {
    it('should not record metrics when disabled', () => {
      performanceMonitor.disable();

      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.totalMetrics).toBe(0);

      performanceMonitor.enable();
    });

    it('should resume recording when re-enabled', () => {
      performanceMonitor.disable();
      performanceMonitor.enable();

      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
      });

      const summary = performanceMonitor.getMetricsSummary();
      expect(summary.totalMetrics).toBe(1);
    });
  });

  // === ERROR HANDLING ===
  describe('Error Handling', () => {
    it('should handle API tracking errors gracefully', () => {
      expect(() => {
        performanceMonitor.trackAPICall('/api/test', 'GET', 1000, 900, 200); // End before start
      }).not.toThrow();
    });

    it('should handle component tracking errors gracefully', () => {
      expect(() => {
        performanceMonitor.trackComponentRender('TestComponent', -10); // Negative time
      }).not.toThrow();
    });
  });
});
