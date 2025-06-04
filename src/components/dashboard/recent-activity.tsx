import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole, User as UserType } from '@/types';
import { FileText, Star, User } from 'lucide-react';
import React from 'react';

interface RecentActivityProps {
  user: UserType;
}

// Interface for activity items to ensure type safety and consistency
// This approach makes the component more maintainable and easier to extend
interface ActivityItem {
  id: string;
  icon: 'user' | 'file' | 'star';
  title: string;
  description: string;
  timestamp: string;
  iconColor: {
    bg: string;
    text: string;
  };
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ user }) => {  // Apply our established semantic bridge pattern for consistent role checking
  const isClient = user.role === UserRole.USER;
  
  // Generate activity data based on user role using the configuration pattern
  // This approach separates business logic from presentation logic
  const getActivityItems = (): ActivityItem[] => {
    return [
      {
        id: 'bid-activity',
        icon: 'user',
        title: 'New bid on your task',
        description: isClient 
          ? 'Aashi from Sonipat placed a bid of ₹2,800 on "Bathroom Plumbing Repair"'
          : 'Your bid of ₹6,500 was received on "Living Room Painting"',
        timestamp: '2 hours ago',
        iconColor: {
          bg: 'bg-blue-100',
          text: 'text-blue-600'
        }
      },
      {
        id: 'task-update',
        icon: 'file',
        title: 'Task status update',
        description: isClient
          ? 'Your task "Website Development for Small Business" has 1 new bid'
          : 'A task you might be interested in was posted: "Furniture Delivery and Assembly"',
        timestamp: '6 hours ago',
        iconColor: {
          bg: 'bg-green-100',
          text: 'text-green-600'
        }
      },
      {
        id: 'review-received',
        icon: 'star',
        title: 'New review received',
        description: isClient
          ? 'Aashi from Sonipat left you a 5-star review'
          : 'Shreesta from Delhi left you a 5-star review',
        timestamp: '2 days ago',
        iconColor: {
          bg: 'bg-purple-100',
          text: 'text-purple-600'
        }
      }
    ];
  };

  // Helper function to render the appropriate icon based on the activity type
  // This demonstrates the single responsibility principle - each function has one clear job
  const renderActivityIcon = (iconType: ActivityItem['icon'], colorClasses: ActivityItem['iconColor']) => {
    const iconProps = {
      className: `h-4 w-4 ${colorClasses.text}`
    };

    switch (iconType) {
      case 'user':
        return <User {...iconProps} />;
      case 'file':
        return <FileText {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      default:
        // Fallback icon - this ensures the component won't break if new icon types are added
        return <User {...iconProps} />;
    }
  };

  // Generate the activity items using our configuration function
  const activityItems = getActivityItems();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest task updates and notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map through activity items for clean, maintainable rendering */}
        {activityItems.map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors"
          >
            <div className={`p-2 ${activity.iconColor.bg} rounded-full mr-4`}>
              {renderActivityIcon(activity.icon, activity.iconColor)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}

        {/* Empty state handling - good UX practice for when no activities exist */}
        {activityItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No recent activity</p>
            <p className="text-sm">
              {isClient 
                ? 'Activity will appear here when you post tasks or receive bids'
                : 'Activity will appear here when you bid on tasks or receive updates'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
