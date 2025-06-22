/**
 * Memoized Components
 * 
 * Optimized components with React.memo to prevent unnecessary re-renders
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '../../../shared/types/common/enums';

// Memoized user avatar component
export interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MemoizedUserAvatar = React.memo<UserAvatarProps>(({ 
  firstName, 
  lastName, 
  avatar, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base', 
    lg: 'h-16 w-16 text-lg'
  };

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}>
      {avatar ? (
        <img src={avatar} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-gray-600">{initials}</span>
      )}
    </div>
  );
});

MemoizedUserAvatar.displayName = 'MemoizedUserAvatar';

// Memoized role badge component
export interface RoleBadgeProps {
  role: UserRole;
  variant?: 'default' | 'outline' | 'secondary';
}

export const MemoizedRoleBadge = React.memo<RoleBadgeProps>(({ role, variant = 'default' }) => {
  const getBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case UserRole.TASKER:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case UserRole.USER:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.TASKER:
        return 'Tasker';
      case UserRole.USER:
        return 'User';
      default:
        return 'Unknown';
    }
  };

  return (
    <Badge className={getBadgeColor(role)} variant={variant}>
      {getRoleLabel(role)}
    </Badge>
  );
});

MemoizedRoleBadge.displayName = 'MemoizedRoleBadge';

// Memoized status badge component
export interface StatusBadgeProps {
  status: string;
  isActive?: boolean;
}

export const MemoizedStatusBadge = React.memo<StatusBadgeProps>(({ status, isActive }) => {
  const getStatusColor = (status: string, isActive?: boolean) => {
    if (typeof isActive === 'boolean') {
      return isActive 
        ? 'bg-green-100 text-green-800 hover:bg-green-200'
        : 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'inactive':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const displayStatus = typeof isActive === 'boolean' && status === 'status'
    ? (isActive ? 'Active' : 'Inactive')
    : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge className={getStatusColor(status, isActive)}>
      {displayStatus}
    </Badge>
  );
});

MemoizedStatusBadge.displayName = 'MemoizedStatusBadge';

// Memoized date display component
export interface FormattedDateProps {
  date: string | Date;
  format?: 'short' | 'long' | 'relative';
  className?: string;
}

export const MemoizedFormattedDate = React.memo<FormattedDateProps>(({ 
  date, 
  format = 'short',
  className = ''
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      switch (format) {
        case 'long':
          return dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'relative':
          // Simple relative formatting
          const now = new Date();
          const diffMs = now.getTime() - dateObj.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) return 'today';
          if (diffDays === 1) return '1 day ago';
          if (diffDays > 1) return `${diffDays} days ago`;
          if (diffDays === -1) return 'in 1 day';
          return `in ${Math.abs(diffDays)} days`;
        default:
          return dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
      }
    } catch {
      return 'Invalid date';
    }
  }, [date, format]);

  return <span className={className}>{formattedDate}</span>;
});

MemoizedFormattedDate.displayName = 'MemoizedFormattedDate';

// Memoized loading spinner component
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const MemoizedLoadingSpinner = React.memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-primary ${className}`} 
        role="status"
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
});

MemoizedLoadingSpinner.displayName = 'MemoizedLoadingSpinner';

// Memoized stats card component
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const MemoizedStatsCard = React.memo<StatsCardProps>(({ 
  title, 
  value, 
  icon, 
  trend,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
});

MemoizedStatsCard.displayName = 'MemoizedStatsCard';

// Memoized action button group
export interface ActionButtonsProps {
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary';
    disabled?: boolean;
  }>;
  className?: string;
}

export const MemoizedActionButtons = React.memo<ActionButtonsProps>(({ actions, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {actions.map((action, index) => (
        <Button
          key={`${action.label}-${index}`}
          size="sm"
          variant={action.variant || 'outline'}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
});

MemoizedActionButtons.displayName = 'MemoizedActionButtons';

// Memoized empty state component
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const MemoizedEmptyState = React.memo<EmptyStateProps>(({ 
  icon, 
  title, 
  description, 
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
});

MemoizedEmptyState.displayName = 'MemoizedEmptyState';