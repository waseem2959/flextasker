/**
 * Skeleton Loader Components
 * 
 * Comprehensive skeleton loading states for better perceived performance
 * and improved user experience during data fetching.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

// Base skeleton component
const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animate = true 
}) => {
  return (
    <div
      className={cn(
        'bg-neutral-200 dark:bg-neutral-700 rounded-md',
        animate && 'animate-pulse',
        className
      )}
    />
  );
};

// Card skeleton for task cards
const TaskCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 space-y-4', className)}>
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>

    {/* Content */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>

    {/* Tags */}
    <div className="flex space-x-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-600">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

// List skeleton for task lists
const TaskListSkeleton: React.FC<{ 
  count?: number; 
  className?: string;
}> = ({ 
  count = 6, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }, (_, i) => (
      <TaskCardSkeleton key={i} />
    ))}
  </div>
);

// Profile skeleton
const ProfileSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex items-start space-x-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-18" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="text-center space-y-1">
          <Skeleton className="h-8 w-12 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
      ))}
    </div>

    {/* Bio */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Table skeleton
const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} className="h-6 w-24" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton
            key={colIndex}
            className={cn(
              'h-4',
              colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-20' : 'w-24'
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

// Chart skeleton
const ChartSkeleton: React.FC<{ 
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
}> = ({ 
  type = 'bar', 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {/* Title */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-20" />
    </div>

    {/* Chart area */}
    <div className="h-64 relative">
      {type === 'bar' && (
        <div className="flex items-end justify-between h-full space-x-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ height: `${Math.random() * 80 + 20}%` }}>
              <Skeleton
                className="w-8 h-full"
              />
            </div>
          ))}
        </div>
      )}

      {type === 'line' && (
        <div className="h-full relative">
          <Skeleton className="absolute inset-0 rounded-lg" />
          <div className="absolute inset-4 flex items-end">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div style={{ marginBottom: `${Math.random() * 60}%` }}>
                  <Skeleton
                    className="w-2 h-2 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'pie' && (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="w-48 h-48 rounded-full" />
        </div>
      )}

      {type === 'area' && (
        <div className="h-full relative overflow-hidden">
          <Skeleton className="absolute inset-0 rounded-lg" />
        </div>
      )}
    </div>

    {/* Legend */}
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Form skeleton
const FormSkeleton: React.FC<{
  fields?: number;
  hasSubmit?: boolean;
  className?: string;
}> = ({ 
  fields = 5, 
  hasSubmit = true, 
  className 
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        {Math.random() > 0.7 && (
          <Skeleton className="h-3 w-64" />
        )}
      </div>
    ))}
    
    {hasSubmit && (
      <div className="flex space-x-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    )}
  </div>
);

// Dashboard skeleton
const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Content grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <ChartSkeleton type="bar" />
      </div>
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <ChartSkeleton type="line" />
      </div>
    </div>

    {/* Table */}
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  </div>
);

// Message/Chat skeleton
const MessageSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ 
  count = 5, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }, (_, i) => {
      const isOwn = Math.random() > 0.5;
      return (
        <div
          key={i}
          className={cn(
            'flex space-x-3',
            isOwn ? 'flex-row-reverse space-x-reverse' : ''
          )}
        >
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className={cn('flex-1 space-y-1', isOwn ? 'text-right' : '')}>
            <div className={cn('flex items-center space-x-2', isOwn ? 'justify-end' : '')}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton 
              className={cn(
                'h-4',
                isOwn ? 'ml-auto' : 'mr-auto',
                Math.random() > 0.5 ? 'w-3/4' : 'w-1/2'
              )} 
            />
            {Math.random() > 0.7 && (
              <Skeleton 
                className={cn(
                  'h-4 w-2/3',
                  isOwn ? 'ml-auto' : 'mr-auto'
                )} 
              />
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// Activity feed skeleton
const ActivitySkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ 
  count = 6, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex space-x-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-5/6" />
          {Math.random() > 0.6 && (
            <Skeleton className="h-3 w-24" />
          )}
        </div>
      </div>
    ))}
  </div>
);

// Notification skeleton
const NotificationSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ 
  count = 4, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-start space-x-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
);

// Search results skeleton
const SearchResultsSkeleton: React.FC<{
  showFilters?: boolean;
  className?: string;
}> = ({ 
  showFilters = true, 
  className 
}) => (
  <div className={cn('space-y-6', className)}>
    {/* Search header */}
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      {showFilters && (
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-18" />
        </div>
      )}
    </div>

    {/* Results count */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>

    {/* Results */}
    <TaskListSkeleton count={8} />

    {/* Pagination */}
    <div className="flex items-center justify-center space-x-2">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  </div>
);

export {
  Skeleton,
  TaskCardSkeleton,
  TaskListSkeleton,
  ProfileSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  MessageSkeleton,
  ActivitySkeleton,
  NotificationSkeleton,
  SearchResultsSkeleton
};

export default Skeleton;