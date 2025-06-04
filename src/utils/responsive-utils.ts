/**
 * Responsive Utilities
 * 
 * Centralized utilities for responsive layouts, device detection, and breakpoint management.
 * This consolidates previously scattered responsive logic across the codebase.
 */

import { useEffect, useState } from 'react';

/**
 * Standard breakpoints used throughout the application
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const;

/**
 * Utility for converting breakpoints to CSS media queries
 */
export const mediaQueries = {
  mobile: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet}px)`,
  belowTablet: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  belowDesktop: `(max-width: ${BREAKPOINTS.desktop - 1}px)`,
};

/**
 * Hook to detect if the viewport matches mobile breakpoint
 * 
 * @param breakpoint - The breakpoint to consider as mobile (default: BREAKPOINTS.mobile)
 * @returns boolean indicating if the device is mobile
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.mobile): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Function to check if device is mobile
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        return window.innerWidth < breakpoint;
      }
      return false;
    };

    // Set initial state
    setIsMobile(checkIsMobile());

    // Create resize handler
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to get device type based on screen width
 * 
 * @returns object with device type information
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState<{
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 0,
  });

  useEffect(() => {
    const getDeviceType = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        return {
          isMobile: width < BREAKPOINTS.mobile,
          isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
          isDesktop: width >= BREAKPOINTS.tablet,
          screenWidth: width,
        };
      }
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 0,
      };
    };

    // Set initial state
    setDeviceType(getDeviceType());

    // Create resize handler
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceType;
}

/**
 * Hook to detect device orientation
 * 
 * @returns object with orientation information
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<{
    isPortrait: boolean;
    isLandscape: boolean;
    angle: number;
  }>({
    isPortrait: true,
    isLandscape: false,
    angle: 0,
  });

  useEffect(() => {
    const getOrientation = () => {
      if (typeof window !== 'undefined') {
        const height = window.innerHeight;
        const width = window.innerWidth;
        const angle = window.screen?.orientation?.angle || 0;
        
        return {
          isPortrait: height > width,
          isLandscape: width > height,
          angle,
        };
      }
      return {
        isPortrait: true,
        isLandscape: false,
        angle: 0,
      };
    };

    // Set initial state
    setOrientation(getOrientation());

    // Create handlers
    const handleResize = () => setOrientation(getOrientation());
    const handleOrientationChange = () => setOrientation(getOrientation());

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook to detect if user prefers reduced motion
 * 
 * @returns boolean indicating if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    return undefined;
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect if user prefers dark color scheme
 * 
 * @returns boolean indicating if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setPrefersDarkMode(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersDarkMode(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    return undefined;
  }, []);

  return prefersDarkMode;
}

/**
 * Hook to detect touch device
 * 
 * @returns boolean indicating if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
    }
  }, []);

  return isTouchDevice;
}

/**
 * Hook for comprehensive device detection
 * 
 * @returns object with all device information
 */
export function useDevice() {
  const deviceType = useDeviceType();
  const orientation = useOrientation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersDarkMode = usePrefersDarkMode();
  const isTouchDevice = useIsTouchDevice();

  return {
    ...deviceType,
    ...orientation,
    prefersReducedMotion,
    prefersDarkMode,
    isTouchDevice,
  };
}

/**
 * Hook to detect screen width changes and execute callbacks
 */
export function useBreakpointCallback(callbacks: {
  mobile?: () => void;
  tablet?: () => void;
  desktop?: () => void;
}) {
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.mobile) {
        callbacks.mobile?.();
      } else if (width < BREAKPOINTS.tablet) {
        callbacks.tablet?.();
      } else {
        callbacks.desktop?.();
      }
    };
    
    // Call once on mount
    handleResize();
    
    // Add listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [callbacks]);
}

/**
 * Hook to get a value based on current breakpoint
 */
export function useBreakpointValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { isMobile, isTablet } = useDeviceType();
  
  if (isMobile) return values.mobile;
  if (isTablet) return values.tablet ?? values.desktop ?? values.mobile;
  return values.desktop ?? values.mobile;
}

// Export aliases for backward compatibility
export const useMobile = useIsMobile;
export default useIsMobile;
