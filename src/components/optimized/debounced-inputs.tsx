/**
 * Debounced Input Components
 * 
 * Optimized input components with debouncing to prevent excessive API calls
 * and state updates during user typing
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Debounce utility hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Debounced search input props
export interface DebouncedSearchInputProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// Optimized debounced search input
export const DebouncedSearchInput = React.memo<DebouncedSearchInputProps>(({
  value = '',
  onSearch,
  placeholder = 'Search...',
  delay = 300,
  className = '',
  showClearButton = true,
  disabled = false,
  loading = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, delay);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch(localValue);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  }, [localValue, onSearch, handleClear]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-gray-400`} />
      </div>
      
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-10"
      />
      
      {showClearButton && localValue && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-4 w-4 p-0 hover:bg-transparent"
            disabled={disabled}
          >
            <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </Button>
        </div>
      )}
    </div>
  );
});

DebouncedSearchInput.displayName = 'DebouncedSearchInput';

// Debounced text input props
export interface DebouncedTextInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url';
  maxLength?: number;
  showCharCount?: boolean;
}

// Optimized debounced text input
export const DebouncedTextInput = React.memo<DebouncedTextInputProps>(({
  value = '',
  onChange,
  placeholder = '',
  delay = 300,
  className = '',
  disabled = false,
  type = 'text',
  maxLength,
  showCharCount = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, delay);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!maxLength || newValue.length <= maxLength) {
      setLocalValue(newValue);
    }
  }, [maxLength]);

  const charCountDisplay = useMemo(() => {
    if (!showCharCount) return null;
    
    const currentLength = localValue.length;
    const isNearLimit = maxLength && currentLength > maxLength * 0.8;
    
    return (
      <div className={`text-xs mt-1 ${isNearLimit ? 'text-orange-600' : 'text-gray-500'}`}>
        {maxLength ? `${currentLength}/${maxLength}` : `${currentLength} characters`}
      </div>
    );
  }, [localValue.length, maxLength, showCharCount]);

  return (
    <div className={className}>
      <Input
        type={type}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
      {charCountDisplay}
    </div>
  );
});

DebouncedTextInput.displayName = 'DebouncedTextInput';

// Debounced textarea props
export interface DebouncedTextareaProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
}

// Optimized debounced textarea
export const DebouncedTextarea = React.memo<DebouncedTextareaProps>(({
  value = '',
  onChange,
  placeholder = '',
  delay = 500, // Slightly longer delay for textarea
  className = '',
  disabled = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  autoResize = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, delay);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localValue, autoResize]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (!maxLength || newValue.length <= maxLength) {
      setLocalValue(newValue);
    }
  }, [maxLength]);

  const charCountDisplay = useMemo(() => {
    if (!showCharCount) return null;
    
    const currentLength = localValue.length;
    const isNearLimit = maxLength && currentLength > maxLength * 0.8;
    const isOverLimit = maxLength && currentLength >= maxLength;
    
    return (
      <div className={`text-xs mt-1 ${
        isOverLimit ? 'text-red-600' : 
        isNearLimit ? 'text-orange-600' : 
        'text-gray-500'
      }`}>
        {maxLength ? `${currentLength}/${maxLength}` : `${currentLength} characters`}
      </div>
    );
  }, [localValue.length, maxLength, showCharCount]);

  return (
    <div className={className}>
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={autoResize ? undefined : rows}
        maxLength={maxLength}
        style={autoResize ? { resize: 'none', overflow: 'hidden' } : undefined}
      />
      {charCountDisplay}
    </div>
  );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';

// Debounced number input props
export interface DebouncedNumberInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number; // Number of decimal places
}

// Optimized debounced number input
export const DebouncedNumberInput = React.memo<DebouncedNumberInputProps>(({
  value,
  onChange,
  placeholder = '',
  delay = 300,
  className = '',
  disabled = false,
  min,
  max,
  step,
  precision = 2
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const debouncedValue = useDebounce(localValue, delay);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  // Trigger onChange when debounced value changes
  useEffect(() => {
    const numericValue = localValue === '' ? undefined : parseFloat(localValue);
    
    // Only trigger if the numeric value is different
    if (numericValue !== value) {
      onChange(numericValue);
    }
  }, [debouncedValue, onChange, value, localValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Allow empty string
    if (newValue === '') {
      setLocalValue('');
      return;
    }
    
    // Validate numeric input
    const numericValue = parseFloat(newValue);
    if (isNaN(numericValue)) return;
    
    // Apply min/max constraints
    if (min !== undefined && numericValue < min) return;
    if (max !== undefined && numericValue > max) return;
    
    // Apply precision
    if (precision !== undefined && newValue.includes('.')) {
      const decimalPart = newValue.split('.')[1];
      if (decimalPart && decimalPart.length > precision) return;
    }
    
    setLocalValue(newValue);
  }, [min, max, precision]);

  return (
    <Input
      type="number"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={className}
    />
  );
});

DebouncedNumberInput.displayName = 'DebouncedNumberInput';