/**
 * Accessible Input Component
 * 
 * Enhanced input component with comprehensive accessibility features:
 * - Proper ARIA labeling and descriptions
 * - Error state management
 * - Required field indication
 * - Help text association
 * - Screen reader support
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAccessibilityHelper } from "../accessibility/accessibility-provider";
import { i18nService } from "../../../shared/services/i18n-service";

export interface AccessibleInputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
  labelClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  containerClassName?: string;
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
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
    const { settings, createFormFieldAria } = useAccessibilityHelper();
    const inputId = id || React.useId();
    
    // Determine validation state
    const isInvalid = Boolean(error);
    const isRequired = Boolean(required);
    
    // Generate ARIA configuration using ARIA service
    const ariaConfig = React.useMemo(() => {
      if (!label) return null;
      
      return createFormFieldAria({
        id: inputId,
        label,
        error,
        helperText,
        required: isRequired,
        invalid: isInvalid
      });
    }, [createFormFieldAria, inputId, label, error, helperText, isRequired, isInvalid]);

    return (
      <div className={cn("w-full space-y-2", containerClassName)}>
        {/* Label */}
        {label && ariaConfig && (
          <label
            {...ariaConfig.label}
            className={cn(
              "block text-sm font-medium text-gray-700",
              settings.textDirection === "rtl" ? "text-right" : "text-left",
              settings.highContrast && "text-black font-semibold",
              labelClassName
            )}
          >
            {label}
            {isRequired && showRequiredIndicator && (
              <span 
                className={cn(
                  "text-red-500 ml-1",
                  settings.textDirection === "rtl" && "mr-1 ml-0"
                )}
                aria-label={i18nService.translate('form.required')}
              >
                *
              </span>
            )}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          {...(ariaConfig ? ariaConfig.input : { id: inputId })}
          className={cn(
            // Base styles
            "flex h-10 w-full rounded-lg border bg-white px-4 py-2 text-gray-900 transition-all duration-200",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm",
            
            // State-specific styles
            isInvalid 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              
            // High contrast mode
            settings.highContrast && [
              "border-2 border-black",
              "focus:border-blue-600 focus:ring-blue-600 focus:ring-4"
            ],
            
            // RTL support
            settings.textDirection === "rtl" && "text-right",
            
            // Font size scaling
            settings.fontSize === 'large' && "text-lg h-12",
            settings.fontSize === 'extra-large' && "text-xl h-14",
            
            className
          )}
          {...props}
        />

        {/* Helper Text */}
        {helperText && !error && ariaConfig?.helper && (
          <p
            {...ariaConfig.helper}
            className={cn(
              "text-sm text-gray-600",
              settings.textDirection === "rtl" ? "text-right" : "text-left",
              settings.highContrast && "text-gray-800 font-medium",
              helperClassName
            )}
            aria-live="polite"
          >
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {error && ariaConfig?.error && (
          <div
            {...ariaConfig.error}
            className={cn(
              "flex items-start space-x-2",
              settings.textDirection === "rtl" && "flex-row-reverse space-x-reverse",
              errorClassName
            )}
          >
            <span 
              className="text-red-500 text-sm mt-0.5" 
              aria-hidden="true"
            >
              ⚠
            </span>
            <p className={cn(
              "text-sm text-red-600",
              settings.textDirection === "rtl" ? "text-right" : "text-left",
              settings.highContrast && "text-red-800 font-medium"
            )}>
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

export { AccessibleInput };
export default AccessibleInput;