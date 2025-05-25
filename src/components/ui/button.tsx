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
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Different visual styles for the button
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Different sizes for the button
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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