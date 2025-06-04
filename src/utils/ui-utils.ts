/**
 * UI Utilities
 * 
 * This module re-exports UI utilities from the lib directory for backward compatibility
 * and provides additional UI-specific utilities.
 */

// Re-export from lib files
export {
    SIDEBAR_COOKIE_MAX_AGE,
    SIDEBAR_COOKIE_NAME,
    SIDEBAR_KEYBOARD_SHORTCUT,
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_ICON,
    SIDEBAR_WIDTH_MOBILE,
    SidebarContext,
    SidebarProvider,
    SidebarReactContext,
    useSidebar,
    useSidebarContext,
    type SidebarStore
} from '@/lib/sidebar-utils';
export { toggleVariants } from '@/lib/toggle-utils';
export { cn, formatCurrency, getInitials, truncateText } from '@/lib/utils';

// Import for type definition
import { toggleVariants as toggleVariantsForType } from '@/lib/toggle-utils';

// Additional UI utilities
export type ToggleVariants = typeof toggleVariantsForType;

// Import for default export
import { toggleVariants as toggleVariantsImport } from '@/lib/toggle-utils';
import { cn, formatCurrency, getInitials, truncateText } from '@/lib/utils';

// Default export for compatibility
export default {
  cn,
  formatCurrency,
  truncateText,
  getInitials,
  toggleVariants: toggleVariantsImport,
};
