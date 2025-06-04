/**
 * Skeleton Component
 * 
 * This component provides loading placeholders for content that is being fetched
 * or processed. It improves perceived performance and reduces layout shifts by
 * maintaining the same dimensions as the content it will eventually be replaced with.
 */

import { designSystem } from '@/config';
import { cn } from '@/lib/utils';
import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show the skeleton animation or not
   */
  isLoading?: boolean;
  
  /**
   * The content to show when not loading
   */
  children?: React.ReactNode;
  
  /**
   * The shape of the skeleton
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  
  /**
   * The width of the skeleton. Can be a CSS value or a predefined size.
   */
  width?: 'full' | 'auto' | number | string;
  
  /**
   * The height of the skeleton. Can be a CSS value or a predefined size.
   */
  height?: 'full' | 'auto' | number | string;
  
  /**
   * Whether to add a margin to the skeleton to replicate paragraph spacing
   */
  paragraph?: boolean;
  
  /**
   * Number of lines to show if paragraph is true
   */
  lines?: number;
  
  /**
   * Whether the skeleton should have a slight wave animation
   */
  animate?: boolean;
}

const resolveSize = (size: 'full' | 'auto' | number | string | undefined): string | undefined => {
  if (size === undefined) return undefined;
  if (size === 'full') return '100%';
  if (size === 'auto') return 'auto';
  if (typeof size === 'number') return `${size}px`;
  return size;
};

export const Skeleton = ({
  isLoading = true,
  children,
  variant = 'text',
  width,
  height,
  paragraph = false,
  lines = 3,
  animate = true,
  className,
  ...props
}: SkeletonProps) => {
  // If not loading, render children
  if (!isLoading) {
    return <>{children}</>;
  }

  // Styling for different variants
  const baseStyles: React.CSSProperties = {
    display: 'block',
    backgroundColor: 'var(--color-border, hsl(var(--border)))',
    width: resolveSize(width),
    height: resolveSize(height),
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      height: height ?? '1em',
      width: width ?? '100%',
      borderRadius: designSystem.borderRadius.sm,
    },
    rectangular: {
      height: height ?? '100px',
      width: width ?? '100%',
      borderRadius: 0,
    },
    circular: {
      height: height ?? '40px',
      width: width ?? '40px',
      borderRadius: '50%',
    },
    rounded: {
      height: height ?? '100px',
      width: width ?? '100%',
      borderRadius: designSystem.borderRadius.DEFAULT,
    },
  };

  // Animation style
  const animationStyle: React.CSSProperties = animate
    ? {
        animation: 'skeleton-pulse 1.5s ease-in-out 0.5s infinite',
      }
    : {};

  // Combine styles
  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...animationStyle,
  };

  // For paragraph style, render multiple lines
  if (paragraph) {
    return (
      <div
        className={cn('skeleton-paragraph', className)}
        aria-busy="true"
        aria-hidden="true"
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton-line',
              i === lines - 1 ? 'skeleton-line-last' : undefined
            )}
            style={{
              ...style,
              width: i === lines - 1 ? '80%' : '100%',
              marginBottom: i === lines - 1 ? 0 : '0.5em',
            }}
          />
        ))}
      </div>
    );
  }

  // For single skeleton item
  return (
    <div
      className={cn('skeleton', className)}
      style={style}
      aria-busy="true"
      aria-hidden="true"
      {...props}
    />
  );
};

/**
 * Skeleton Text component - a convenience wrapper for text skeletons
 */
export const SkeletonText = ({
  width = '100%',
  height = '1em',
  ...props
}: Omit<SkeletonProps, 'variant'>) => {
  return <Skeleton variant="text" width={width} height={height} {...props} />;
};

/**
 * Skeleton Avatar component - a convenience wrapper for circular skeletons
 */
export const SkeletonAvatar = ({
  width = 40,
  height = 40,
  ...props
}: Omit<SkeletonProps, 'variant'>) => {
  return <Skeleton variant="circular" width={width} height={height} {...props} />;
};

/**
 * Skeleton Card component - a convenience wrapper for rounded skeletons
 */
export const SkeletonCard = ({
  width = '100%',
  height = 200,
  ...props
}: Omit<SkeletonProps, 'variant'>) => {
  return <Skeleton variant="rounded" width={width} height={height} {...props} />;
};

/**
 * Skeleton Button component - a convenience wrapper for rounded skeletons
 * that look like buttons
 */
export const SkeletonButton = ({
  width = 120,
  height = 36,
  ...props
}: Omit<SkeletonProps, 'variant'>) => {
  return <Skeleton variant="rounded" width={width} height={height} {...props} />;
};

/**
 * Skeleton Image component - a convenience wrapper for rectangular skeletons
 * with an aspect ratio
 */
export interface SkeletonImageProps extends Omit<SkeletonProps, 'variant' | 'height'> {
  aspectRatio?: string;
}

export const SkeletonImage = ({
  width = '100%',
  aspectRatio = '16/9',
  ...props
}: SkeletonImageProps) => {
  return (
    <div style={{ position: 'relative', width: resolveSize(width), aspectRatio }}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        {...props}
      />
    </div>
  );
};

/**
 * Add skeleton animation to CSS
 */
export const skeletonStyles = `
@keyframes skeleton-pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.skeleton {
  background-image: linear-gradient(
    90deg,
    var(--color-border, hsl(var(--border))) 25%,
    var(--color-surface, hsl(var(--surface))) 50%,
    var(--color-border, hsl(var(--border))) 75%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

export default Skeleton;
