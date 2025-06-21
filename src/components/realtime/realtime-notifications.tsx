/**
 * Realtime Notifications Component
 * 
 * Advanced notification system with real-time updates, categorization,
 * priority levels, and interactive features.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bell,
  CheckCheck,
  Settings,
  Filter,
  Circle,
  MessageSquare,
  DollarSign,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { ScrollArea } from '../ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '../ui/dropdown-menu';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../ui/popover';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { useEnhancedSocket } from '../../hooks/use-enhanced-socket';
// import { useAuth } from '../../hooks/use-auth'; // Not currently used
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

export type NotificationType = 
  | 'message' 
  | 'bid' 
  | 'task_update' 
  | 'payment' 
  | 'review' 
  | 'system' 
  | 'security' 
  | 'promotion';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  data: {
    taskId?: string;
    bidId?: string;
    userId?: string;
    amount?: number;
    rating?: number;
    url?: string;
    image?: string;
    actions?: Array<{
      id: string;
      label: string;
      type: 'primary' | 'secondary' | 'danger';
      action: string;
      data?: any;
    }>;
  };
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  types: Record<NotificationType, boolean>;
  priority: Record<NotificationPriority, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface RealtimeNotificationsProps {
  className?: string;
  maxVisible?: number;
  showBadge?: boolean;
  autoMarkRead?: boolean;
  enableSound?: boolean;
  enableDesktop?: boolean;
  onNotificationClick?: (notification: RealtimeNotification) => void;
  onNotificationAction?: (notificationId: string, actionId: string, data?: any) => void;
}

// Notification type configuration
const NOTIFICATION_CONFIG = {
  message: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Message'
  },
  bid: {
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Bid'
  },
  task_update: {
    icon: Circle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Task Update'
  },
  payment: {
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Payment'
  },
  review: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Review'
  },
  system: {
    icon: Settings,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'System'
  },
  security: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Security'
  },
  promotion: {
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Promotion'
  }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-500' },
  normal: { label: 'Normal', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-red-500' }
};

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  className = '',
  maxVisible = 50,
  showBadge = true,
  autoMarkRead = false,
  enableSound = true,
  enableDesktop = true,
  onNotificationClick,
  onNotificationAction
}) => {
  // const { user } = useAuth(); // Not currently used
  const { on, off, emit } = useEnhancedSocket();

  // State
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<NotificationType>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<NotificationPriority>>(new Set());
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: enableSound,
    desktop: enableDesktop,
    email: false,
    types: {
      message: true,
      bid: true,
      task_update: true,
      payment: true,
      review: true,
      system: true,
      security: true,
      promotion: true
    },
    priority: {
      low: true,
      normal: true,
      high: true,
      urgent: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Sound and desktop notification support
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Socket event handlers
  useEffect(() => {
    const handleNotification = (notification: RealtimeNotification) => {
      handleNewNotification(notification);
    };

    const handleNotificationRead = (data: { notificationId: string }) => {
      markAsRead(data.notificationId);
    };

    const handleNotificationUpdated = (notification: RealtimeNotification) => {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? notification : n)
      );
    };

    on('notification', handleNotification);
    on('notification_read', handleNotificationRead);
    on('notification_updated', handleNotificationUpdated);

    return () => {
      off('notification', handleNotification);
      off('notification_read', handleNotificationRead);
      off('notification_updated', handleNotificationUpdated);
    };
  }, [on, off, settings]);

  // Initialize audio
  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [enableSound]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    // Check if notifications are enabled
    if (!settings.enabled) return;

    // Check type filter
    if (!settings.types[notification.type]) return;

    // Check priority filter
    if (!settings.priority[notification.priority]) return;

    // Check quiet hours
    if (settings.quietHours.enabled && isInQuietHours()) return;

    // Add to notifications list
    setNotifications(prev => [notification, ...prev].slice(0, maxVisible));

    // Play sound
    if (settings.sound && audioRef.current) {
      audioRef.current.play().catch(console.warn);
    }

    // Show desktop notification
    if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.sender?.avatar || '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      desktopNotification.onclick = () => {
        window.focus();
        setIsOpen(true);
        onNotificationClick?.(notification);
        desktopNotification.close();
      };

      // Auto-close after 5 seconds unless urgent
      if (notification.priority !== 'urgent') {
        setTimeout(() => desktopNotification.close(), 5000);
      }
    }

    // Auto-mark as read if enabled
    if (autoMarkRead) {
      setTimeout(() => markAsRead(notification.id), 3000);
    }
  }, [settings, maxVisible, autoMarkRead, onNotificationClick]);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      // In a real app, this would be an API call
      const mockNotifications: RealtimeNotification[] = [
        {
          id: '1',
          type: 'bid',
          priority: 'high',
          title: 'New Bid Received',
          message: 'John Doe placed a bid of $150 on your task "Website Design"',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          isRead: false,
          isArchived: false,
          data: {
            taskId: 'task-1',
            bidId: 'bid-1',
            amount: 150
          },
          sender: {
            id: 'user-1',
            name: 'John Doe',
            avatar: '/avatars/john.jpg'
          }
        },
        {
          id: '2',
          type: 'message',
          priority: 'normal',
          title: 'New Message',
          message: 'Sarah Wilson sent you a message about the mobile app project',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isRead: false,
          isArchived: false,
          data: {
            userId: 'user-2'
          },
          sender: {
            id: 'user-2',
            name: 'Sarah Wilson',
            avatar: '/avatars/sarah.jpg'
          }
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Check if current time is in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
    
    start.setHours(startHour, startMin, 0);
    end.setHours(endHour, endMin, 0);
    
    // Handle overnight quiet hours
    if (start > end) {
      end.setDate(end.getDate() + 1);
    }
    
    return now >= start && now <= end;
  }, [settings.quietHours]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    
    // Emit to server
    emit('mark_notification_read', { notificationId });
  }, [emit]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    
    // Emit to server
    emit('mark_notifications_read', { notificationIds: unreadIds });
  }, [notifications, emit]);

  // Archive notification - not currently used
  // const archiveNotification = useCallback((notificationId: string) => {
  //   setNotifications(prev => 
  //     prev.map(n => n.id === notificationId ? { ...n, isArchived: true } : n)
  //   );
  //   
  //   emit('archive_notification', { notificationId });
  // }, [emit]);

  // Handle notification action
  const handleNotificationAction = useCallback((notification: RealtimeNotification, actionId: string) => {
    const action = notification.data.actions?.find(a => a.id === actionId);
    if (!action) return;

    onNotificationAction?.(notification.id, actionId, action.data);
    
    // Mark as read when action is taken
    markAsRead(notification.id);
  }, [onNotificationAction, markAsRead]);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setSettings(prev => ({
        ...prev,
        desktop: permission === 'granted'
      }));
    }
  }, []);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower) ||
          notification.sender?.name.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedTypes.size > 0 && !selectedTypes.has(notification.type)) {
        return false;
      }

      // Priority filter
      if (selectedPriorities.size > 0 && !selectedPriorities.has(notification.priority)) {
        return false;
      }

      // Don't show archived notifications by default
      return !notification.isArchived;
    });
  }, [notifications, searchQuery, selectedTypes, selectedPriorities]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead && !n.isArchived).length;
  }, [notifications]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Array<{ date: string; notifications: RealtimeNotification[] }> = [];
    let currentGroup: { date: string; notifications: RealtimeNotification[] } | null = null;

    filteredNotifications.forEach(notification => {
      const notificationDate = new Date(notification.timestamp);
      let dateLabel = '';

      if (isToday(notificationDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(notificationDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(notificationDate, 'MMMM d, yyyy');
      }

      if (!currentGroup || currentGroup.date !== dateLabel) {
        currentGroup = { date: dateLabel, notifications: [] };
        groups.push(currentGroup);
      }

      currentGroup.notifications.push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Notification item component
  const NotificationItem: React.FC<{ notification: RealtimeNotification }> = ({ notification }) => {
    const config = NOTIFICATION_CONFIG[notification.type];
    const Icon = config.icon;

    return (
      <div
        className={cn(
          'p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50',
          !notification.isRead && 'bg-blue-50 border-blue-200',
          notification.isRead && 'bg-white border-gray-200'
        )}
        onClick={() => {
          onNotificationClick?.(notification);
          if (!notification.isRead) {
            markAsRead(notification.id);
          }
        }}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Priority indicator */}
              {notification.priority === 'urgent' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
              {notification.priority === 'high' && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  High
                </Badge>
              )}
            </div>

            {/* Sender and time */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {notification.sender && (
                  <>
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
                      <AvatarFallback className="text-xs">
                        {notification.sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500">
                      {notification.sender.name}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
            </div>

            {/* Actions */}
            {notification.data.actions && notification.data.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.data.actions.map(action => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.type === 'primary' ? 'default' : 'outline'}
                    className={cn(
                      action.type === 'danger' && 'text-red-600 border-red-300 hover:bg-red-50'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationAction(notification, action.id);
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
        >
          <Bell className="w-5 h-5" />
          {showBadge && unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-96 sm:max-w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <div className="flex items-center gap-2">
              {/* Settings */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Settings</h4>
                    
                    {/* General settings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable notifications</span>
                        <Switch
                          checked={settings.enabled}
                          onCheckedChange={(enabled) =>
                            setSettings(prev => ({ ...prev, enabled }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sound</span>
                        <Switch
                          checked={settings.sound}
                          onCheckedChange={(sound) =>
                            setSettings(prev => ({ ...prev, sound }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Desktop notifications</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={settings.desktop}
                            onCheckedChange={(desktop) => {
                              if (desktop) {
                                requestDesktopPermission();
                              } else {
                                setSettings(prev => ({ ...prev, desktop }));
                              }
                            }}
                          />
                          {!settings.desktop && 'Notification' in window && Notification.permission === 'default' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={requestDesktopPermission}
                              className="text-xs"
                            >
                              Enable
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search and filters */}
          <div className="space-y-3">
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="flex gap-2">
              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-3 h-3 mr-1" />
                    Type
                    {selectedTypes.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {selectedTypes.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.has(type as NotificationType)}
                      onCheckedChange={(checked) => {
                        setSelectedTypes(prev => {
                          const newSet = new Set(prev);
                          if (checked) {
                            newSet.add(type as NotificationType);
                          } else {
                            newSet.delete(type as NotificationType);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {config.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Priority
                    {selectedPriorities.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {selectedPriorities.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                    <DropdownMenuCheckboxItem
                      key={priority}
                      checked={selectedPriorities.has(priority as NotificationPriority)}
                      onCheckedChange={(checked) => {
                        setSelectedPriorities(prev => {
                          const newSet = new Set(prev);
                          if (checked) {
                            newSet.add(priority as NotificationPriority);
                          } else {
                            newSet.delete(priority as NotificationPriority);
                          }
                          return newSet;
                        });
                      }}
                    >
                      {config.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="h-[calc(100vh-300px)]">
            {groupedNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedNotifications.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      {group.date}
                    </h3>
                    <div className="space-y-3">
                      {group.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RealtimeNotifications;