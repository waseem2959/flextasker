import { Card, CardContent } from '@/components/ui/card';
import { Task, User as UserType } from '@/types';
import { Bell, FileText, Star, User } from 'lucide-react';
import React from 'react';

interface DashboardStatsProps {
  user: UserType;
  myTasks: Task[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ user, myTasks }) => {
  // Helper function to determine if user is a client (task owner) vs tasker
  // Since we don't have a 'client' role, we'll use 'USER' to represent clients
  // and 'TASKER' to represent service providers
  const isClient = user.role === 'USER';
  
  // Calculate statistics based on current tasks
  const openTasks = myTasks.filter(task => task.status === 'OPEN');
  const totalBidCount = myTasks.reduce((total, task) => total + task.bidCount, 0);
  
  // For taskers, we'll show their completed tasks count
  // For clients, we'll show active tasks they've posted
  const getActiveCount = () => {
    if (isClient) {
      return openTasks.length;
    } else {
      // For taskers, count tasks they're assigned to that are in progress or open
      return myTasks.filter(task => 
        task.assignee?.id === user.id && 
        (task.status === 'OPEN' || task.status === 'IN_PROGRESS')
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
              <p className="text-sm font-medium text-gray-500">
                {isClient ? 'Active Tasks' : 'Active Assignments'}
              </p>
              <p className="text-3xl font-bold mt-1">
                {getActiveCount()}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Second Card: Total Bids/Completed Tasks */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {isClient ? 'Total Bids Received' : 'Completed Tasks'}
              </p>
              <p className="text-3xl font-bold mt-1">
                {getSecondaryCount()}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-md">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Third Card: User Rating */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rating</p>
              <div className="flex items-center mt-1">
                {/* Use averageRating instead of rating, with fallback for new users */}
                <p className="text-3xl font-bold mr-1">
                  {user.averageRating ? user.averageRating.toFixed(1) : 'N/A'}
                </p>
                {user.averageRating && user.averageRating > 0 && (
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                )}
              </div>
              {/* Show review count if available */}
              {user.totalReviews && user.totalReviews > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Based on {user.totalReviews} review{user.totalReviews !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="p-2 bg-yellow-100 rounded-md">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fourth Card: Notifications */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Notifications</p>
              <p className="text-3xl font-bold mt-1">5</p>
              <p className="text-xs text-gray-400 mt-1">
                {isClient ? 'New bids & updates' : 'Task invitations'}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-md">
              <Bell className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};