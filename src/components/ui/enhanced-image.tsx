/**
 * Enhanced Image Component
 * 
 * Next-generation image component with comprehensive optimization:
 * - Automatic format selection (AVIF, WebP, JPEG)
 * - Responsive image generation
 * - Lazy loading with intersection observer
 * - Blur-up placeholder effect
 * - Error handling with fallbacks
 * - Performance monitoring
 * - Accessibility compliance
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimizedImage } from '@/hooks/use-optimized-image';

interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: string | boolean;
  fallbackSrc?: string;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  blur?: boolean;
  fadeInDuration?: number;
  retryable?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  // Performance monitoring
  onPerformanceData?: (data: {
    loadTime: number;
    size: number;
    format: string;
  }) => void;
}

export const EnhancedImage = forwardRef<HTMLDivElement, EnhancedImageProps>(({
  src,
  alt,
  width,
  height,
  aspectRatio,
  className = '',
  containerClassName = '',
  priority = false,
  quality = 80,
  placeholder = true,
  fallbackSrc,
  sizes,
  objectFit = 'cover',
  lazy = true,
  blur = true,
  fadeInDuration = 300,
  retryable = true,
  loadingComponent,
  errorComponent,
  onLoad,
  onError,
  onClick,
  onPerformanceData
}, ref) => {
  const [loadStartTime] = useState(Date.now());
  const [showRetryButton, setShowRetryButton] = useState(false);

  const {
    optimizedUrls,
    imageProps,
    isLoading,
    isLoaded,
    hasError,
    retry,
    placeholder: generatedPlaceholder,
    ref: intersectionRef
  } = useOptimizedImage({
    src: fallbackSrc || src,
    width,
    height,
    aspectRatio,
    quality,
    lazy: lazy && !priority,
    priority,
    placeholder,
    onLoad: useCallback(() => {
      const loadTime = Date.now() - loadStartTime;
      onPerformanceData?.({
        loadTime,
        size: 0, // Could be calculated from image data
        format: 'auto'
      });
      onLoad?.();
    }, [loadStartTime, onPerformanceData, onLoad]),
    onError: useCallback((error: Error) => {
      setShowRetryButton(true);
      onError?.(error);
    }, [onError])
  });

  // Handle retry
  const handleRetry = useCallback(() => {
    setShowRetryButton(false);
    retry();
  }, [retry]);

  // Generate container styles
  const containerStyle: React.CSSProperties = {
    ...(aspectRatio && { aspectRatio: aspectRatio.toString() }),
    ...(width && !aspectRatio && { width }),
    ...(height && !aspectRatio && { height })
  };

  // Generate image styles
  const imageStyle: React.CSSProperties = {
    objectFit,
    transition: `opacity ${fadeInDuration}ms ease-in-out${blur ? `, filter ${fadeInDuration}ms ease-in-out` : ''}`,
  };

  // Generate placeholder element
  const renderPlaceholder = () => {
    if (typeof placeholder === 'string') {
      return (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{ filter: 'blur(10px)' }}
        />
      );
    }

    if (generatedPlaceholder) {
      return (
        <img
          src={generatedPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      );
    }

    // Default gradient placeholder
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
    );
  };

  // Generate loading component
  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col items-center space-y-2">
          <motion.div
            className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  };

  // Generate error component
  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm text-center px-2 mb-3">Failed to load image</p>
        {retryable && showRetryButton && (
          <button
            onClick={handleRetry}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            aria-label="Retry loading image"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  };

  // Picture element for modern format support
  const renderPictureElement = () => {
    if (!optimizedUrls) {
      return (
        <img
          src={src}
          alt={alt}
          className={cn('w-full h-full', className)}
          style={imageStyle}
          {...imageProps}
        />
      );
    }

    return (
      <picture className="w-full h-full">
        {/* Modern formats */}
        {optimizedUrls.formats.avif && (
          <source
            srcSet={optimizedUrls.formats.avif.srcSet}
            sizes={sizes || imageProps.sizes}
            type="image/avif"
          />
        )}
        {optimizedUrls.formats.webp && (
          <source
            srcSet={optimizedUrls.formats.webp.srcSet}
            sizes={sizes || imageProps.sizes}
            type="image/webp"
          />
        )}
        
        {/* Fallback */}
        <img
          srcSet={imageProps.srcSet}
          sizes={sizes || imageProps.sizes}
          alt={alt}
          className={cn('w-full h-full', className)}
          style={{
            ...imageStyle,
            opacity: isLoaded ? 1 : 0,
            filter: blur && !isLoaded ? 'blur(10px)' : 'none'
          }}
          loading={imageProps.loading}
          decoding={imageProps.decoding}
          onLoad={imageProps.onLoad}
          onError={imageProps.onError}
          src={imageProps.src}
        />
      </picture>
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        containerClassName
      )}
      style={containerStyle}
      onClick={onClick}
    >
      {/* Intersection observer target */}
      <div ref={intersectionRef as React.RefObject<HTMLDivElement>} className="absolute inset-0" />

      {/* Placeholder */}
      <AnimatePresence>
        {(!isLoaded || isLoading) && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fadeInDuration / 1000 }}
          >
            {renderPlaceholder()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && !hasError && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderLoading()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderError()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main image */}
      {!hasError && (
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: fadeInDuration / 1000 }}
        >
          {renderPictureElement()}
        </motion.div>
      )}

      {/* Click overlay */}
      {onClick && (
        <div className="absolute inset-0 cursor-pointer" aria-hidden="true" />
      )}
    </div>
  );
});

EnhancedImage.displayName = 'EnhancedImage';

// Preset components

/**
 * Optimized Avatar Component
 */
export const OptimizedAvatar: React.FC<{
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  const sizeConfig = {
    xs: { dimension: 24, className: 'w-6 h-6' },
    sm: { dimension: 32, className: 'w-8 h-8' },
    md: { dimension: 48, className: 'w-12 h-12' },
    lg: { dimension: 64, className: 'w-16 h-16' },
    xl: { dimension: 96, className: 'w-24 h-24' },
    '2xl': { dimension: 128, className: 'w-32 h-32' }
  };

  const config = sizeConfig[size];

  const fallbackElement = fallback ? (
    <div className="w-full h-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
      {fallback}
    </div>
  ) : (
    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
      <ImageIcon className="w-1/2 h-1/2 text-gray-500 dark:text-gray-400" />
    </div>
  );

  return (
    <EnhancedImage
      src={src}
      alt={alt}
      width={config.dimension}
      height={config.dimension}
      aspectRatio={1}
      className={cn(config.className, 'rounded-full', className)}
      objectFit="cover"
      priority={size === 'xs' || size === 'sm'}
      errorComponent={fallbackElement}
      placeholder={false}
      onClick={onClick}
    />
  );
};

/**
 * Optimized Task Image Component
 */
export const OptimizedTaskImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: number;
  onClick?: () => void;
}> = ({ 
  src, 
  alt, 
  className = '', 
  aspectRatio = 16/9,
  onClick 
}) => {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      aspectRatio={aspectRatio}
      className={className}
      objectFit="cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
      onClick={onClick}
    />
  );
};

/**
 * Optimized Hero Image Component
 */
export const OptimizedHeroImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}> = ({ 
  src, 
  alt, 
  width = 1200,
  height = 800,
  className = '', 
  onClick 
}) => {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      objectFit="cover"
      sizes="100vw"
      priority={true}
      quality={90}
      blur={true}
      onClick={onClick}
    />
  );
};

export default EnhancedImage;