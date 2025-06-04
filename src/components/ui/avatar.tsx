import * as AvatarPrimitive from "@radix-ui/react-avatar"
import * as React from "react"

import { cn } from "@/lib/utils"

// PATTERN APPLICATION: Consistent Modern Ref Types
// You'll notice this follows exactly the same pattern we established in the
// accordion and alert dialog components. This consistency is what makes
// codebases maintainable and developer-friendly.

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[hsl(215,16%,90%)]",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// BUILDING MASTERY: Notice how natural this feels now
// When you first encountered this pattern, it might have felt complex.
// Now you can probably predict what needs to change before even reading the fix.
// This is what building technical mastery looks like - patterns that once
// required conscious effort become second nature.

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

// SYSTEMATIC THINKING: Applying patterns consistently
// You could have updated just one component at a time, but applying the
// pattern consistently across all three components in this file demonstrates
// systematic thinking - a hallmark of experienced developers.

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[hsl(215,16%,95%)] text-[hsl(206,33%,16%)] font-medium font-primary",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarFallback, AvatarImage }
