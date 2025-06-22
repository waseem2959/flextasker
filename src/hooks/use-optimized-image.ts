/**
 * Optimized Image Hook
 * 
 * Combines lazy loading, format optimization, and responsive images
 * into a single, easy-to-use hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from './use-intersection-observer';
import { imageOptimizationService, type OptimizedImageUrls } from '@/services/images/image-optimization';

interface UseOptimizedImageOptions {
  src: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  quality?: number;
  lazy?: boolean;
  priority?: boolean;
  rootMargin?: string;
  threshold?: number;
  placeholder?: string | boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseOptimizedImageReturn {
  optimizedUrls: OptimizedImageUrls | null;
  imageProps: {
    src: string;
    srcSet: string;
    sizes: string;
    loading: 'lazy' | 'eager';
    decoding: 'async' | 'sync';
    onLoad: () => void;
    onError: () => void;
  };
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  loadImage: () => void;
  retry: () => void;
  placeholder: string | null;
  ref: (node: Element | null) => void;
}

export const useOptimizedImage = (options: UseOptimizedImageOptions): UseOptimizedImageReturn => {
  const {
    src,
    width,
    height,
    aspectRatio,
    quality,
    lazy = true,
    priority = false,
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = true,
    onLoad,
    onError,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [optimizedUrls, setOptimizedUrls] = useState<OptimizedImageUrls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Intersection observer for lazy loading
  const [ref, entry] = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: true
  });

  const isVisible = entry?.isIntersecting ?? false;

  // Generate optimized URLs when src changes
  useEffect(() => {
    if (!src) return;

    try {
      const urls = imageOptimizationService.generateOptimizedUrls(src, {
        width,
        height,
        aspectRatio,
        quality
      });
      setOptimizedUrls(urls);
    } catch (error) {
      console.error('Failed to generate optimized URLs:', error);
      onError?.(error as Error);
    }
  }, [src, width, height, aspectRatio, quality, onError]);

  // Determine when to start loading
  useEffect(() => {
    if (priority || !lazy) {
      setShouldLoad(true);
    } else if (isVisible) {
      setShouldLoad(true);
    }
  }, [priority, lazy, isVisible]);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      imageOptimizationService.preloadImage(src, {
        priority: true,
        width,
        format: 'webp'
      });
    }
  }, [priority, src, width]);

  // Load image when conditions are met
  const loadImage = useCallback(() => {
    if (!optimizedUrls || !shouldLoad || isLoaded) return;

    setIsLoading(true);
    setHasError(false);

    // Use the best available format
    const formats = Object.keys(optimizedUrls.formats);
    const bestFormat = formats[0] || 'jpeg';
    const imageSrc = optimizedUrls.formats[bestFormat]?.src || optimizedUrls.src;

    const img = new Image();
    imageRef.current = img;

    img.onload = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
      setRetryCount(0);
      onLoad?.();
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      
      const error = new Error(`Failed to load image: ${imageSrc}`);
      onError?.(error);

      // Retry logic
      if (retryCount < retryAttempts) {
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadImage();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    };

    img.src = imageSrc;
  }, [optimizedUrls, shouldLoad, isLoaded, retryCount, retryAttempts, retryDelay, onLoad, onError]);

  // Start loading when ready
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, []);

  // Manual retry function
  const retry = useCallback(() => {
    setRetryCount(0);
    setHasError(false);
    loadImage();
  }, [loadImage]);

  // Generate sizes attribute based on container width
  const generateSizes = useCallback((): string => {
    if (width) {
      return `${width}px`;
    }
    
    // Default responsive sizes
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }, [width]);

  // Prepare image props
  const imageProps = {
    src: optimizedUrls?.src || src,
    srcSet: optimizedUrls?.srcSet || '',
    sizes: generateSizes(),
    loading: (priority ? 'eager' : 'lazy') as 'lazy' | 'eager',
    decoding: 'async' as 'async' | 'sync',
    onLoad: () => {
      setIsLoading(false);
      setIsLoaded(true);
      onLoad?.();
    },
    onError: () => {
      setIsLoading(false);
      setHasError(true);
      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
    }
  };

  // Get placeholder
  const getPlaceholder = (): string | null => {
    if (!placeholder) return null;
    
    if (typeof placeholder === 'string') {
      return placeholder;
    }
    
    return optimizedUrls?.placeholder || null;
  };

  return {
    optimizedUrls,
    imageProps,
    isLoading,
    isLoaded,
    hasError,
    loadImage,
    retry,
    placeholder: getPlaceholder(),
    ref
  };
};

/**
 * Simplified hook for common use cases
 */
export const useResponsiveImage = (
  src: string,
  aspectRatio?: number,
  priority?: boolean
) => {
  return useOptimizedImage({
    src,
    aspectRatio,
    priority,
    lazy: !priority
  });
};

/**
 * Hook for avatar images
 */
export const useAvatarImage = (src: string, size: number = 80) => {
  return useOptimizedImage({
    src,
    width: size,
    height: size,
    aspectRatio: 1,
    quality: 90,
    priority: false
  });
};

/**
 * Hook for hero/banner images
 */
export const useHeroImage = (src: string, width?: number, height?: number) => {
  return useOptimizedImage({
    src,
    width,
    height,
    priority: true,
    quality: 85
  });
};