import { Card, CardContent } from '@/components/ui/card';
import { UserRole, User as UserType } from '@/types';
import { PlusCircle, Settings, User } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface QuickLinksProps {
  user: UserType;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ user }) => {  // Apply our established semantic bridge pattern
  // This creates consistent role checking across all our components
  const isClient = (user as any).role === UserRole.USER;
  
  // Define the primary action configuration based on user role
  // This approach makes the component's behavior explicit and easy to modify
  const getPrimaryAction = () => {
    if (isClient) {
      return {
        route: '/post-task',
        title: 'Post a New Task',
        description: 'Create a new task for service providers to bid on'
      };
    } else {
      return {
        route: '/tasks',
        title: 'Find Work',
        description: 'Browse available tasks near you'
      };
    }
  };

  // Extract the primary action configuration so we can use it cleanly in the JSX
  const primaryAction = getPrimaryAction();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Primary Action Card - Dynamic based on user role */}
      <Card className="hover:border-flextasker-200 transition-colors cursor-pointer">
        <Link to={primaryAction.route}>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-flextasker-100 rounded-full">
              <PlusCircle className="h-6 w-6 text-flextasker-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">
                {primaryAction.title}
              </p>
              <p className="text-sm text-gray-500">
                {primaryAction.description}
              </p>
            </div>
          </CardContent>
        </Link>
      </Card>
      
      {/* Profile Update Card - Universal for all user types */}
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
      
      {/* Settings Card - Universal for all user types */}
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
