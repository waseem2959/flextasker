/**
 * Presence Indicator Component
 * 
 * Shows user online status, activity indicators, and real-time presence
 * information with smooth animations and responsive design.
 */

import React, { useState, useEffect } from 'react';
import { Circle, Clock, Phone, Video, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date | string;
  platform: 'desktop' | 'mobile' | 'tablet';
  currentRoom?: string;
  activity?: {
    type: 'typing' | 'calling' | 'in_meeting' | 'idle';
    context?: string;
    startedAt?: Date | string;
  };
  metadata?: {
    userAgent?: string;
    location?: string;
    timezone?: string;
  };
}

interface PresenceIndicatorProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  presence?: UserPresence;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showActivity?: boolean;
  showLastSeen?: boolean;
  showPlatform?: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

interface PresenceListProps {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    presence?: UserPresence;
  }>;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
  groupByStatus?: boolean;
  showCount?: boolean;
  className?: string;
}

interface ActivityIndicatorProps {
  activity: UserPresence['activity'];
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// Status color and icon mappings
const STATUS_CONFIG = {
  online: {
    color: 'bg-green-500',
    icon: Circle,
    label: 'Online',
    description: 'Available'
  },
  away: {
    color: 'bg-yellow-500',
    icon: Clock,
    label: 'Away',
    description: 'Away from keyboard'
  },
  busy: {
    color: 'bg-red-500',
    icon: Circle,
    label: 'Busy',
    description: 'Do not disturb'
  },
  offline: {
    color: 'bg-gray-400',
    icon: Circle,
    label: 'Offline',
    description: 'Last seen'
  }
};

const ACTIVITY_CONFIG = {
  typing: {
    icon: MessageCircle,
    label: 'Typing',
    color: 'text-blue-500',
    animated: true
  },
  calling: {
    icon: Phone,
    label: 'On a call',
    color: 'text-green-500',
    animated: true
  },
  in_meeting: {
    icon: Video,
    label: 'In a meeting',
    color: 'text-purple-500',
    animated: false
  },
  idle: {
    icon: Clock,
    label: 'Idle',
    color: 'text-yellow-500',
    animated: false
  }
};

const SIZE_CONFIG = {
  sm: {
    avatar: 'w-6 h-6',
    indicator: 'w-2 h-2',
    text: 'text-xs',
    spacing: 'gap-1'
  },
  md: {
    avatar: 'w-8 h-8',
    indicator: 'w-2.5 h-2.5',
    text: 'text-sm',
    spacing: 'gap-2'
  },
  lg: {
    avatar: 'w-10 h-10',
    indicator: 'w-3 h-3',
    text: 'text-base',
    spacing: 'gap-3'
  },
  xl: {
    avatar: 'w-12 h-12',
    indicator: 'w-3.5 h-3.5',
    text: 'text-lg',
    spacing: 'gap-3'
  }
};

// Activity Indicator Component
const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  activity,
  size = 'sm',
  animated = true
}) => {
  if (!activity) return null;

  const config = ACTIVITY_CONFIG[activity.type];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClass = SIZE_CONFIG[size];

  return (
    <div className={cn(
      'flex items-center gap-1',
      sizeClass.text,
      config.color
    )}>
      <Icon 
        className={cn(
          'w-3 h-3',
          animated && config.animated && 'animate-pulse'
        )} 
      />
      <span className="font-medium">{config.label}</span>
      {activity.context && (
        <span className="text-gray-500">in {activity.context}</span>
      )}
    </div>
  );
};

// Main Presence Indicator Component
const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  user,
  presence,
  size = 'md',
  showActivity = true,
  showLastSeen = true,
  showPlatform = false,
  showAvatar = true,
  showName = true,
  showTooltip = true,
  className = '',
  onClick
}) => {
  const status = presence?.status || 'offline';
  const statusConfig = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  
  const [isPulsing, setIsPulsing] = useState(false);

  // Pulse animation when status changes
  useEffect(() => {
    if (presence?.status === 'online') {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [presence?.status]);

  // Format last seen time
  const formatLastSeen = (lastSeen: Date | string) => {
    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
      default:
        return '💻';
    }
  };

  const content = (
    <div 
      className={cn(
        'flex items-center',
        sizeConfig.spacing,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {/* Avatar with status indicator */}
      {showAvatar && (
        <div className="relative">
          <Avatar className={sizeConfig.avatar}>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Status indicator */}
          <div 
            className={cn(
              'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
              sizeConfig.indicator,
              statusConfig.color,
              isPulsing && status === 'online' && 'animate-ping'
            )}
          />
          
          {/* Platform indicator */}
          {showPlatform && presence?.platform && (
            <div className="absolute -top-1 -right-1 text-xs">
              {getPlatformIcon(presence.platform)}
            </div>
          )}
        </div>
      )}

      {/* User info */}
      <div className="flex-1 min-w-0">
        {showName && (
          <div className={cn('font-medium truncate', sizeConfig.text)}>
            {user.name}
          </div>
        )}
        
        {/* Status and activity */}
        <div className="flex flex-col gap-1">
          <div className={cn('flex items-center gap-1', sizeConfig.text)}>
            <Circle className={cn('w-2 h-2 fill-current', statusConfig.color.replace('bg-', 'text-'))} />
            <span className="text-gray-600">{statusConfig.label}</span>
          </div>
          
          {/* Activity indicator */}
          {showActivity && presence?.activity && (
            <ActivityIndicator 
              activity={presence.activity} 
              size={size === 'xl' ? 'md' : 'sm'}
            />
          )}
          
          {/* Last seen */}
          {showLastSeen && status === 'offline' && presence?.lastSeen && (
            <div className={cn('text-gray-500', sizeConfig.text)}>
              {formatLastSeen(presence.lastSeen)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{user.name}</div>
            <div className="flex items-center gap-2">
              <Circle className={cn('w-2 h-2 fill-current', statusConfig.color.replace('bg-', 'text-'))} />
              <span>{statusConfig.description}</span>
            </div>
            
            {presence?.activity && (
              <ActivityIndicator 
                activity={presence.activity} 
                size="sm" 
                animated={false}
              />
            )}
            
            {presence?.lastSeen && (
              <div className="text-sm text-gray-500">
                Last seen {formatLastSeen(presence.lastSeen)}
              </div>
            )}
            
            {showPlatform && presence?.platform && (
              <div className="text-sm text-gray-500">
                {getPlatformIcon(presence.platform)} {presence.platform}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Presence List Component
const PresenceList: React.FC<PresenceListProps> = ({
  users,
  maxVisible = 10,
  size = 'md',
  layout = 'vertical',
  groupByStatus = false,
  showCount = true,
  className = ''
}) => {
  // Group users by status if requested
  const groupedUsers = groupByStatus 
    ? users.reduce((groups, user) => {
        const status = user.presence?.status || 'offline';
        if (!groups[status]) groups[status] = [];
        groups[status].push(user);
        return groups;
      }, {} as Record<PresenceStatus, typeof users>)
    : { all: users };

  // Count users by status
  const statusCounts = users.reduce((counts, user) => {
    const status = user.presence?.status || 'offline';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<PresenceStatus, number>);

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'grid':
        return 'grid grid-cols-2 lg:grid-cols-3 gap-4';
      case 'vertical':
      default:
        return 'space-y-2';
    }
  };

  const renderUserGroup = (groupUsers: typeof users, statusKey?: string) => {
    const visibleUsers = groupUsers.slice(0, maxVisible);
    const hiddenCount = Math.max(0, groupUsers.length - maxVisible);

    return (
      <div key={statusKey} className="space-y-2">
        {groupByStatus && statusKey && statusKey !== 'all' && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Circle className={cn('w-2 h-2 fill-current', STATUS_CONFIG[statusKey as PresenceStatus].color.replace('bg-', 'text-'))} />
            <span>{STATUS_CONFIG[statusKey as PresenceStatus].label}</span>
            <Badge variant="secondary" className="text-xs">
              {groupUsers.length}
            </Badge>
          </div>
        )}
        
        <div className={getLayoutClasses()}>
          {visibleUsers.map(user => (
            <PresenceIndicator
              key={user.id}
              user={user}
              presence={user.presence}
              size={size}
              showTooltip={layout !== 'horizontal'}
            />
          ))}
          
          {hiddenCount > 0 && (
            <div className={cn('text-gray-500', SIZE_CONFIG[size].text)}>
              +{hiddenCount} more
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status counts */}
      {showCount && !groupByStatus && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusCounts)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => {
              const config = STATUS_CONFIG[status as PresenceStatus];
              return (
                <div key={status} className="flex items-center gap-1 text-sm">
                  <Circle className={cn('w-2 h-2 fill-current', config.color.replace('bg-', 'text-'))} />
                  <span className="text-gray-600">{count} {config.label.toLowerCase()}</span>
                </div>
              );
            })}
        </div>
      )}
      
      {/* User groups */}
      {Object.entries(groupedUsers).map(([statusKey, groupUsers]) =>
        renderUserGroup(groupUsers, statusKey)
      )}
    </div>
  );
};

// Simple status dot component
export const PresenceDot: React.FC<{
  status: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}> = ({ 
  status, 
  size = 'md', 
  animated = false, 
  className = '' 
}) => {
  const statusConfig = STATUS_CONFIG[status];
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div 
      className={cn(
        'rounded-full',
        sizeClasses[size],
        statusConfig.color,
        animated && status === 'online' && 'animate-pulse',
        className
      )}
    />
  );
};

// Compact presence component
export const CompactPresence: React.FC<{
  users: Array<{ id: string; name: string; avatar?: string; presence?: UserPresence }>;
  maxVisible?: number;
  size?: 'sm' | 'md';
}> = ({ users, maxVisible = 5, size = 'sm' }) => {
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className="flex items-center gap-1">
      {visibleUsers.map(user => (
        <div key={user.id} className="relative">
          <Avatar className={sizeConfig.avatar}>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <PresenceDot
            status={user.presence?.status || 'offline'}
            size="sm"
            className="absolute -bottom-0.5 -right-0.5 border border-white"
          />
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div className={cn(
          'flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium',
          sizeConfig.avatar,
          sizeConfig.text
        )}>
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;
export { PresenceList, ActivityIndicator };