/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  lazyWithRetry,
  createLazyComponent,
  useLazyLoad,
  useLazyImage,
  preloadComponent,
  bundleUtils,
  useVirtualScrolling
} from '../lazy-loading';

// Mock component for testing
const TestComponent = () => <div>Test Component</div>;

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
global.IntersectionObserver = mockIntersectionObserver;

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback) => {
  setTimeout(callback, 0);
  return 0;
});

describe('lazyWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a lazy component that loads successfully', async () => {
    const mockImport = jest.fn().mockResolvedValue({ default: TestComponent });
    const LazyComponent = lazyWithRetry(mockImport);

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    expect(mockImport).toHaveBeenCalledTimes(1);
  });

  it('should retry failed imports with exponential backoff', async () => {
    const mockImport = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ default: TestComponent });

    const LazyComponent = lazyWithRetry(mockImport, { retries: 2, delay: 10 });

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    expect(mockImport).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should fail after exhausting all retries', async () => {
    const mockImport = jest.fn().mockRejectedValue(new Error('Persistent error'));
    const LazyComponent = lazyWithRetry(mockImport, { retries: 1, delay: 10 });

    // Capture console.error to avoid noise in test output
    const originalError = console.error;
    console.error = jest.fn();

    const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      try {
        return <>{children}</>;
      } catch (error) {
        return <div>Error loading component</div>;
      }
    };

    render(
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      </ErrorBoundary>
    );

    // Component should fail to load after retries
    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    console.error = originalError;
  });
});

describe('createLazyComponent', () => {
  it('should create a component with suspense wrapper', async () => {
    const mockImport = jest.fn().mockResolvedValue({ default: TestComponent });
    const LazyComponent = createLazyComponent(mockImport);

    render(<LazyComponent />);

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  it('should use custom fallback component', async () => {
    const mockImport = jest.fn().mockResolvedValue({ default: TestComponent });
    const CustomFallback = () => <div>Custom Loading...</div>;
    
    const LazyComponent = createLazyComponent(mockImport, {
      fallback: CustomFallback
    });

    render(<LazyComponent />);

    // Should briefly show custom fallback
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });
});

describe('useLazyLoad', () => {
  let mockElement: HTMLElement;
  let mockObserver: any;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockObserver = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIntersectionObserver.mockReturnValue(mockObserver);
  });

  it('should load data when element intersects', async () => {
    const mockLoadData = jest.fn().mockResolvedValue('loaded data');
    
    const { result } = renderHook(() => useLazyLoad(mockLoadData));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);

    // Simulate element intersection
    act(() => {
      Object.defineProperty(result.current, 'ref', {
        value: { current: mockElement }
      });
    });

    // Trigger intersection
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('loaded data');
    });

    expect(mockLoadData).toHaveBeenCalledTimes(1);
  });

  it('should handle loading errors', async () => {
    const error = new Error('Load failed');
    const mockLoadData = jest.fn().mockRejectedValue(error);
    
    const { result } = renderHook(() => useLazyLoad(mockLoadData));

    // Simulate intersection
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });
  });

  it('should not load when disabled', () => {
    const mockLoadData = jest.fn();
    
    renderHook(() => useLazyLoad(mockLoadData, { enabled: false }));

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
    expect(mockLoadData).not.toHaveBeenCalled();
  });
});

describe('useLazyImage', () => {
  beforeEach(() => {
    // Mock Image constructor
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as any;
  });

  it('should load image when element intersects', async () => {
    const { result } = renderHook(() => 
      useLazyImage('https://example.com/image.jpg')
    );

    expect(result.current.loading).toBe(true);

    // Simulate intersection
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.src).toBe('https://example.com/image.jpg');
    });
  });

  it('should handle image loading errors', async () => {
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';

      constructor() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    } as any;

    const { result } = renderHook(() => 
      useLazyImage('https://example.com/broken-image.jpg')
    );

    // Simulate intersection
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('preloadComponent', () => {
  it('should preload component without waiting', () => {
    const mockImport = jest.fn().mockResolvedValue({ default: TestComponent });
    
    preloadComponent(mockImport);
    
    expect(mockImport).toHaveBeenCalledTimes(1);
  });

  it('should handle preload errors silently', () => {
    const mockImport = jest.fn().mockRejectedValue(new Error('Preload failed'));
    
    expect(() => preloadComponent(mockImport)).not.toThrow();
    expect(mockImport).toHaveBeenCalledTimes(1);
  });
});

describe('bundleUtils', () => {
  it('should preload routes in production with requestIdleCallback', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockImport = jest.fn().mockResolvedValue({ default: TestComponent });
    
    bundleUtils.preloadRoute(mockImport);
    
    expect(global.requestIdleCallback).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not preload routes in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const mockImport = jest.fn();
    
    bundleUtils.preloadRoute(mockImport);
    
    expect(mockImport).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('useVirtualScrolling', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it('should calculate visible items correctly', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 2
      })
    );

    expect(result.current.totalHeight).toBe(50000); // 1000 items * 50px
    expect(result.current.visibleItems.length).toBeLessThanOrEqual(12); // 8 visible + 4 overscan
    expect(result.current.offsetY).toBe(0);
  });

  it('should update visible items when scrolling', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 2
      })
    );

    // Simulate scroll to item 10
    const scrollTop = 500; // 10 items * 50px
    const mockEvent = {
      currentTarget: { scrollTop }
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.offsetY).toBe(400); // Should start around item 8 (10 - 2 overscan)
  });

  it('should handle edge cases with small item counts', () => {
    const smallItems = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
    
    const { result } = renderHook(() =>
      useVirtualScrolling(smallItems, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 2
      })
    );

    expect(result.current.visibleItems).toHaveLength(2);
    expect(result.current.totalHeight).toBe(100);
  });

  it('should respect overscan parameter', () => {
    const { result } = renderHook(() =>
      useVirtualScrolling(mockItems, {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 10 // Large overscan
      })
    );

    // Should render more items due to larger overscan
    expect(result.current.visibleItems.length).toBeGreaterThan(8);
  });
});