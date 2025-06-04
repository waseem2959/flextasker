import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface EmptyStateProps {
  readonly icon?: ReactNode
  readonly title: string
  readonly description: string
  readonly actionLabel?: string
  readonly onAction?: () => void
  readonly className?: string
  readonly variant?: "default" | "compact"
}

/**
 * EmptyState component for displaying when no data is available
 * Follows the design guide with consistent colors and spacing
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = "default"
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-[hsl(215,16%,90%)] bg-white p-8 text-center",
      variant === "compact" ? "p-4" : "p-8",
      className
    )}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(196,80%,95%)] text-[hsl(196,80%,43%)]">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-medium text-[hsl(206,33%,16%)]">{title}</h3>
      <p className="mb-6 text-sm text-[hsl(220,14%,46%)] max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
