/**
 * Lazy Loading Utilities
 * 
 * Utilities for implementing lazy loading, code splitting, and performance optimization
 */

import { ComponentType, lazy, LazyExoticComponent, Suspense } from 'react';
import React from 'react';

// Lazy loading options
export interface LazyLoadOptions {
  fallback?: React.ComponentType;
  delay?: number;
  retries?: number;
  chunkName?: string;
}

// Default loading component
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

/**
 * Enhanced lazy loading with retry functionality
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    retries = 3,
    delay = 1000
  } = options;

  return lazy(() => 
    retryImport(componentImport, retries, delay)
  );
}

/**
 * Retry import with exponential backoff
 */
async function retryImport<T>(
  componentImport: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await componentImport();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with longer delay
    return retryImport(componentImport, retries - 1, delay * 2);
  }
}

/**
 * Create a lazy component with suspense wrapper
 */
export function createLazyComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.FC<React.ComponentProps<T>> {
  const {
    fallback: Fallback = DefaultFallback,
    delay = 0
  } = options;

  const LazyComponent = lazyWithRetry(componentImport, options);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<Fallback />}>
      {delay > 0 ? (
        <DelayedComponent delay={delay}>
          <LazyComponent {...props} />
        </DelayedComponent>
      ) : (
        <LazyComponent {...props} />
      )}
    </Suspense>
  );
}

/**
 * Component that delays rendering for a specified time
 */
const DelayedComponent: React.FC<{ 
  delay: number; 
  children: React.ReactNode; 
}> = ({ delay, children }) => {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender ? <>{children}</> : null;
};

/**
 * Hook for lazy loading data with intersection observer
 */
export function useLazyLoad<T>(
  loadData: () => Promise<T>,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    enabled = true
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const elementRef = React.useRef<HTMLElement>(null);
  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled || hasLoadedRef.current || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setLoading(true);
          setError(null);

          loadData()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loadData, threshold, rootMargin, enabled]);

  return {
    ref: elementRef,
    data,
    loading,
    error,
    hasLoaded: hasLoadedRef.current
  };
}

/**
 * Lazy load images with intersection observer
 */
export function useLazyImage(src: string, options: {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
} = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'
  } = options;

  const [currentSrc, setCurrentSrc] = React.useState(placeholder);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<boolean>(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasLoadedRef.current || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoadedRef.current) {
          hasLoadedRef.current = true;

          const img = new Image();
          img.onload = () => {
            setCurrentSrc(src);
            setLoading(false);
          };
          img.onerror = () => {
            setError(true);
            setLoading(false);
          };
          img.src = src;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, rootMargin]);

  return {
    ref: imgRef,
    src: currentSrc,
    loading,
    error
  };
}

/**
 * Preload components for better performance
 */
export function preloadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): void {
  // Start loading the component but don't wait for it
  componentImport().catch(() => {
    // Ignore errors in preloading
  });
}

/**
 * Bundle splitting utilities
 */
export const bundleUtils = {
  /**
   * Preload a route component
   */
  preloadRoute: (routeImport: () => Promise<any>) => {
    // Only preload in production and when browser is not busy
    if (process.env.NODE_ENV === 'production' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        routeImport().catch(() => {});
      });
    }
  },

  /**
   * Load component with webpack magic comments for better chunking
   */
  loadComponent: (importPath: string) => 
    import(
      /* webpackChunkName: "[request]" */
      /* webpackPreload: true */
      importPath
    ),

  /**
   * Check if a chunk is already loaded
   */
  isChunkLoaded: (_chunkName: string): boolean => {
    // This would need to be implemented based on your bundler
    // For webpack, you could check __webpack_require__.cache
    return false;
  }
};

/**
 * Virtual scrolling utility for large lists
 */
export function useVirtualScrolling<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = React.useMemo(() => 
    items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  , [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}

export default {
  lazyWithRetry,
  createLazyComponent,
  useLazyLoad,
  useLazyImage,
  preloadComponent,
  bundleUtils,
  useVirtualScrolling
};