import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';
import { Skeleton } from './skeleton';

// Basic spinner component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-border border-t-primary-600',
        sizeClasses[size],
        className
      )}
    />
  );
};



// Page loading component
interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] space-y-4', className)}>
      <Spinner size="lg" />
      <p className="text-text-secondary font-medium">{message}</p>
    </div>
  );
};

// Card skeleton for loading cards
export const CardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

// Task card skeleton
export const TaskCardSkeleton: React.FC = () => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
};

// Bid card skeleton
export const BidCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 py-3 mb-4">
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

// List loading component
interface ListLoadingProps {
  count?: number;
  itemComponent?: React.ComponentType;
  className?: string;
}

export const ListLoading: React.FC<ListLoadingProps> = ({ 
  count = 3, 
  itemComponent: ItemComponent = CardSkeleton,
  className 
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <ItemComponent key={index} />
      ))}
    </div>
  );
};

// Animated loading dots
export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Button loading state
interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  children,
  isLoading = false,
  loadingText,
  className
}) => {
  if (isLoading) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Spinner size="sm" />
        <span>{loadingText || 'Loading...'}</span>
      </div>
    );
  }

  return <>{children}</>;
};

// Full page loading overlay
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  className
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
        className
      )}
    >
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-text-secondary font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

// Progress bar component
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = false
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        {showPercentage && (
          <span className="text-sm text-text-secondary">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-surface rounded-full h-2">
        <motion.div
          className="bg-primary-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
