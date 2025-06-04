import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/utils/ui-utils"

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
})

// Item component works for both single and multiple toggle groups
const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  const contextValue = React.useMemo(
    () => ({
      variant: context.variant ?? "default",
      size: context.size ?? "default",
    }),
    [context.variant, context.size]
  )

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants(contextValue), className)}
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
  HTMLDivElement,
  ToggleGroupSingleProps
>(({ className, variant, size, children, ...props }, ref) => {
  const contextValue = React.useMemo(
    () => ({
      variant: variant ?? "default",
      size: size ?? "default",
    }),
    [variant, size]
  )

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})
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
  HTMLDivElement,
  ToggleGroupMultipleProps
>(({ className, variant, size, children, ...props }, ref) => {
  const contextValue = React.useMemo(
    () => ({
      variant: variant ?? "default",
      size: size ?? "default",
    }),
    [variant, size]
  )

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("flex items-center justify-center gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})
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
const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (props, ref) => {
    if (isMultipleToggleProps(props)) {
      return <ToggleGroupMultiple ref={ref} {...props} />
    }
    return <ToggleGroupSingle ref={ref} {...props} />
  }
)
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

export { ToggleGroup, ToggleGroupItem, ToggleGroupMultiple, ToggleGroupSingle }

