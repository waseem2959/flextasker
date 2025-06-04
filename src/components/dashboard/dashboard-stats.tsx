import { Card, CardContent } from '@/components/ui/card';
import { Task, TaskStatus, UserRole, User as UserType } from '@/types';
import { Bell, FileText, Star, User } from 'lucide-react';
import React from 'react';

interface DashboardStatsProps {
  user: UserType;
  myTasks: Task[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ user, myTasks }) => {
  // Helper function to determine if user is a client (task owner) vs tasker
  // We'll use 'USER' role to represent users who post tasks
  // and 'TASKER' to represent service providers
  const isClient = user.role === UserRole.USER;
  
  // Calculate statistics based on current tasks
  const openTasks = myTasks.filter(task => task.status === TaskStatus.OPEN);
  const totalBidCount = myTasks.reduce((total, task) => total + (task.bidCount ?? 0), 0);
  
  // For taskers, we'll show their completed tasks count
  // For clients, we'll show active tasks they've posted
  const getActiveCount = () => {
    if (isClient) {
      return openTasks.length;
    } else {
      // For taskers, count tasks they're assigned to that are in progress or open
      return myTasks.filter(task => 
        task.assignee?.id === user.id && 
        (task.status === TaskStatus.OPEN || task.status === TaskStatus.IN_PROGRESS)
      ).length;
    }
  };
  
  const getSecondaryCount = () => {
    if (isClient) {
      return totalBidCount;
    } else {
      // For taskers, show completed tasks
      return user.completedTasks ?? 0;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* First Card: Active Tasks/Bids */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                {isClient ? 'Active Tasks' : 'Active Assignments'}
              </p>
              <p className="text-3xl font-bold mt-1 text-text-primary">
                {getActiveCount()}
              </p>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Second Card: Total Bids/Completed Tasks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                {isClient ? 'Total Bids Received' : 'Completed Tasks'}
              </p>
              <p className="text-3xl font-bold mt-1 text-text-primary">
                {getSecondaryCount()}
              </p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <User className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Third Card: User Rating */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Rating</p>
              <div className="flex items-center mt-1">
                {/* Use averageRating instead of rating, with fallback for new users */}
                <p className="text-3xl font-bold mr-1 text-text-primary">
                  {user.averageRating ? user.averageRating.toFixed(1) : 'N/A'}
                </p>
                {user.averageRating && user.averageRating > 0 && (
                  <Star className="h-4 w-4 text-warning" fill="currentColor" />
                )}
              </div>
              {/* Show review count if available */}
              {user.totalReviews && user.totalReviews > 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  Based on {user.totalReviews} review{user.totalReviews !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Star className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fourth Card: Notifications */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Notifications</p>
              <p className="text-3xl font-bold mt-1 text-text-primary">5</p>
              <p className="text-xs text-text-secondary mt-1">
                {isClient ? 'New bids & updates' : 'Task invitations'}
              </p>
            </div>
            <div className="p-2 bg-error/10 rounded-lg">
              <Bell className="h-6 w-6 text-error" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
