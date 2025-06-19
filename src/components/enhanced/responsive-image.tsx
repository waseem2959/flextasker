/**
 * Responsive Image Component
 * 
 * Optimized image component with lazy loading, responsive sizing,
 * error handling, and performance optimizations.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string | React.ReactNode;
  errorContent?: React.ReactNode;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  blur?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  onClick?: () => void;
}

interface ImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  currentSrc: string;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  placeholder,
  errorContent,
  sizes = '100vw',
  srcSet,
  loading = 'lazy',
  priority = false,
  aspectRatio,
  objectFit = 'cover',
  quality = 80,
  blur = false,
  onLoad,
  onError,
  onClick
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    isLoaded: false,
    hasError: false,
    currentSrc: src
  });

  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [loading, priority]);

  // Handle image load
  const handleLoad = () => {
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      isLoaded: true,
      hasError: false
    }));
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const nativeEvent = event.nativeEvent;
    
    // Try fallback if we haven't already and it's different from current src
    if (fallbackSrc && imageState.currentSrc !== fallbackSrc && imageState.currentSrc === src) {
      setImageState(prev => ({
        ...prev,
        currentSrc: fallbackSrc
      }));
      return;
    }

    // Set error state
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      isLoaded: false,
      hasError: true
    }));
    
    onError?.(nativeEvent);
  };

  // Generate optimized image URL based on quality and size
  const getOptimizedSrc = (originalSrc: string, width?: number): string => {
    // This would integrate with your image optimization service
    // For now, return the original src
    // In production, you might use services like Cloudinary, Imgix, etc.
    
    if (originalSrc.includes('cloudinary.com')) {
      // Example for Cloudinary
      const qualityParam = `q_${quality}`;
      const formatParam = 'f_auto';
      const widthParam = width ? `w_${width}` : '';
      
      const params = [qualityParam, formatParam, widthParam].filter(Boolean).join(',');
      return originalSrc.replace('/upload/', `/upload/${params}/`);
    }
    
    if (originalSrc.includes('imgix.com')) {
      // Example for Imgix
      const separator = originalSrc.includes('?') ? '&' : '?';
      const params = new URLSearchParams();
      params.set('auto', 'format,compress');
      params.set('q', quality.toString());
      if (width) params.set('w', width.toString());
      
      return `${originalSrc}${separator}${params.toString()}`;
    }
    
    return originalSrc;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (): string => {
    if (srcSet) return srcSet;
    
    const breakpoints = [320, 640, 768, 1024, 1280, 1920];
    return breakpoints
      .map(width => `${getOptimizedSrc(imageState.currentSrc, width)} ${width}w`)
      .join(', ');
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && {
      aspectRatio: aspectRatio.toString()
    })
  };

  // Image styles
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease, filter 0.3s ease',
    opacity: imageState.isLoaded ? 1 : 0,
    filter: blur && !imageState.isLoaded ? 'blur(10px)' : 'none'
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (typeof placeholder === 'string') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      );
    }
    
    if (placeholder) {
      return (
        <div className="absolute inset-0">
          {placeholder}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  };

  // Render error state
  const renderError = () => {
    if (errorContent) {
      return (
        <div className="absolute inset-0">
          {errorContent}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm text-center px-2">
          Failed to load image
        </p>
      </div>
    );
  };

  // Render loading indicator
  const renderLoading = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="animate-pulse bg-gray-200 w-full h-full" />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      {/* Placeholder/Loading State */}
      {(imageState.isLoading || !isInView) && renderPlaceholder()}
      
      {/* Loading Indicator */}
      {imageState.isLoading && isInView && renderLoading()}
      
      {/* Error State */}
      {imageState.hasError && renderError()}
      
      {/* Main Image */}
      {isInView && !imageState.hasError && (
        <img
          ref={imgRef}
          src={getOptimizedSrc(imageState.currentSrc)}
          srcSet={generateSrcSet()}
          sizes={sizes}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Overlay for click interactions */}
      {onClick && (
        <div className="absolute inset-0 cursor-pointer" />
      )}
    </div>
  );
};

// Preset component for avatars
export const Avatar: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
  onClick?: () => void;
}> = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '', 
  fallback,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const fallbackContent = fallback ? (
    <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center font-semibold">
      {fallback}
    </div>
  ) : undefined;

  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      aspectRatio={1}
      objectFit="cover"
      placeholder={fallbackContent}
      errorContent={fallbackContent}
      onClick={onClick}
      priority
    />
  );
};

// Preset component for task card images
export const TaskImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ 
  src, 
  alt, 
  className = '', 
  onClick 
}) => {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`aspect-video ${className}`}
      objectFit="cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder={
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-blue-300" />
        </div>
      }
      onClick={onClick}
    />
  );
};

// Preset component for gallery images
export const GalleryImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: number;
  onClick?: () => void;
}> = ({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = 1,
  onClick 
}) => {
  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`${className}`}
      aspectRatio={aspectRatio}
      objectFit="cover"
      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      blur
      onClick={onClick}
    />
  );
};

export default ResponsiveImage;