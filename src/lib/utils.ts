/**
 * UI Utilities
 * 
 * This module provides UI-specific utility functions and design components.
 * These utilities are primarily focused on UI styling and class name management.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { cva } from "class-variance-authority"

// Log UI utilities usage notice in development
if (process.env.NODE_ENV !== 'production') {
  console.info(
    'NOTICE: This module contains UI-specific utilities. ' +
    'For general utilities, see utils/ directory.'
  );
}

/**
 * Combines and merges class names using clsx and tailwind-merge
 * 
 * This utility helps manage conditional class names in a type-safe way
 * while properly handling Tailwind CSS conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Badge component variants using class-variance-authority
 * 
 * This provides a consistent way to style badge components with variants
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Navigation menu trigger style using class-variance-authority
 * 
 * This provides consistent styling for navigation menu triggers
 */
export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)
