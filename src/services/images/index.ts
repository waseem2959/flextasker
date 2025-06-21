/**
 * Image Services Export
 * 
 * Centralized exports for all image-related services and utilities.
 */

// Core services
export { 
  imageOptimizationService,
  ImageOptimizationService,
  type ImageOptimizationConfig,
  type OptimizedImageUrls,
  type ImageBreakpoint,
  type ImageFormat
} from './image-optimization';

export {
  imagePerformanceMonitor,
  ImagePerformanceMonitor,
  type ImageLoadMetrics,
  type PerformanceStats
} from './image-performance';

// Hooks
export {
  useOptimizedImage,
  useResponsiveImage,
  useAvatarImage,
  useHeroImage
} from '../../hooks/use-optimized-image';

// Components
export {
  EnhancedImage,
  OptimizedAvatar,
  OptimizedTaskImage,
  OptimizedHeroImage
} from '../../components/ui/enhanced-image';

export {
  ImagePerformanceDashboard,
  ImagePerformanceToggle
} from '../../components/dev/image-performance-dashboard';

// Configuration presets
export const imagePresets = {
  // Common breakpoints for responsive images
  breakpoints: {
    mobile: { width: 320 },
    tablet: { width: 768 },
    desktop: { width: 1024 },
    large: { width: 1280 },
    xlarge: { width: 1920 }
  },

  // Common aspect ratios
  aspectRatios: {
    square: 1,
    landscape: 16/9,
    portrait: 3/4,
    widescreen: 21/9,
    golden: 1.618
  },

  // Quality presets
  quality: {
    low: 60,
    medium: 80,
    high: 90,
    maximum: 95
  },

  // Common sizes for different use cases
  sizes: {
    avatar: {
      xs: 24,
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
      '2xl': 128
    },
    thumbnail: {
      sm: 150,
      md: 200,
      lg: 300
    },
    card: {
      width: 400,
      height: 225 // 16:9 aspect ratio
    },
    hero: {
      width: 1200,
      height: 800
    }
  }
};

// Helper functions
export const createImageUrl = (
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
) => {
  const url = new URL(baseUrl);
  
  if (options.width) url.searchParams.set('w', options.width.toString());
  if (options.height) url.searchParams.set('h', options.height.toString());
  if (options.quality) url.searchParams.set('q', options.quality.toString());
  if (options.format) url.searchParams.set('f', options.format);
  
  return url.toString();
};

export const calculateImageSize = (
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
) => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
};

export const generateSrcSet = (
  baseUrl: string,
  breakpoints: number[],
  options: { quality?: number; format?: string } = {}
) => {
  return breakpoints
    .map(width => {
      const url = createImageUrl(baseUrl, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
};