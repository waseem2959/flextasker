import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[hsl(215,16%,80%)] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-[hsl(220,14%,46%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(196,80%,43%)] focus-visible:border-[hsl(196,80%,43%)] focus-visible:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
