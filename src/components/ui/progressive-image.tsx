import { cn } from '@/lib/utils';
import React, { useState, useRef, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
}

/**
 * Progressive Image Component with optimized loading
 * 
 * Features:
 * - Lazy loading with intersection observer
 * - Progressive enhancement with blur-to-sharp transition
 * - Automatic fallback handling
 * - Performance optimized with proper sizing
 * - Accessibility compliant
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/images/placeholder-task.jpg',
  placeholder,
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || fallbackSrc);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  // Load the actual image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setCurrentSrc(fallbackSrc);
      setIsError(true);
      onError?.();
    };
    img.src = src;
  }, [isInView, src, fallbackSrc, onLoad, onError]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          {
            "blur-sm scale-105": !isLoaded && !isError,
            "blur-0 scale-100": isLoaded || isError,
          }
        )}
        sizes={sizes}
        loading={loading}
        decoding="async"
        onLoad={() => {
          if (currentSrc === src) {
            setIsLoaded(true);
            onLoad?.();
          }
        }}
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setIsError(true);
            onError?.();
          }
        }}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="text-center text-neutral-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-body">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Optimized Task Image Component
 * Pre-configured for task card usage with proper aspect ratios and fallbacks
 */
interface TaskImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
}

export const TaskImage: React.FC<TaskImageProps> = ({
  src,
  alt,
  className,
  category = 'general'
}) => {
  // Category-specific fallback images
  const getCategoryFallback = (cat: string): string => {
    const fallbacks: Record<string, string> = {
      'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60',
      'moving': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=60',
      'handyman': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=60',
      'delivery': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop&q=60',
      'general': 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=400&auto=format&fit=crop&q=60'
    };
    
    const normalizedCategory = cat.toLowerCase();
    return fallbacks[normalizedCategory] || fallbacks.general;
  };

  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      className={cn("aspect-[4/3] rounded-t-xl", className)}
      fallbackSrc={getCategoryFallback(category)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loading="lazy"
    />
  );
};

/**
 * Hero Image Component
 * Optimized for above-the-fold hero sections with priority loading
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  className
}) => {
  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      className={cn("aspect-square rounded-3xl", className)}
      fallbackSrc="/images/hero-placeholder.jpg"
      sizes="(max-width: 768px) 100vw, 50vw"
      loading="eager"
      priority={true}
    />
  );
};
