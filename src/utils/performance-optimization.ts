/**
 * Performance Optimization Utilities
 * 
 * Utilities to improve Core Web Vitals and overall performance
 */

import { lazy } from 'react';

/**
 * Lazy load heavy components
 */
export const lazyWithPreload = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  preloadDelay: number = 2000
) => {
  const Component = lazy(importFn);
  
  // Preload after initial render
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      importFn();
    }, preloadDelay);
  }
  
  return Component;
};

/**
 * Defer non-critical work to improve FID
 */
export const deferredQueue: (() => void)[] = [];
let isProcessing = false;

export const scheduleIdleWork = (callback: () => void) => {
  deferredQueue.push(callback);
  
  if (!isProcessing && 'requestIdleCallback' in window) {
    isProcessing = true;
    requestIdleCallback(() => {
      while (deferredQueue.length > 0) {
        const work = deferredQueue.shift();
        work?.();
      }
      isProcessing = false;
    });
  } else if (!isProcessing) {
    // Fallback for browsers without requestIdleCallback
    isProcessing = true;
    setTimeout(() => {
      while (deferredQueue.length > 0) {
        const work = deferredQueue.shift();
        work?.();
      }
      isProcessing = false;
    }, 0);
  }
};

/**
 * Optimize heavy operations with Web Workers
 */
export const createWorkerPool = (workerScript: string, poolSize: number = 4) => {
  const workers: Worker[] = [];
  let currentWorkerIndex = 0;

  // Create worker pool
  for (let i = 0; i < poolSize; i++) {
    const worker = new Worker(workerScript);
    workers.push(worker);
  }

  const executeTask = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const worker = workers[currentWorkerIndex];
      currentWorkerIndex = (currentWorkerIndex + 1) % poolSize;

      worker.onmessage = (e) => resolve(e.data);
      worker.onerror = reject;
      worker.postMessage(data);
    });
  };

  const terminate = () => {
    workers.forEach(worker => worker.terminate());
  };

  return { executeTask, terminate };
};

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoader = (
  onIntersect: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onIntersect(entry);
        observer.unobserve(entry.target);
      }
    });
  }, options);

  return observer;
};

/**
 * Optimize image loading
 */
export const optimizeImageLoading = (imageSrc: string, placeholder?: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    if (placeholder) {
      resolve(placeholder);
    }
    
    img.onload = () => resolve(imageSrc);
    img.onerror = () => resolve(placeholder || imageSrc);
    img.src = imageSrc;
  });
};

/**
 * Debounce heavy operations
 */
export const debounceRaf = (fn: (...args: any[]) => void) => {
  let rafId: number | null = null;
  
  return (...args: any[]) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  };
};

/**
 * Batch DOM updates
 */
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

/**
 * Preconnect to external domains
 */
export const preconnectToDomains = (domains: string[]) => {
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

/**
 * Resource hints for critical resources
 */
export const addResourceHints = () => {
  // Font preloading is handled in index.html

  // DNS prefetch for API domain
  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = '//api.flextasker.com';
  document.head.appendChild(dnsPrefetch);
};

/**
 * Service Worker for caching strategies
 */
export const registerCachingServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Caching service worker registered:', registration);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
};