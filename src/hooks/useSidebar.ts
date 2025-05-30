/**
 * Sidebar Hook
 * 
 * A React hook for accessing and controlling the sidebar state
 */

import { useContext } from "react";
import { SidebarContext } from '@/lib/sidebarUtils';

/**
 * Hook for accessing sidebar functionality
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
}

// Re-export sidebar constants and types for convenience
export {
  SidebarContext,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_MOBILE,
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_KEYBOARD_SHORTCUT
} from '@/lib/sidebar-utils';
