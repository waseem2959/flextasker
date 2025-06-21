/**
 * Image Optimization Service
 * 
 * Provides comprehensive image optimization capabilities including:
 * - Responsive image generation
 * - Format optimization (WebP, AVIF support)
 * - CDN integration (Cloudinary, Imgix)
 * - Local optimization for static images
 * - Performance monitoring
 */

export interface ImageBreakpoint {
  width: number;
  descriptor?: string;
}

export interface ImageFormat {
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
  priority: number;
}

export interface ImageOptimizationConfig {
  breakpoints: ImageBreakpoint[];
  formats: ImageFormat[];
  quality: number;
  autoFormat: boolean;
  lazyLoading: boolean;
  blurPlaceholder: boolean;
  cdnProvider?: 'cloudinary' | 'imgix' | 'local';
  baseUrl?: string;
}

export interface OptimizedImageUrls {
  src: string;
  srcSet: string;
  formats: Record<string, { src: string; srcSet: string }>;
  placeholder?: string;
  aspectRatio?: number;
}

class ImageOptimizationService {
  private config: ImageOptimizationConfig;
  private supportedFormats: Set<string> = new Set();

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = {
      breakpoints: [
        { width: 320 },
        { width: 640 },
        { width: 768 },
        { width: 1024 },
        { width: 1280 },
        { width: 1920 }
      ],
      formats: [
        { format: 'avif', quality: 70, priority: 1 },
        { format: 'webp', quality: 80, priority: 2 },
        { format: 'jpeg', quality: 85, priority: 3 }
      ],
      quality: 80,
      autoFormat: true,
      lazyLoading: true,
      blurPlaceholder: true,
      cdnProvider: 'local',
      ...config
    };

    this.detectFormatSupport();
  }

  /**
   * Detect browser support for modern image formats
   */
  private async detectFormatSupport(): Promise<void> {
    if (typeof window === 'undefined') return;

    const formats = ['avif', 'webp'];
    
    for (const format of formats) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const supported = canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
        
        if (supported) {
          this.supportedFormats.add(format);
        }
      } catch {
        // Format not supported
      }
    }

    // Alternative detection for AVIF
    if (!this.supportedFormats.has('avif')) {
      const avifSupported = await this.canDisplayAvif();
      if (avifSupported) {
        this.supportedFormats.add('avif');
      }
    }
  }

  /**
   * Check AVIF support using a small test image
   */
  private canDisplayAvif(): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  /**
   * Generate optimized image URLs for different formats and sizes
   */
  public generateOptimizedUrls(
    originalSrc: string,
    options: {
      width?: number;
      height?: number;
      aspectRatio?: number;
      quality?: number;
      formats?: ImageFormat[];
      breakpoints?: ImageBreakpoint[];
    } = {}
  ): OptimizedImageUrls {
    const {
      width,
      height,
      aspectRatio,
      quality = this.config.quality,
      formats = this.config.formats,
      breakpoints = this.config.breakpoints
    } = options;

    // Filter formats based on browser support
    const supportedFormats = formats.filter(f => 
      this.supportedFormats.has(f.format) || f.format === 'jpeg' || f.format === 'png'
    ).sort((a, b) => a.priority - b.priority);

    const result: OptimizedImageUrls = {
      src: this.generateUrl(originalSrc, { width, height, quality, format: 'jpeg' }),
      srcSet: '',
      formats: {},
      aspectRatio
    };

    // Generate srcSet for different breakpoints
    const srcSetEntries = breakpoints.map(bp => {
      const url = this.generateUrl(originalSrc, {
        width: bp.width,
        height: height ? Math.round((height * bp.width) / (width || bp.width)) : undefined,
        quality,
        format: 'jpeg'
      });
      return `${url} ${bp.width}w`;
    });
    result.srcSet = srcSetEntries.join(', ');

    // Generate format-specific URLs
    for (const format of supportedFormats) {
      const formatSrcSet = breakpoints.map(bp => {
        const url = this.generateUrl(originalSrc, {
          width: bp.width,
          height: height ? Math.round((height * bp.width) / (width || bp.width)) : undefined,
          quality: format.quality || quality,
          format: format.format
        });
        return `${url} ${bp.width}w`;
      });

      result.formats[format.format] = {
        src: this.generateUrl(originalSrc, { width, height, quality: format.quality || quality, format: format.format }),
        srcSet: formatSrcSet.join(', ')
      };
    }

    // Generate blur placeholder
    if (this.config.blurPlaceholder) {
      result.placeholder = this.generateBlurPlaceholder(originalSrc);
    }

    return result;
  }

  /**
   * Generate a single optimized URL
   */
  private generateUrl(
    originalSrc: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): string {
    const { width, height, quality, format } = options;

    switch (this.config.cdnProvider) {
      case 'cloudinary':
        return this.generateCloudinaryUrl(originalSrc, { width, height, quality, format });
      
      case 'imgix':
        return this.generateImgixUrl(originalSrc, { width, height, quality, format });
      
      default:
        return this.generateLocalUrl(originalSrc, { width, height, quality, format });
    }
  }

  /**
   * Generate Cloudinary optimized URL
   */
  private generateCloudinaryUrl(
    src: string,
    options: { width?: number; height?: number; quality?: number; format?: string }
  ): string {
    if (!src.includes('cloudinary.com')) return src;

    const { width, height, quality, format } = options;
    const transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);
    
    // Always use auto format and compression
    transformations.push('f_auto', 'q_auto');

    const params = transformations.join(',');
    return src.replace('/upload/', `/upload/${params}/`);
  }

  /**
   * Generate Imgix optimized URL
   */
  private generateImgixUrl(
    src: string,
    options: { width?: number; height?: number; quality?: number; format?: string }
  ): string {
    if (!src.includes('imgix.com')) return src;

    const url = new URL(src);
    const { width, height, quality, format } = options;

    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    if (format) url.searchParams.set('fm', format);
    
    // Auto optimization
    url.searchParams.set('auto', 'format,compress');

    return url.toString();
  }

  /**
   * Generate local/custom URL (for future server-side optimization)
   */
  private generateLocalUrl(
    src: string,
    _options: { width?: number; height?: number; quality?: number; format?: string }
  ): string {
    // For now, return original URL
    // In production, this would integrate with your image optimization service
    return src;
  }

  /**
   * Generate blur placeholder (low-quality, small size)
   */
  private generateBlurPlaceholder(src: string): string {
    switch (this.config.cdnProvider) {
      case 'cloudinary':
        if (src.includes('cloudinary.com')) {
          return src.replace('/upload/', '/upload/w_40,h_40,c_fill,f_auto,q_10,e_blur:300/');
        }
        break;
      
      case 'imgix':
        if (src.includes('imgix.com')) {
          const url = new URL(src);
          url.searchParams.set('w', '40');
          url.searchParams.set('h', '40');
          url.searchParams.set('fit', 'crop');
          url.searchParams.set('q', '10');
          url.searchParams.set('blur', '5');
          return url.toString();
        }
        break;
    }

    // Fallback: return a data URL placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAxNkwyNCAxOEwxNiAxOFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';
  }

  /**
   * Preload critical images
   */
  public preloadImage(src: string, options: { 
    priority?: boolean;
    format?: string;
    width?: number;
  } = {}): void {
    if (typeof window === 'undefined') return;

    const { priority = false, format = 'webp', width } = options;
    
    const optimizedUrls = this.generateOptimizedUrls(src, { width });
    const preloadSrc = optimizedUrls.formats[format]?.src || optimizedUrls.src;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = preloadSrc;
    
    if (priority) {
      link.setAttribute('fetchpriority', 'high');
    }

    document.head.appendChild(link);
  }

  /**
   * Calculate aspect ratio from image dimensions
   */
  public calculateAspectRatio(width: number, height: number): number {
    return width / height;
  }

  /**
   * Get optimal breakpoints based on container size
   */
  public getOptimalBreakpoints(containerWidth: number): ImageBreakpoint[] {
    return this.config.breakpoints.filter(bp => bp.width <= containerWidth * 2);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();

// Export class and utilities
export { ImageOptimizationService };