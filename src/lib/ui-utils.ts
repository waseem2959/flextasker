/**
 * UI Utilities
 *
 * This module provides UI-specific utility functions and design components.
 * These utilities are primarily focused on UI styling and class name management.
 */

import { cn, formatCurrency, truncate } from './utils';

// Re-export individual functions
export { cn, formatCurrency, truncate };

/**
 * Status color mapping for consistent status indicators
 */
export const STATUS_COLORS = {
  // Payment statuses
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
  },
  approved: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  rejected: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  'in-progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  },
  completed: {
    bg: 'bg-primary-50',
    text: 'text-primary-800',
    border: 'border-primary-200',
    icon: 'text-primary-600',
  },
  cancelled: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-800',
    border: 'border-neutral-200',
    icon: 'text-neutral-600',
  },
  // Risk levels
  low: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: 'text-orange-600',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
} as const;

/**
 * Get status color classes
 */
export const getStatusColors = (status: keyof typeof STATUS_COLORS) => {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

/**
 * Common animation variants for framer-motion
 */
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
} as const;

/**
 * Format file size consistently
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

/**
 * Common focus ring styles for accessibility
 */
export const getFocusRingClasses = (color: 'primary' | 'neutral' = 'primary') => {
  return color === 'primary'
    ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
    : 'focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2';
};

/**
 * Generate consistent error message styling
 */
export const getErrorMessageClasses = () => {
  return 'text-sm text-red-600 font-body mt-1';
};

/**
 * Generate consistent success message styling
 */
export const getSuccessMessageClasses = () => {
  return 'text-sm text-green-600 font-body mt-1';
};

// cn function is now exported from @/lib/utils to avoid duplication
export default {
  cn,
  formatCurrency,
  truncate,
  getStatusColors,
  formatFileSize,
  getInitials,
  getFocusRingClasses,
  getErrorMessageClasses,
  getSuccessMessageClasses,
};
