/**
 * UI Utilities
 * 
 * This file provides UI-related utility functions for responsive images,
 * layout calculations, and other UI helpers.
 */

/**
 * Get responsive image source based on screen size
 */
export function getResponsiveImageSrc(
  baseSrc: string,
  sizes: { small?: string; medium?: string; large?: string } = {}
): string {
  // Simple implementation - in a real app you'd check screen size
  return sizes.medium || sizes.large || sizes.small || baseSrc;
}

/**
 * Get responsive image srcset for different screen densities
 */
export function getResponsiveImageSrcSet(
  baseSrc: string,
  densities: number[] = [1, 2, 3]
): string {
  return densities
    .map(density => {
      const src = baseSrc.replace(/(\.[^.]+)$/, `@${density}x$1`);
      return `${src} ${density}x`;
    })
    .join(', ');
}

/**
 * Calculate optimal image dimensions for container
 */
export function calculateImageDimensions(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number
): { width: number; height: number } {
  const containerAspectRatio = containerWidth / containerHeight;
  
  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider than container
    return {
      width: containerWidth,
      height: containerWidth / imageAspectRatio
    };
  } else {
    // Image is taller than container
    return {
      width: containerHeight * imageAspectRatio,
      height: containerHeight
    };
  }
}

/**
 * Generate CSS classes for responsive breakpoints
 */
export function getResponsiveClasses(
  baseClass: string,
  breakpoints: { sm?: string; md?: string; lg?: string; xl?: string } = {}
): string {
  const classes = [baseClass];
  
  if (breakpoints.sm) classes.push(`sm:${breakpoints.sm}`);
  if (breakpoints.md) classes.push(`md:${breakpoints.md}`);
  if (breakpoints.lg) classes.push(`lg:${breakpoints.lg}`);
  if (breakpoints.xl) classes.push(`xl:${breakpoints.xl}`);
  
  return classes.join(' ');
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Sidebar constants and utilities
export const SIDEBAR_COOKIE_NAME = "sidebar:state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";

// Import cva for proper variant handling
import { cva } from "class-variance-authority";

// Toggle variants for UI components (using proper cva)
export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "h-8 px-2",
        md: "h-9 px-3",
        lg: "h-10 px-3"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

// Sidebar context and hook (simplified implementation)
export const SidebarContext = {
  state: "expanded" as "expanded" | "collapsed",
  open: true,
  setOpen: (_open: boolean) => {},
  openMobile: false,
  setOpenMobile: (_open: boolean) => {},
  isMobile: false,
  toggleSidebar: () => {}
};

export function useSidebar() {
  return SidebarContext;
}
