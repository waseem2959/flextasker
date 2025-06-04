import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

// EDUCATIONAL CONCEPT #1: Understanding Class Variance Authority
// The buttonVariants function is likely created using 'cva' (class-variance-authority)
// which is a utility for creating type-safe CSS class variants. Think of it as a
// sophisticated way to manage different button styles (primary, secondary, sizes, etc.)

// THIS IS THE FUNCTION THAT NEEDS TO BE EXPORTED
// The 'export' keyword here makes buttonVariants available to other files
export const buttonVariants = cva(
  // Base classes that apply to all button variants
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Different visual styles for the button
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-600 shadow-sm",
        secondary: "bg-surface text-text-primary hover:bg-border focus:ring-primary-600 border border-border",
        ghost: "text-primary-600 hover:bg-primary-50 focus:ring-primary-600",
        danger: "bg-error text-white hover:bg-red-600 focus:ring-error shadow-sm",
        success: "bg-success text-white hover:bg-green-600 focus:ring-success shadow-sm",
        outline: "border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-600",
        link: "text-primary-600 underline-offset-4 hover:underline focus:ring-primary-600",
        // Keep default for backward compatibility
        default: "bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-600 shadow-sm",
        destructive: "bg-error text-white hover:bg-red-600 focus:ring-error shadow-sm",
        warning: "bg-warning text-white hover:bg-yellow-600 focus:ring-warning shadow-sm",
      },
      // Different sizes for the button
      size: {
        sm: "px-3 py-1.5 text-sm h-8",
        md: "px-4 py-2 text-base h-10",
        lg: "px-6 py-3 text-lg h-12",
        icon: "h-10 w-10 p-0",
        // Keep default for backward compatibility
        default: "px-4 py-2 text-base h-10",
        xl: "px-8 py-4 text-lg h-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// EDUCATIONAL CONCEPT #2: Creating Compound Component Props
// We create a type that combines the button's HTML attributes with our variant props
// This gives us full type safety while maintaining flexibility
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// EDUCATIONAL CONCEPT #3: The Polymorphic Component Pattern
// The 'asChild' prop allows this button to render as different elements
// while maintaining the same styling and behavior. It's like having a chameleon
// component that can adapt to different contexts while keeping its core identity.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// EDUCATIONAL NOTE: Multiple Export Patterns
// Notice how we export both the component (Button) and the variants function (buttonVariants)
// This allows other components to:
// 1. Use <Button> directly for most cases
// 2. Use buttonVariants() to apply button styling to non-button elements
// 
// This is a common pattern in design systems where you want both convenience
// and flexibility. The AlertDialog components use buttonVariants() because they
// need button styling on elements that aren't actually button components.