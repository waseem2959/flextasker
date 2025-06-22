/**
 * App Initialization and Performance Optimization
 * 
 * Critical path optimization for better FCP and FID
 */

import { scheduleIdleWork, addResourceHints, preconnectToDomains } from './performance-optimization';
import { isDev } from './env';

/**
 * Initialize critical app features first
 */
export const initializeCriticalFeatures = () => {
  // Add resource hints for faster loading
  addResourceHints();
  
  // Preconnect to known external domains
  preconnectToDomains([
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ]);
};

/**
 * Defer non-critical initialization
 */
export const initializeNonCriticalFeatures = () => {
  // Defer analytics initialization
  scheduleIdleWork(() => {
    // Initialize analytics here
    console.log('Analytics initialized');
  });

  // Defer service worker registration
  scheduleIdleWork(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        // Silent fail - service worker is enhancement only
      });
    }
  });

  // Defer performance monitoring setup
  scheduleIdleWork(() => {
    // Only import performance monitor in development
    if (isDev()) {
      import('../services/monitoring/performance-monitor').then(({ performanceMonitor }) => {
        performanceMonitor.trackBundleMetrics();
      });
    }
  });

  // Prefetch lazy-loaded routes after idle
  scheduleIdleWork(() => {
    // Prefetch common routes
    import('../pages/Dashboard');
    import('../pages/Tasks');
  });
};

/**
 * Optimize initial render
 */
export const optimizeInitialRender = () => {
  // Remove render-blocking resources
  const renderBlockingStyles = document.querySelectorAll('link[rel="stylesheet"]:not([media="print"])');
  renderBlockingStyles.forEach(link => {
    link.setAttribute('media', 'print');
    link.setAttribute('onload', "this.media='all'");
  });

  // Load critical CSS inline (handled by Vite in production)
  
  // Defer font loading
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }
};

/**
 * Progressive enhancement setup
 */
export const setupProgressiveEnhancement = () => {
  // Check for modern browser features
  const supportsIdleCallback = 'requestIdleCallback' in window;
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  const supportsWebP = checkWebPSupport();

  // Store capabilities
  window.__APP_CAPABILITIES__ = {
    supportsIdleCallback,
    supportsIntersectionObserver,
    supportsWebP,
  };
};

/**
 * Check WebP support
 */
function checkWebPSupport(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

/**
 * Main initialization function
 */
export const initializeApp = () => {
  // Critical path - must complete before render
  initializeCriticalFeatures();
  optimizeInitialRender();
  setupProgressiveEnhancement();

  // Non-critical path - defer after initial render
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeNonCriticalFeatures();
    });
  } else {
    setTimeout(() => {
      initializeNonCriticalFeatures();
    }, 1);
  }
};

// Add global type declaration
declare global {
  interface Window {
    __APP_CAPABILITIES__: {
      supportsIdleCallback: boolean;
      supportsIntersectionObserver: boolean;
      supportsWebP: boolean;
    };
  }
}