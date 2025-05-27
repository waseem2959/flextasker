import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { toggleVariants } from "@/lib/toggle-utils"
import { cn } from "@/lib/utils"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

// Item component works for both single and multiple toggle groups
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants({ ...context }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

// Type-safe single selection toggle group
type ToggleGroupSingleProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> & 
  VariantProps<typeof toggleVariants> & {
    type: "single"
    value?: string
    onValueChange?: (value: string) => void
  }

const ToggleGroupSingle = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupSingleProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))
ToggleGroupSingle.displayName = "ToggleGroupSingle"

// Type-safe multiple selection toggle group
type ToggleGroupMultipleProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> & 
  VariantProps<typeof toggleVariants> & {
    type: "multiple"
    value?: string[]
    onValueChange?: (value: string[]) => void
  }

const ToggleGroupMultiple = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupMultipleProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))
ToggleGroupMultiple.displayName = "ToggleGroupMultiple"

// For backward compatibility, we export a combined type
// Using a discriminated union for better type safety
type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps

/**
 * Type guard to check if props are for a multiple selection toggle group
 * This improves type safety when handling props in the component
 */
function isMultipleToggleProps(props: ToggleGroupProps): props is ToggleGroupMultipleProps {
  return props.type === "multiple"
}

// The main ToggleGroup component that accepts either single or multiple mode props
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>((props, ref) => {
  // Using type guard for safer handling of discriminated union
  if (isMultipleToggleProps(props)) {
    return <ToggleGroupMultiple ref={ref} {...props} />
  }
  
  return <ToggleGroupSingle ref={ref} {...props} />
})
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

export { ToggleGroup, ToggleGroupItem, ToggleGroupMultiple, ToggleGroupSingle }
