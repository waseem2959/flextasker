import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  showRequiredIndicator?: boolean
  labelClassName?: string
  errorClassName?: string
  helperClassName?: string
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    required,
    showRequiredIndicator = true,
    labelClassName,
    errorClassName,
    helperClassName,
    containerClassName,
    id,
    type, 
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    
    // Determine validation state
    const isInvalid = Boolean(error)
    const isRequired = Boolean(required)
    
    // Generate unique IDs for ARIA relationships
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`
    
    // If no label, render just the input
    if (!label) {
      return (
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-neutral-900 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isInvalid && "border-red-300 focus:border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={isInvalid}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          required={isRequired}
          {...props}
        />
      )
    }
    
    return (
      <div className={cn("w-full space-y-2", containerClassName)}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium text-neutral-700",
            labelClassName
          )}
        >
          {label}
          {isRequired && showRequiredIndicator && (
            <span 
              className="text-red-500 ml-1"
              aria-label="Required field"
            >
              *
            </span>
          )}
        </label>

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-neutral-900 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            isInvalid 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-100",
            className
          )}
          aria-invalid={isInvalid}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={isRequired}
          required={isRequired}
          {...props}
        />

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={helperId}
            className={cn(
              "text-sm text-neutral-600",
              helperClassName
            )}
          >
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div
            id={errorId}
            className={cn(
              "flex items-start space-x-2",
              errorClassName
            )}
            role="alert"
            aria-live="polite"
          >
            <span 
              className="text-red-500 text-sm mt-0.5" 
              aria-hidden="true"
            >
              ⚠
            </span>
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
