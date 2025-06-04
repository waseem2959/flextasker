/**
 * Notification Bell Component
 *
 * Displays a notification bell icon with badge showing unread count
 * and a dropdown menu to view notifications.
 */

import { formatDistanceToNow } from 'date-fns';
import { Bell, Check } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useNotifications } from '../../hooks/use-notifications';

// Import the NotificationType enum from where it's defined
// In a real app, this would come from a central types file
enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED'
}

// Define the notification interface for typing purposes
export interface Notification {
  id: string;
  message: string;
  type: string; // This would normally be NotificationType but we'll use string for simplicity
  createdAt: string | Date;
  isRead: boolean;
}

// Map notification types to icons
const getNotificationIcon = (_type: NotificationType) => {
  // This could be expanded with different icons for different notification types
  return <Bell className="h-4 w-4 text-primary-600" />;
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Handle notification click
  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Navigate or perform action based on notification type
    // This would be implemented based on specific requirements
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${unreadCount} notifications`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <DropdownMenuItem disabled className="text-red-600 justify-center">
              Failed to load notifications
            </DropdownMenuItem>
          ) : notifications.length === 0 ? (
            <DropdownMenuItem disabled className="text-gray-500 justify-center">
              No notifications yet
            </DropdownMenuItem>
          ) : (
            notifications.map((notification: Notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start space-x-3 p-4 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <Avatar className="h-8 w-8 bg-primary-100">
                  <AvatarFallback>
                    {getNotificationIcon(notification.type as unknown as NotificationType)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(
                      new Date(notification.createdAt instanceof Date ?
                        notification.createdAt.toISOString() :
                        notification.createdAt
                      ),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;