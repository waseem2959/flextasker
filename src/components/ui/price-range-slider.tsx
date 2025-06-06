/**
 * Price Range Slider Component
 * 
 * Enhanced price range slider with project-map teal-mint color system.
 * Features dual handles, currency formatting, and accessibility support.
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';

export interface PriceRange {
  min: number;
  max: number;
}

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  step?: number;
  currency?: string;
  className?: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  showLabels?: boolean;
  showTooltips?: boolean;
}

/**
 * Format currency value with proper locale formatting
 */
const defaultFormatValue = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Price Range Slider Component
 */
export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  currency = 'USD',
  className,
  disabled = false,
  formatValue = (val) => defaultFormatValue(val, currency),
  showLabels = true,
  showTooltips = true,
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [showMinTooltip, setShowMinTooltip] = useState(false);
  const [showMaxTooltip, setShowMaxTooltip] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Ensure values are within bounds
  const clampedValue = {
    min: Math.max(min, Math.min(value.min, value.max)),
    max: Math.min(max, Math.max(value.min, value.max)),
  };

  // Calculate percentages for positioning
  const minPercent = ((clampedValue.min - min) / (max - min)) * 100;
  const maxPercent = ((clampedValue.max - min) / (max - min)) * 100;

  // Handle mouse/touch events
  const handlePointerDown = useCallback((handle: 'min' | 'max') => (e: React.PointerEvent) => {
    if (disabled) return;
    
    setIsDragging(handle);
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = min + (percent / 100) * (max - min);
    const steppedValue = Math.round(newValue / step) * step;

    if (isDragging === 'min') {
      onChange({
        min: Math.min(steppedValue, clampedValue.max),
        max: clampedValue.max,
      });
    } else {
      onChange({
        min: clampedValue.min,
        max: Math.max(steppedValue, clampedValue.min),
      });
    }
  }, [isDragging, min, max, step, clampedValue, onChange, disabled]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
    if (disabled) return;

    let delta = 0;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        delta = step;
        break;
      case 'PageDown':
        delta = -step * 10;
        break;
      case 'PageUp':
        delta = step * 10;
        break;
      case 'Home':
        delta = handle === 'min' ? min - clampedValue.min : min - clampedValue.max;
        break;
      case 'End':
        delta = handle === 'min' ? max - clampedValue.min : max - clampedValue.max;
        break;
      default:
        return;
    }

    e.preventDefault();

    if (handle === 'min') {
      const newMin = Math.max(min, Math.min(clampedValue.max, clampedValue.min + delta));
      onChange({ min: newMin, max: clampedValue.max });
    } else {
      const newMax = Math.min(max, Math.max(clampedValue.min, clampedValue.max + delta));
      onChange({ min: clampedValue.min, max: newMax });
    }
  }, [disabled, step, min, max, clampedValue, onChange]);

  return (
    <div className={cn("price-range-slider w-full", className)}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-neutral-700 font-body">
            Price Range
          </div>
          <div className="text-sm text-neutral-600 font-body">
            {formatValue(clampedValue.min)} - {formatValue(clampedValue.max)}
          </div>
        </div>
      )}

      {/* Slider Container */}
      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className={cn(
            "relative h-2 bg-neutral-200 rounded-full cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Active Range */}
          <div
            className="absolute h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Min Handle */}
          <div
            className={cn(
              "absolute w-5 h-5 bg-white border-2 border-primary-600 rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              isDragging === 'min' && "cursor-grabbing scale-110 shadow-lg shadow-primary-600/25",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{
              left: `${minPercent}%`,
              top: '50%',
            }}
            onPointerDown={handlePointerDown('min')}
            onKeyDown={handleKeyDown('min')}
            onMouseEnter={() => setShowMinTooltip(true)}
            onMouseLeave={() => setShowMinTooltip(false)}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-label="Minimum price"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue.min}
          >
            {/* Min Tooltip */}
            {showTooltips && (showMinTooltip || isDragging === 'min') && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded font-medium whitespace-nowrap">
                {formatValue(clampedValue.min)}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-neutral-900" />
              </div>
            )}
          </div>

          {/* Max Handle */}
          <div
            className={cn(
              "absolute w-5 h-5 bg-white border-2 border-primary-600 rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              isDragging === 'max' && "cursor-grabbing scale-110 shadow-lg shadow-primary-600/25",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{
              left: `${maxPercent}%`,
              top: '50%',
            }}
            onPointerDown={handlePointerDown('max')}
            onKeyDown={handleKeyDown('max')}
            onMouseEnter={() => setShowMaxTooltip(true)}
            onMouseLeave={() => setShowMaxTooltip(false)}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-label="Maximum price"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue.max}
          >
            {/* Max Tooltip */}
            {showTooltips && (showMaxTooltip || isDragging === 'max') && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded font-medium whitespace-nowrap">
                {formatValue(clampedValue.max)}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-neutral-900" />
              </div>
            )}
          </div>
        </div>

        {/* Range Labels */}
        <div className="flex justify-between mt-2 text-xs text-neutral-500 font-body">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Price Range Slider for tight spaces
 */
export const CompactPriceRangeSlider: React.FC<Omit<PriceRangeSliderProps, 'showLabels' | 'showTooltips'>> = (props) => (
  <PriceRangeSlider {...props} showLabels={false} showTooltips={false} />
);

export default PriceRangeSlider;
