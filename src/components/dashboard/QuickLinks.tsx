import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, User, Settings } from 'lucide-react';
import { User as UserType } from '@/types';

interface QuickLinksProps {
  user: UserType;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ user }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="hover:border-flextasker-200 transition-colors cursor-pointer">
        <Link to={user.role === 'client' ? '/post-task' : '/tasks'}>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-flextasker-100 rounded-full">
              <PlusCircle className="h-6 w-6 text-flextasker-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">
                {user.role === 'client' ? 'Post a New Task' : 'Find Work'}
              </p>
              <p className="text-sm text-gray-500">
                {user.role === 'client' ? 'Create a new task for workers to bid on' : 'Browse available tasks near you'}
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>
      
      <Card className="hover:border-flextasker-200 transition-colors cursor-pointer">
        <Link to="/profile">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-flextasker-100 rounded-full">
              <User className="h-6 w-6 text-flextasker-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Update Profile</p>
              <p className="text-sm text-gray-500">
                Complete or update your profile details
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>
      
      <Card className="hover:border-flextasker-200 transition-colors cursor-pointer">
        <Link to="/settings">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-flextasker-100 rounded-full">
              <Settings className="h-6 w-6 text-flextasker-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-500">
                Manage your account settings
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
};
