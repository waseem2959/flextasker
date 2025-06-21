import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// EDUCATIONAL CONCEPT #1: Understanding Class Variance Authority
// The buttonVariants function is likely created using 'cva' (class-variance-authority)
// which is a utility for creating type-safe CSS class variants. Think of it as a
// sophisticated way to manage different button styles (primary, secondary, sizes, etc.)

// THIS IS THE FUNCTION THAT NEEDS TO BE EXPORTED
// The 'export' keyword here makes buttonVariants available to other files
export const buttonVariants = cva(
  // Base classes that apply to all button variants - Project-map aligned with accessibility
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-heading font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 min-h-[44px] min-w-[44px]",
  {
    variants: {
      // Different visual styles for the button - Project-map specifications
      variant: {
        primary: "bg-primary-900 text-neutral-0 hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/25 hover:-translate-y-0.5 focus:ring-primary-500 shadow-md",
        secondary: "bg-primary-500 text-neutral-900 hover:bg-primary-400 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 focus:ring-primary-500 shadow-md",
        ghost: "text-primary-700 hover:bg-primary-50 hover:text-primary-800 focus:ring-primary-500 transition-colors",
        danger: "bg-error-500 text-neutral-0 hover:bg-error-700 hover:shadow-lg hover:shadow-error-500/25 hover:-translate-y-0.5 focus:ring-error-500 shadow-md",
        success: "bg-success-500 text-neutral-0 hover:bg-success-700 hover:shadow-lg hover:shadow-success-500/25 hover:-translate-y-0.5 focus:ring-success-500 shadow-md",
        outline: "border-2 border-primary-700 text-primary-700 hover:bg-primary-700 hover:text-neutral-0 hover:shadow-lg hover:shadow-primary-700/25 hover:-translate-y-0.5 focus:ring-primary-500 bg-transparent",
        link: "text-primary-700 underline-offset-4 hover:underline hover:text-primary-600 focus:ring-primary-500 bg-transparent shadow-none",
        // Keep default for backward compatibility
        default: "bg-primary-900 text-neutral-0 hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/25 hover:-translate-y-0.5 focus:ring-primary-500 shadow-md",
        destructive: "bg-error-500 text-neutral-0 hover:bg-error-700 hover:shadow-lg hover:shadow-error-500/25 hover:-translate-y-0.5 focus:ring-error-500 shadow-md",
        warning: "bg-warning-500 text-neutral-900 hover:bg-warning-700 hover:text-neutral-0 hover:shadow-lg hover:shadow-warning-500/25 hover:-translate-y-0.5 focus:ring-warning-500 shadow-md",
      },
      // Different sizes for the button - Project-map aligned
      size: {
        sm: "px-3 py-2 text-sm h-9 min-w-[2.25rem]",
        md: "px-4 py-2.5 text-base h-11 min-w-[2.75rem]",
        lg: "px-6 py-3 text-lg h-12 min-w-[3rem]",
        xl: "px-8 py-4 text-xl h-14 min-w-[3.5rem]",
        icon: "h-11 w-11 p-0 min-w-[2.75rem]",
        // Keep default for backward compatibility
        default: "px-4 py-2.5 text-base h-11 min-w-[2.75rem]",
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
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  ariaLabel?: string
  ariaDescribedBy?: string
}

// EDUCATIONAL CONCEPT #3: The Polymorphic Component Pattern
// The 'asChild' prop allows this button to render as different elements
// while maintaining the same styling and behavior. It's like having a chameleon
// component that can adapt to different contexts while keeping its core identity.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    ariaLabel,
    ariaDescribedBy,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Handle loading or disabled state
    const isDisabled = disabled || loading
    
    // Generate unique ID for ARIA
    const buttonId = React.useId()
    
    // Determine button content with accessibility features
    const buttonContent = React.useMemo(() => {
      if (loading) {
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || 'Loading...'}</span>
          </div>
        )
      }

      if (icon && children) {
        return (
          <div className={cn(
            "flex items-center gap-2",
            iconPosition === "right" && "flex-row-reverse"
          )}>
            <span aria-hidden="true">{icon}</span>
            <span>{children}</span>
          </div>
        )
      }

      if (icon && !children) {
        return (
          <>
            <span aria-hidden="true">{icon}</span>
            <span className="sr-only">{ariaLabel || 'Button'}</span>
          </>
        )
      }

      return children
    }, [loading, loadingText, icon, children, iconPosition, ariaLabel])

    // Enhanced ARIA attributes
    const ariaAttributes = React.useMemo(() => {
      return {
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        'aria-disabled': isDisabled,
        'aria-busy': loading
      }
    }, [ariaLabel, ariaDescribedBy, isDisabled, loading])
    
    return (
      <Comp
        ref={ref}
        id={buttonId}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        {...ariaAttributes}
        {...props}
      >
        {buttonContent}
      </Comp>
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