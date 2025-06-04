/**
 * Notification Bell Component
 * 
 * Displays a notification bell icon with badge showing unread count
 * and a dropdown menu to view notifications.
 */

import {
  Check as CheckIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
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
  return <NotificationsIcon color="primary" />;
};

export function NotificationBell() {
  // Render notification content based on state
  const renderNotificationContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (error) {
      return (
        <MenuItem disabled>
          <Typography color="error">Failed to load notifications</Typography>
        </MenuItem>
      );
    }
    
    if (notifications.length === 0) {
      return (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No notifications yet
          </Typography>
        </MenuItem>
      );
    }
    
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {notifications.map((notification: Notification) => (
          <ListItem
            key={notification.id}
            alignItems="flex-start"
            sx={{
              bgcolor: notification.isRead ? 'transparent' : 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
            onClick={() => handleNotificationClick(notification.id)}
            component="button"
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                {getNotificationIcon(notification.type as unknown as NotificationType)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={notification.message}
              secondary={
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                >
                  {formatDistanceToNow(new Date(notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt), { addSuffix: true })}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Open notifications menu
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Close notifications menu
  const handleClose = () => {
    setAnchorEl(null);
  };
  
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
    <>
      <IconButton
        aria-label={`${unreadCount} notifications`}
        aria-controls={open ? 'notifications-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: 400,
              width: '350px',
            },
          }
        }}
        aria-labelledby="notifications-button"
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button 
              startIcon={<CheckIcon />} 
              size="small" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {renderNotificationContent()}
        
        {notifications.length > 0 && (
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
            <Button size="small" color="primary">
              View all notifications
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
}

export default NotificationBell;
