import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-[hsl(206,33%,16%)]",
  {
    variants: {
      variant: {
        default: "bg-white text-[hsl(206,33%,16%)] border-[hsl(215,16%,80%)]",
        primary: "bg-[hsl(196,80%,95%)] text-[hsl(196,80%,43%)] border-[hsl(196,80%,43%)]/50 [&>svg]:text-[hsl(196,80%,43%)]",
        success: "bg-[hsl(142,72%,95%)] text-[hsl(142,72%,29%)] border-[hsl(142,72%,29%)]/50 [&>svg]:text-[hsl(142,72%,29%)]",
        warning: "bg-[hsl(38,92%,95%)] text-[hsl(38,92%,30%)] border-[hsl(38,92%,50%)]/50 [&>svg]:text-[hsl(38,92%,30%)]",
        destructive: "bg-[hsl(354,70%,95%)] text-[hsl(354,70%,54%)] border-[hsl(354,70%,54%)]/50 [&>svg]:text-[hsl(354,70%,54%)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight font-primary", className)}
    {...props}
  >
    {props.children}
  </h5>
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed font-primary", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
