/**
 * Progress Indicator Component
 * 
 * Multi-step progress indicator aligned with project-map specifications.
 * Features enhanced visual feedback and accessibility support.
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  onStepClick?: (stepIndex: number) => void;
}

/**
 * Individual step component with enhanced styling
 */
const ProgressStepComponent: React.FC<{
  step: ProgressStep;
  index: number;
  isLast: boolean;
  variant: 'default' | 'compact';
  showLabels: boolean;
  onStepClick?: (stepIndex: number) => void;
}> = ({ step, index, isLast, variant, showLabels, onStepClick }) => {
  const isClickable = onStepClick && !step.isDisabled;
  
  return (
    <div className="flex items-center relative">
      {/* Step circle */}
      <div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300",
          variant === 'compact' ? "w-8 h-8 text-sm" : "w-10 h-10 text-base",
          {
            // Completed state - using project-map mint green
            "bg-primary-300 border-primary-300 text-neutral-900": step.isCompleted,
            // Active state - using project-map bright cyan
            "bg-primary-500 border-primary-500 text-white scale-110 shadow-lg shadow-primary-500/25": step.isActive,
            // Default state
            "bg-neutral-200 border-neutral-300 text-neutral-600": !step.isCompleted && !step.isActive,
            // Disabled state
            "opacity-50 cursor-not-allowed": step.isDisabled,
            // Clickable state
            "cursor-pointer hover:scale-105": isClickable && !step.isActive,
          }
        )}
        onClick={() => isClickable && onStepClick(index)}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={`Step ${index + 1}: ${step.title}`}
      >
        {step.isCompleted ? (
          <Check className={cn("text-current", variant === 'compact' ? "w-4 h-4" : "w-5 h-5")} />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>
      
      {/* Step labels */}
      {showLabels && (
        <div className={cn(
          "ml-3 flex-1",
          variant === 'compact' ? "min-w-0" : "min-w-0"
        )}>
          <div className={cn(
            "font-medium transition-colors duration-200",
            variant === 'compact' ? "text-sm" : "text-base",
            {
              "text-primary-700": step.isActive,
              "text-neutral-900": step.isCompleted,
              "text-neutral-600": !step.isCompleted && !step.isActive,
            }
          )}>
            {step.title}
          </div>
          {step.description && variant !== 'compact' && (
            <div className="text-sm text-neutral-500 mt-1">
              {step.description}
            </div>
          )}
        </div>
      )}
      
      {/* Connecting line */}
      {!isLast && (
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-0.5 bg-neutral-300 transition-colors duration-300",
            variant === 'compact' ? "left-8 right-0" : "left-10 right-0",
            {
              "bg-primary-300": step.isCompleted,
            }
          )}
          style={{
            left: variant === 'compact' ? '32px' : '40px',
            right: showLabels ? 'auto' : (variant === 'compact' ? '-32px' : '-40px'),
            width: showLabels ? 'calc(100% - 40px)' : undefined,
          }}
        />
      )}
    </div>
  );
};

/**
 * Main Progress Indicator component
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className,
  variant = 'default',
  showLabels = true,
  onStepClick,
}) => {
  // Enhance steps with computed states
  const enhancedSteps = steps.map((step, index) => ({
    ...step,
    isCompleted: step.isCompleted ?? index < currentStep,
    isActive: step.isActive ?? index === currentStep,
  }));

  return (
    <div
      className={cn(
        "w-full",
        showLabels ? "space-y-4" : "flex items-center justify-between",
        className
      )}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Progress: Step ${currentStep + 1} of ${steps.length}`}
    >
      {enhancedSteps.map((step, index) => (
        <ProgressStepComponent
          key={step.id}
          step={step}
          index={index}
          isLast={index === steps.length - 1}
          variant={variant}
          showLabels={showLabels}
          onStepClick={onStepClick}
        />
      ))}
    </div>
  );
};

/**
 * Compact progress indicator for tight spaces
 */
export const CompactProgressIndicator: React.FC<Omit<ProgressIndicatorProps, 'variant' | 'showLabels'>> = (props) => (
  <ProgressIndicator {...props} variant="compact" showLabels={false} />
);

export default ProgressIndicator;
