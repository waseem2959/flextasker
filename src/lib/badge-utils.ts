/**
 * Badge Component Utilities
 * 
 * This file provides styling utilities for badge components
 * using class-variance-authority for type-safe variants.
 */

import { cva, type VariantProps } from "class-variance-authority";

/**
 * Badge component variants using class-variance-authority
 * 
 * This provides a consistent way to style badge components with variants
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(185,76%,35%)] text-white hover:bg-[hsl(192,84%,26%)]", // primary/primary-dark
        secondary:
          "border-transparent bg-[hsl(210,40%,98%)] text-[hsl(206,33%,16%)] hover:bg-[hsl(220,13%,91%)]", // surface/text-primary/border
        destructive:
          "border-transparent bg-[hsl(354,70%,54%)] text-white hover:bg-[hsl(354,70%,44%)]", // error
        outline: "border-[hsl(220,13%,91%)] text-[hsl(206,33%,16%)]", // border/text-primary
        success:
          "border-transparent bg-[hsl(159,61%,46%)] text-white hover:bg-[hsl(159,61%,36%)]", // success
        warning:
          "border-transparent bg-[hsl(37,90%,51%)] text-white hover:bg-[hsl(37,90%,41%)]", // warning
        accent:
          "border-transparent bg-[hsl(197,83%,95%)] text-[hsl(196,80%,43%)] hover:bg-[hsl(197,83%,85%)]", // info
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Type for badge variants to ensure type safety when using the component
 */
export type BadgeVariants = VariantProps<typeof badgeVariants>;

export default {
  badgeVariants
};
