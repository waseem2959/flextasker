/**
 * Hook for detecting mobile devices
 */

import { useEffect, useState } from 'react';

/**
 * Configuration for mobile detection
 */
interface MobileDetectionConfig {
  /** Breakpoint width for mobile devices (in pixels) */
  mobileBreakpoint?: number;
  /** Whether to update on window resize */
  listenForResize?: boolean;
}

/**
 * Default configuration values
 */
const defaultConfig: MobileDetectionConfig = {
  mobileBreakpoint: 768, // Standard mobile breakpoint
  listenForResize: true
};

/**
 * Hook to detect if the current device is a mobile device
 * 
 * @param config - Configuration options
 * @returns Boolean indicating if the current device is mobile
 */
export function useIsMobile(config?: MobileDetectionConfig): boolean {
  const { mobileBreakpoint, listenForResize } = { ...defaultConfig, ...config };
    // Helper to determine if we're on mobile
  const checkIfMobile = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false; // Default for SSR
    }
    
    // Browser checks
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileDevice = mobileRegex.test(userAgent);

    // Screen size check - consider viewport width as well
    const isSmallScreen = window.innerWidth < (mobileBreakpoint ?? defaultConfig.mobileBreakpoint ?? 768);
    
    // If either is true, consider it a mobile device
    return isMobileDevice || isSmallScreen;
  };

  const [isMobile, setIsMobile] = useState<boolean>(checkIfMobile());
  
  useEffect(() => {
    // Only set up event listener if specified in config
    if (!listenForResize) {
      return;
    }
    
    // Function to update state based on window size
    const handleResize = () => {
      setIsMobile(checkIfMobile());
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint, listenForResize]);
  
  return isMobile;
}

export default useIsMobile;
