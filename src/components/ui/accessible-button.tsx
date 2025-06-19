/**
 * Accessible Button Component
 * 
 * Enhanced button component with comprehensive accessibility features:
 * - Proper ARIA attributes and states
 * - Loading and disabled state management
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Icon and text content handling
 * - Focus management
 */

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccessibilityHelper } from "../accessibility/accessibility-provider";
import { i18nService } from "../../../shared/services/i18n-service";

// Enhanced button variants with accessibility considerations
const accessibleButtonVariants = cva(
  // Base classes with improved focus indicators and touch targets
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-heading font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]",
  {
    variants: {
      variant: {
        primary: "bg-primary-900 text-neutral-0 hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/25 focus:ring-primary-500 shadow-md",
        secondary: "bg-primary-500 text-neutral-900 hover:bg-primary-400 hover:shadow-lg hover:shadow-primary-500/25 focus:ring-primary-500 shadow-md",
        ghost: "text-primary-700 hover:bg-primary-50 hover:text-primary-800 focus:ring-primary-500 transition-colors",
        danger: "bg-error-500 text-neutral-0 hover:bg-error-700 hover:shadow-lg hover:shadow-error-500/25 focus:ring-error-500 shadow-md",
        success: "bg-success-500 text-neutral-0 hover:bg-success-700 hover:shadow-lg hover:shadow-success-500/25 focus:ring-success-500 shadow-md",
        outline: "border-2 border-primary-700 text-primary-700 hover:bg-primary-700 hover:text-neutral-0 hover:shadow-lg hover:shadow-primary-700/25 focus:ring-primary-500 bg-transparent",
        link: "text-primary-700 underline-offset-4 hover:underline hover:text-primary-600 focus:ring-primary-500 bg-transparent shadow-none min-h-auto min-w-auto",
        default: "bg-primary-900 text-neutral-0 hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-900/25 focus:ring-primary-500 shadow-md"
      },
      size: {
        sm: "px-3 py-2 text-sm h-9",
        md: "px-4 py-2 text-sm h-10",
        lg: "px-6 py-3 text-base h-12",
        xl: "px-8 py-4 text-lg h-14",
        icon: "p-2 h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  ariaLabel?: string;
  ariaDescribedBy?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false,
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    ariaLabel,
    ariaDescribedBy,
    confirmAction = false,
    confirmMessage,
    disabled,
    children,
    onClick,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { settings, createButtonAria, announce } = useAccessibilityHelper();
    const [isConfirming, setIsConfirming] = React.useState(false);
    
    // Handle loading or disabled state
    const isDisabled = disabled || loading;
    
    // Generate unique IDs for ARIA
    const buttonId = React.useId();
    
    // Handle click with confirmation if needed
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (confirmAction && !isConfirming) {
        event.preventDefault();
        setIsConfirming(true);
        
        const message = confirmMessage || i18nService.translate('common.confirmAction');
        const confirmed = window.confirm(message);
        
        if (confirmed && onClick) {
          onClick(event);
        }
        
        setIsConfirming(false);
        return;
      }
      
      if (onClick) {
        onClick(event);
      }
    }, [confirmAction, isConfirming, confirmMessage, onClick]);

    // Determine button content
    const buttonContent = React.useMemo(() => {
      if (loading) {
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || i18nService.translate('common.loading')}</span>
          </div>
        );
      }

      if (icon && children) {
        return (
          <div className={cn(
            "flex items-center gap-2",
            iconPosition === "right" && "flex-row-reverse",
            settings.isRTL && iconPosition === "left" && "flex-row-reverse",
            settings.isRTL && iconPosition === "right" && "flex-row"
          )}>
            <span aria-hidden="true">{icon}</span>
            <span>{children}</span>
          </div>
        );
      }

      if (icon && !children) {
        return (
          <>
            <span aria-hidden="true">{icon}</span>
            <span className="sr-only">{ariaLabel || i18nService.translate('common.button')}</span>
          </>
        );
      }

      return children;
    }, [loading, loadingText, icon, children, iconPosition, settings.isRTL, ariaLabel]);

    // Enhanced ARIA attributes using ARIA service
    const ariaAttributes = React.useMemo(() => {
      return createButtonAria({
        label: ariaLabel,
        describedBy: ariaDescribedBy,
        disabled: isDisabled,
        loading: loading,
        hasPopup: confirmAction
      });
    }, [createButtonAria, ariaLabel, ariaDescribedBy, isDisabled, loading, confirmAction]);

    return (
      <Comp
        ref={ref}
        id={buttonId}
        className={cn(
          accessibleButtonVariants({ variant, size }),
          // High contrast mode adjustments
          settings.highContrast && [
            "border-2 border-black",
            "focus:ring-4 focus:ring-blue-600"
          ],
          // Reduced motion adjustments
          settings.reducedMotion && "transition-none transform-none",
          // Font size scaling
          settings.fontSize === 'large' && "text-lg",
          settings.fontSize === 'extra-large' && "text-xl",
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...ariaAttributes}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

// Export variants for external use
export { accessibleButtonVariants };
export { AccessibleButton };
export default AccessibleButton;