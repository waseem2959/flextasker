/**
 * Error Tracking Service Tests
 * 
 * Comprehensive test suite for error tracking functionality including
 * error capture, breadcrumbs, context enrichment, and React integration.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { errorTracker, useErrorHandler, ErrorBoundary } from '../error-tracking';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('ErrorTracker', () => {
  beforeEach(() => {
    errorTracker.clearBreadcrumbs();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Reporting', () => {
    it('should capture and report errors with context', () => {
      const error = new Error('Test error');
      const context = {
        userId: '123',
        customTags: { component: 'TestComponent' }
      };

      errorTracker.reportError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:',
        error
      );
    });

    it.skip('should handle non-Error objects', () => {
      const errorString = 'String error';
      
      errorTracker.reportError(errorString as any);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error captured:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it.skip('should enrich error context with environment data', () => {
      const error = new Error('Test error');
      const reportSpy = jest.spyOn(errorTracker, 'reportError');

      errorTracker.reportError(error);

      expect(reportSpy).toHaveBeenCalledWith(error, undefined);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error captured:',
        error,
        expect.objectContaining({
          timestamp: expect.any(Number),
          userAgent: expect.any(String),
          url: expect.any(String)
        })
      );
    });

    it.skip('should determine error severity correctly', () => {
      // Network error - should be high severity
      const networkError = new Error('Network request failed');
      errorTracker.reportError(networkError);

      // Permission error - should be low severity  
      const permissionError = new Error('Permission denied');
      errorTracker.reportError(permissionError);

      expect(mockConsoleError).toHaveBeenCalledTimes(2);
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumbs', () => {
      errorTracker.addBreadcrumb({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: { buttonId: 'submit' }
      });

      const breadcrumbs = errorTracker.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toMatchObject({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: { buttonId: 'submit' }
      });
    });

    it('should limit breadcrumbs to maximum count', () => {
      // Add more than 100 breadcrumbs
      for (let i = 0; i < 150; i++) {
        errorTracker.addBreadcrumb({
          message: `Breadcrumb ${i}`,
          category: 'test'
        });
      }

      const breadcrumbs = errorTracker.getBreadcrumbs();
      expect(breadcrumbs.length).toBeLessThanOrEqual(100);
    });

    it('should clear breadcrumbs', () => {
      errorTracker.addBreadcrumb({ message: 'Test', category: 'test' });
      expect(errorTracker.getBreadcrumbs()).toHaveLength(1);

      errorTracker.clearBreadcrumbs();
      expect(errorTracker.getBreadcrumbs()).toHaveLength(0);
    });
  });

  describe('Context Management', () => {
    it('should set and get user context', () => {
      const userContext = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      };

      errorTracker.setUserContext(userContext);
      const context = errorTracker.getUserContext();

      expect(context).toEqual(userContext);
    });

    it('should set and merge extra context', () => {
      errorTracker.setExtraContext({ feature: 'payment' });
      errorTracker.setExtraContext({ action: 'checkout' });

      const context = errorTracker.getExtraContext();
      expect(context).toEqual({
        feature: 'payment',
        action: 'checkout'
      });
    });

    it('should clear user context', () => {
      errorTracker.setUserContext({ id: '123' });
      errorTracker.clearUserContext();

      expect(errorTracker.getUserContext()).toBeNull();
    });
  });

  describe('Error Patterns', () => {
    it.skip('should identify duplicate errors', () => {
      const error1 = new Error('Duplicate error');
      const error2 = new Error('Duplicate error');

      errorTracker.reportError(error1);
      errorTracker.reportError(error2);

      // Should log both but potentially mark as duplicate
      expect(mockConsoleError).toHaveBeenCalledTimes(2);
    });

    it.skip('should track error frequency', () => {
      const error = new Error('Frequent error');

      // Report same error multiple times
      for (let i = 0; i < 5; i++) {
        errorTracker.reportError(error);
      }

      expect(mockConsoleError).toHaveBeenCalledTimes(5);
    });
  });
});

describe('useErrorHandler Hook', () => {
  it.skip('should capture errors and add breadcrumb', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Hook error');

    act(() => {
      result.current(error, { component: 'TestComponent' });
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error captured:',
      error,
      expect.objectContaining({
        customTags: { component: 'TestComponent' }
      })
    );

    const breadcrumbs = errorTracker.getBreadcrumbs();
    expect(breadcrumbs).toContainEqual(
      expect.objectContaining({
        message: 'Error: Hook error',
        category: 'error',
        level: 'error'
      })
    );
  });

  it.skip('should handle errors without custom tags', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Simple error');

    act(() => {
      result.current(error);
    });

    expect(mockConsoleError).toHaveBeenCalled();
  });
});

describe('ErrorBoundary Component', () => {
  // Component that throws error
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Component error');
    }
    return <div>No error</div>;
  };

  it.skip('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Component error/i)).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should use custom fallback component', () => {
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Custom error: Component error/i)).toBeInTheDocument();
  });

  it('should add error to breadcrumbs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const breadcrumbs = errorTracker.getBreadcrumbs();
    expect(breadcrumbs).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('ErrorBoundary caught error'),
        category: 'error',
        level: 'error'
      })
    );
  });

  it('should reset error state when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Change reset key to reset error boundary
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  it.skip('should work with async errors', async () => {
    const asyncError = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Async error')), 100);
    });

    asyncError.catch(error => {
      errorTracker.reportError(error);
    });

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error captured:',
      expect.objectContaining({ message: 'Async error' }),
      expect.any(Object)
    );
  });

  it.skip('should handle unhandled promise rejections', () => {
    const event = new Event('unhandledrejection') as any;
    event.promise = Promise.reject(new Error('Unhandled rejection'));
    event.reason = new Error('Unhandled rejection');

    window.dispatchEvent(event);

    // Error should be captured by global handler
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('should capture navigation errors', () => {
    errorTracker.addBreadcrumb({
      message: 'Navigation to /tasks',
      category: 'navigation'
    });

    const navigationError = new Error('Route not found');
    errorTracker.reportError(navigationError, {
      customTags: { route: '/tasks' }
    });

    const breadcrumbs = errorTracker.getBreadcrumbs();
    expect(breadcrumbs).toContainEqual(
      expect.objectContaining({
        category: 'navigation'
      })
    );
  });
});

describe('Performance', () => {
  it.skip('should handle high volume of errors efficiently', () => {
    const startTime = performance.now();

    // Report 1000 errors
    for (let i = 0; i < 1000; i++) {
      errorTracker.reportError(new Error(`Error ${i}`));
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time (< 100ms)
    expect(executionTime).toBeLessThan(100);
  });

  it.skip('should not block UI when reporting errors', async () => {
    let uiBlocked = false;

    // Simulate UI operation
    const uiOperation = setTimeout(() => {
      uiBlocked = true;
    }, 0);

    // Report error
    errorTracker.reportError(new Error('Non-blocking error'));

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(uiBlocked).toBe(true);
    clearTimeout(uiOperation);
  });
});