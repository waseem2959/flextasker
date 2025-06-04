/**
 * UI Utilities
 * 
 * This module provides UI-specific utility functions and design components.
 * These utilities are primarily focused on UI styling and class name management.
 */

import { cn, formatCurrency, truncateText } from './utils';

// Re-export individual functions
export { cn, formatCurrency, truncateText };

// cn function is now exported from @/lib/utils to avoid duplication
export default {
  cn,
  formatCurrency,
  truncateText
};
