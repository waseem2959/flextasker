/**
 * Component Template
 * 
 * This is a template for creating new React components following the
 * component architecture guidelines defined in COMPONENT-ARCHITECTURE.md.
 * 
 * Instructions:
 * 1. Copy this file and rename it to your component name (kebab-case)
 * 2. Replace "ComponentTemplate" with your component name (PascalCase)
 * 3. Update the props interface to match your component's needs
 * 4. Implement your component logic and JSX
 * 5. Add appropriate documentation
 * 6. Remove these instructions
 */

import React, { useRef } from 'react';

/**
 * Props for the ComponentTemplate component
 */
export interface ComponentTemplateProps {
  /**
   * Primary content or children to render
   */
  children?: React.ReactNode;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional variant for different visual styles
   * @default "default"
   */
  variant?: 'default' | 'primary' | 'secondary';
  
  /**
   * Optional size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
  
  /**
   * Optional ID for accessibility and testing
   */
  id?: string;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
  
  /**
   * Optional aria-label for accessibility
   */
  ariaLabel?: string;
}

/**
 * ComponentTemplate - A reusable UI component
 *
 * @example
 * // Basic usage
 * <ComponentTemplate>Content</ComponentTemplate>
 *
 * // With variant and size
 * <ComponentTemplate variant="primary" size="lg">
 *   Large Primary Component
 * </ComponentTemplate>
 *
 * // With custom class and disabled state
 * <ComponentTemplate 
 *   className="my-custom-class" 
 *   disabled={true}
 * >
 *   Disabled Component
 * </ComponentTemplate>
 */
export function ComponentTemplate({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  id,
  testId = 'component-template',
  ariaLabel
}: ComponentTemplateProps): React.ReactElement {
  // Hooks
  const componentRef = useRef<HTMLDivElement>(null);
  
// Event Handlers
  const handleClick = () => {
    if (disabled || !onClick) return;
    onClick();
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };
  
  // Computed Values
  const baseClasses = 'component-template rounded-md transition-colors';
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
    primary: 'bg-primary text-white',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  };
  const sizeClasses = {
    sm: 'text-sm p-2',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90 cursor-pointer';
  
  // Combined classes
  const componentClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className
  ].join(' ');
  
  // Accessibility attributes
  const a11yProps = {
    'aria-disabled': disabled,
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {})
  };
  
  return (
    <div
      ref={componentRef}
      id={id}
      className={componentClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? undefined : 0}
      role="button"
      data-testid={testId}
      {...a11yProps}
    >
      {children}
    </div>
  );
}

/**
 * A specialized version of ComponentTemplate with pre-configured props
 */
export function PrimaryComponentTemplate(props: Omit<ComponentTemplateProps, 'variant'>): React.ReactElement {
  return <ComponentTemplate {...props} variant="primary" />;
}

export default ComponentTemplate;
