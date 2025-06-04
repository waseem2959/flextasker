import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Bell, Briefcase, Clock, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
// Import the formatShortRelativeTime function from the date service
import { formatShortRelativeTime } from '@/services/date';

type NotificationType = 'message' | 'task' | 'bid' | 'alert' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const getEmptyStateMessage = (tab: string) => {
  if (tab === 'all') return "You don't have any notifications yet.";
  if (tab === 'unread') return "You don't have any unread notifications.";
  return `You don't have any ${tab} notifications.`;
};

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="h-5 w-5 text-[hsl(196,80%,43%)]" />;
    case 'task':
      return <Briefcase className="h-5 w-5 text-[hsl(38,92%,50%)]" />;
    case 'bid':
      return <Clock className="h-5 w-5 text-[hsl(142,72%,29%)]" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-[hsl(354,70%,54%)]" />;
    case 'system':
      return <Bell className="h-5 w-5 text-[hsl(220,14%,46%)]" />;
    default:
      return <Bell className="h-5 w-5 text-[hsl(220,14%,46%)]" />;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    // Simulate fetching notifications
    const fetchNotifications = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'message',
          title: 'New message from John Doe',
          message: 'Hi there! I wanted to ask about the task details.',
          time: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          read: false,
          actionUrl: '/messages/1'
        },
        {
          id: '2',
          type: 'task',
          title: 'Task status updated',
          message: 'Your task "Website Redesign" has been marked as completed.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: true,
          actionUrl: '/tasks/123'
        },
        {
          id: '3',
          type: 'bid',
          title: 'New bid on your task',
          message: 'Someone bid $250 on your "Logo Design" task.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          read: false,
          actionUrl: '/tasks/456'
        },
        {
          id: '4',
          type: 'alert',
          title: 'Account security',
          message: 'We noticed a login from a new device. Please verify it was you.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: false,
          actionUrl: '/settings/security'
        },
        {
          id: '5',
          type: 'system',
          title: 'System maintenance',
          message: 'Flextasker will be undergoing maintenance on Sunday from 2-4am.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          read: true
        },
        {
          id: '6',
          type: 'message',
          title: 'New message from Jane Smith',
          message: 'Thanks for your quick response!',
          time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), // 30 hours ago
          read: true,
          actionUrl: '/messages/2'
        },
        {
          id: '7',
          type: 'task',
          title: 'Task deadline approaching',
          message: 'Your task "Mobile App Development" is due in 2 days.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
          read: true,
          actionUrl: '/tasks/789'
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    };
    
    fetchNotifications();
  }, []);
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Render different content based on loading state and notifications
  const renderNotificationContent = () => {
    if (loading) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)] mx-auto"></div>
          <p className="mt-4 text-[hsl(220,14%,46%)]">Loading notifications...</p>
        </div>
      );
    }

    if (filteredNotifications.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 text-[hsl(220,14%,46%)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-2">No notifications</h2>
          <p className="text-[hsl(220,14%,46%)]">
            {getEmptyStateMessage(activeTab)}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {filteredNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}
      </div>
    );
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)]">Notifications</h1>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              className="border-[hsl(215,16%,80%)]"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-[hsl(215,16%,95%)]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[hsl(196,80%,43%)]">
              All
              {notifications.length > 0 && (
                <Badge className="ml-2 bg-[hsl(220,14%,46%)]">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-[hsl(196,80%,43%)]">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-[hsl(354,70%,54%)]">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="message" className="data-[state=active]:bg-[hsl(196,80%,43%)]">
              Messages
            </TabsTrigger>
            <TabsTrigger value="task" className="data-[state=active]:bg-[hsl(196,80%,43%)]">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="bid" className="data-[state=active]:bg-[hsl(196,80%,43%)]">
              Bids
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {renderNotificationContent()}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  const { id, type, title, message, time, read, actionUrl } = notification;
  
  return (
    <Card 
      className={`p-4 hover:bg-[hsl(215,16%,98%)] transition-colors ${!read ? 'border-l-4 border-l-[hsl(196,80%,43%)]' : ''}`}
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {getNotificationIcon(type)}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className={`font-medium ${!read ? 'text-[hsl(206,33%,16%)]' : 'text-[hsl(220,14%,46%)]'}`}>
              {title}
            </h3>
            <div className="text-xs text-[hsl(220,14%,46%)]">
              {formatShortRelativeTime(time)}
            </div>
          </div>
          <p className="text-sm text-[hsl(220,14%,46%)] mt-1">{message}</p>
          <div className="mt-3 flex space-x-3">
            {actionUrl && (
              <Button variant="link" className="p-0 h-auto text-[hsl(196,80%,43%)]" asChild>
                <a href={actionUrl}>View Details</a>
              </Button>
            )}
            {!read && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-[hsl(220,14%,46%)]"
                onClick={() => onMarkAsRead(id)}
              >
                Mark as read
              </Button>
            )}
            <Button 
              variant="link" 
              className="p-0 h-auto text-[hsl(220,14%,46%)]"
              onClick={() => onDelete(id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Notifications;
