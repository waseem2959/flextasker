/**
 * Mobile Detection Hook
 * 
 * A React hook for detecting if the viewport is mobile-sized
 */

import { useState, useEffect } from "react";

// Mobile breakpoint in pixels
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized
 * @returns boolean indicating if the viewport is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
