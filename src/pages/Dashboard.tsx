import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '@/hooks';
import { useTasks } from '@/hooks/use-tasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/types/enums';
import { Task } from '@/types';
import { isAdmin, isTasker, isRegularUser } from '@/utils/type-guards';

// Import dashboard components
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickLinks } from '../components/dashboard/QuickLinks';
import { TasksAndBidsList } from '../components/dashboard/TasksAndBidsList';
import { ProfileSection } from '../components/dashboard/ProfileSection';
import { MessagesSection } from '../components/dashboard/MessagesSection';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null; // Redirect handled above
  }

  // Get tasks using our hooks based on user role
  const {
    data: tasksResponse,
    isLoading: isTasksLoading
  } = useTasks(
    // Pass appropriate params based on user role
    user ? {
      ...(user.role === UserRole.USER ? { ownerId: user.id } : {}),
      ...(user.role === UserRole.TASKER ? { assigneeId: user.id } : {}),
      ...(user.role === UserRole.ADMIN ? {} : {}),
    } : {}
  );
  
  // Extract tasks array from response using proper type safety
  const myTasks = tasksResponse?.data || [];

  return (
    <Layout>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto py-6 max-w-7xl">
          {isTasksLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>
            <p className="mt-1 text-gray-500">
              Welcome back, {user.name}
            </p>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">
                {user.role === 'USER' ? 'My Tasks' : 'My Bids'}
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <DashboardStats user={user} myTasks={myTasks} />
              
              {/* Recent Activity */}
              <RecentActivity user={user} />
              
              {/* Quick Links */}
              <QuickLinks user={user} />
            </TabsContent>
            
            {/* Tasks/Bids Tab */}
            <TabsContent value="tasks">
              <TasksAndBidsList user={user} myTasks={myTasks} />
            </TabsContent>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <ProfileSection user={user} />
            </TabsContent>
            
            {/* Messages Tab */}
            <TabsContent value="messages">
              <MessagesSection user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
