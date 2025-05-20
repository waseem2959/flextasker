import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Star, FileText, Bell } from 'lucide-react';
import { User as UserType, Task } from '@/types';

interface DashboardStatsProps {
  user: UserType;
  myTasks: Task[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ user, myTasks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {user.role === 'client' ? 'Active Tasks' : 'Active Bids'}
              </p>
              <p className="text-3xl font-bold mt-1">
                {user.role === 'client' ? myTasks.filter(t => t.status === 'open').length : '3'}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {user.role === 'client' ? 'Total Bids' : 'Completed Tasks'}
              </p>
              <p className="text-3xl font-bold mt-1">
                {user.role === 'client' 
                  ? myTasks.reduce((acc, task) => acc + task.bids.length, 0) 
                  : '12'}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-md">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rating</p>
              <div className="flex items-center mt-1">
                <p className="text-3xl font-bold mr-1">{user.rating.toFixed(1)}</p>
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              </div>
            </div>
            <div className="p-2 bg-yellow-100 rounded-md">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Notifications</p>
              <p className="text-3xl font-bold mt-1">5</p>
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
