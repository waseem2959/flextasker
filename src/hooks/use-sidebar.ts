/**
 * Sidebar Hook
 * 
 * A React hook for accessing and controlling the sidebar state
 */

import { useSidebar as useSidebarFromUtils } from '@/utils/ui-utils';

/**
 * Hook for accessing sidebar functionality
 * Uses Zustand store directly
 */
export function useSidebar() {
  return useSidebarFromUtils();
}

// Re-export sidebar constants and types for convenience
export {
    SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE, SidebarContext
} from '@/utils/ui-utils';

