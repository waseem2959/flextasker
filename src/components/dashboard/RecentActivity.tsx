import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText, Star } from 'lucide-react';
import { User as UserType } from '@/types';

interface RecentActivityProps {
  user: UserType;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ user }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest task updates and notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors">
          <div className="p-2 bg-blue-100 rounded-full mr-4">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">New bid on your task</p>
            <p className="text-sm text-gray-500">
              {user.role === 'client' ? 'Aashi from Sonipat placed a bid of ₹2,800 on "Bathroom Plumbing Repair"' : 'Your bid of ₹6,500 was received on "Living Room Painting"'}
            </p>
            <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors">
          <div className="p-2 bg-green-100 rounded-full mr-4">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Task status update</p>
            <p className="text-sm text-gray-500">
              {user.role === 'client' 
                ? 'Your task "Website Development for Small Business" has 1 new bid' 
                : 'A task you might be interested in was posted: "Furniture Delivery and Assembly"'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">6 hours ago</p>
          </div>
        </div>
        
        <div className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors">
          <div className="p-2 bg-purple-100 rounded-full mr-4">
            <Star className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">New review received</p>
            <p className="text-sm text-gray-500">
              {user.role === 'client' 
                ? 'Aashi from Sonipat left you a 5-star review' 
                : 'Shreesta from Delhi left you a 5-star review'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">2 days ago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
