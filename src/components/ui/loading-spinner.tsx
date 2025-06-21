import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'neutral' | 'white';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const colorClasses = {
  primary: 'border-primary-500',
  neutral: 'border-neutral-500',
  white: 'border-white'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading...'
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-transparent border-t-current',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-600 font-primary">{message}</p>
      </div>
    </div>
  );
};

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  message = 'Loading...', 
  size = 'sm' 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span className="text-neutral-600 text-sm">{message}</span>
    </div>
  );
};