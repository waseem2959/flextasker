/**
 * UI Component Types
 * 
 * This file provides type definitions for UI components to ensure consistency
 * across the application.
 */

/**
 * Badge variant types
 */
export type BadgeVariant = 
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'accent';

/**
 * Button variant types
 */
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

/**
 * Button size types
 */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * Input size types
 */
export type InputSize = 'default' | 'sm' | 'lg';

/**
 * Alert variant types
 */
export type AlertVariant = 'default' | 'destructive';

/**
 * Toast variant types
 */
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';
