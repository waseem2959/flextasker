/**
 * Button Component Types
 * 
 * This file defines TypeScript interfaces and types for button components,
 * ensuring consistent styling and variants throughout the application.
 */

import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button variants using class-variance-authority for consistent styling
 * with proper TypeScript typing for all variant combinations.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Type for button variants to ensure type safety when using the component
 */
export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

/**
 * Button sizes
 */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * Button variants
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * Button loading states
 */
export interface ButtonLoadingState {
  loading: boolean;
  loadingText?: string;
  spinner?: boolean;
}

/**
 * Button icon configuration
 */
export interface ButtonIconConfig {
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  iconSize?: 'sm' | 'md' | 'lg';
}

/**
 * Complete button props interface
 */
export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps,
    ButtonLoadingState,
    ButtonIconConfig {
  asChild?: boolean;
  fullWidth?: boolean;
}

/**
 * Icon button specific props
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ComponentType<any>;
  'aria-label': string;
  tooltip?: string;
}

/**
 * Button group props
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Toggle button props
 */
export interface ToggleButtonProps extends Omit<ButtonProps, 'variant'> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: 'default' | 'outline';
}

/**
 * Split button props
 */
export interface SplitButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onDropdownClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  dropdownItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
    disabled?: boolean;
  }>;
}

/**
 * Floating action button props
 */
export interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  extended?: boolean;
  tooltip?: string;
}
