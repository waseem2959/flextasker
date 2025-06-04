import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

// EDUCATIONAL IMPROVEMENT #1: Modern Ref Type Extraction
// Instead of using the deprecated ElementRef, we now use React.ComponentRef
// This is more direct and aligns with modern React patterns
const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-[hsl(215,16%,80%)] font-primary", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

// EDUCATIONAL IMPROVEMENT #2: Understanding the Conceptual Difference
// React.ComponentRef<typeof Component> is more semantically clear than ElementRef
// It directly asks: "What ref type does this component expect?"
// Rather than: "What element does this component ultimately render?"
const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium text-[hsl(206,33%,16%)] transition-all hover:text-[hsl(196,80%,43%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(196,80%,43%)] focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-[hsl(220,14%,46%)] transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

// EDUCATIONAL IMPROVEMENT #3: Consistent Modern Pattern
// Notice how we apply the same pattern across all components
// This consistency makes the codebase easier to understand and maintain
const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-[hsl(220,14%,46%)] font-primary transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0 font-primary", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
