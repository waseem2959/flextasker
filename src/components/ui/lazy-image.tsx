/**
 * Lazy Image Component
 * 
 * Optimized image loading with:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Responsive images
 * - Error handling
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;
  alt: string;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '21:9';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fadeInDuration?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const aspectRatioClasses = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '21:9': 'aspect-[21/9]'
};

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholderSrc,
  alt,
  aspectRatio,
  objectFit = 'cover',
  fadeInDuration = 300,
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  
  const [ref, entry] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true
  });

  const isVisible = entry?.isIntersecting;

  useEffect(() => {
    if (isVisible && src && !isLoaded && !isError) {
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setIsError(true);
        onError?.();
      };
      
      img.src = src;
    }
  }, [isVisible, src, isLoaded, isError, onLoad, onError]);

  const containerClasses = cn(
    'relative overflow-hidden bg-neutral-100',
    aspectRatio && aspectRatioClasses[aspectRatio],
    className
  );

  const imageClasses = cn(
    'w-full h-full transition-opacity',
    {
      'opacity-0': !isLoaded && !placeholderSrc,
      'opacity-100': isLoaded || placeholderSrc,
      'object-contain': objectFit === 'contain',
      'object-cover': objectFit === 'cover',
      'object-fill': objectFit === 'fill',
      'object-none': objectFit === 'none',
      'object-scale-down': objectFit === 'scale-down'
    }
  );

  if (isError) {
    return (
      <div className={containerClasses}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-500">Failed to load image</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={containerClasses}>
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={imageClasses}
          style={{
            transitionDuration: `${fadeInDuration}ms`,
            filter: !isLoaded && placeholderSrc ? 'blur(10px)' : 'none',
            transform: !isLoaded && placeholderSrc ? 'scale(1.1)' : 'scale(1)'
          }}
          {...props}
        />
      )}
      
      {!isLoaded && !currentSrc && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
    </div>
  );
};

interface ResponsiveImageProps extends Omit<LazyImageProps, 'src'> {
  src: {
    small?: string;
    medium?: string;
    large?: string;
    default: string;
  };
  sizes?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props
}) => {
  const srcSet = [
    src.small && `${src.small} 640w`,
    src.medium && `${src.medium} 1024w`,
    src.large && `${src.large} 1920w`
  ].filter(Boolean).join(', ');

  return (
    <LazyImage
      src={src.default}
      srcSet={srcSet}
      sizes={sizes}
      {...props}
    />
  );
};