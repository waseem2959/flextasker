import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-sm border border-[hsl(215,16%,80%)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(196,80%,43%)] focus-visible:ring-offset-2 transition-colors hover:border-[hsl(196,80%,43%)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[hsl(196,80%,43%)] data-[state=checked]:border-[hsl(196,80%,43%)] data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
