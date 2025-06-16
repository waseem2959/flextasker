/**
 * Progress Indicator Component
 * 
 * Multi-step progress indicator aligned with project-map specifications.
 * Features enhanced visual feedback and accessibility support.
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import React from 'react';

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

  // Extract step circle styling logic
  const getStepCircleClasses = () => {
    const baseClasses = "relative z-10 flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300";
    const sizeClasses = variant === 'compact' ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";

    let stateClasses = "";
    if (step.isCompleted) {
      stateClasses = "bg-primary-300 border-primary-300 text-neutral-900";
    } else if (step.isActive) {
      stateClasses = "bg-primary-500 border-primary-500 text-white scale-110 shadow-lg shadow-primary-500/25";
    } else {
      stateClasses = "bg-neutral-200 border-neutral-300 text-neutral-600";
    }

    let interactionClasses = "";
    if (step.isDisabled) {
      interactionClasses = "opacity-50 cursor-not-allowed";
    } else if (isClickable && !step.isActive) {
      interactionClasses = "cursor-pointer hover:scale-105";
    }

    return cn(baseClasses, sizeClasses, stateClasses, interactionClasses);
  };

  // Extract label styling logic
  const getLabelClasses = () => {
    const baseClasses = "font-medium transition-colors duration-200";
    const sizeClasses = variant === 'compact' ? "text-sm" : "text-base";

    let colorClasses = "";
    if (step.isActive) {
      colorClasses = "text-primary-700";
    } else if (step.isCompleted) {
      colorClasses = "text-neutral-900";
    } else {
      colorClasses = "text-neutral-600";
    }

    return cn(baseClasses, sizeClasses, colorClasses);
  };

  // Extract connecting line styling
  const getConnectingLineStyle = () => {
    const leftOffset = variant === 'compact' ? '32px' : '40px';
    const rightOffset = variant === 'compact' ? '-32px' : '-40px';

    return {
      left: leftOffset,
      right: showLabels ? 'auto' : rightOffset,
      width: showLabels ? 'calc(100% - 40px)' : undefined,
    };
  };

  // Handle click events with keyboard support
  const handleClick = () => {
    if (isClickable) {
      onStepClick(index);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onStepClick(index);
    }
  };

  return (
    <div className="flex items-center relative">
      {/* Step circle - using proper button element for accessibility */}
      {isClickable ? (
        <button
          type="button"
          className={getStepCircleClasses()}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={`Step ${index + 1}: ${step.title}`}
          disabled={step.isDisabled}
        >
          {step.isCompleted ? (
            <Check className={cn("text-current", variant === 'compact' ? "w-4 h-4" : "w-5 h-5")} />
          ) : (
            <span>{index + 1}</span>
          )}
        </button>
      ) : (
        <div
          className={getStepCircleClasses()}
          aria-label={`Step ${index + 1}: ${step.title}`}
        >
          {step.isCompleted ? (
            <Check className={cn("text-current", variant === 'compact' ? "w-4 h-4" : "w-5 h-5")} />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      )}

      {/* Step labels */}
      {showLabels && (
        <div className="ml-3 flex-1 min-w-0">
          <div className={getLabelClasses()}>
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
            step.isCompleted && "bg-primary-300"
          )}
          style={getConnectingLineStyle()}
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
    <div className={cn("w-full", className)}>
      {/* Hidden progress element for screen readers */}
      <progress
        className="sr-only"
        value={currentStep + 1}
        max={steps.length}
        aria-label={`Progress: Step ${currentStep + 1} of ${steps.length}`}
      >
        {Math.round(((currentStep + 1) / steps.length) * 100)}%
      </progress>

      {/* Visual progress indicator */}
      <div
        className={cn(
          "w-full",
          showLabels ? "space-y-4" : "flex items-center justify-between"
        )}
        aria-hidden="true"
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
