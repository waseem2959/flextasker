import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks';
import { UserRole } from '@/types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/layout';
import { useDashboard } from '../hooks/use-dashboard-query';
import { SEO } from '../utils/seo';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import dashboard components
import { DashboardStats } from '../components/dashboard/dashboard-stats';
import { MessagesSection } from '../components/dashboard/messages-section';
import { ProfileSection } from '../components/dashboard/profile-section';
import { QuickLinks } from '../components/dashboard/quick-links';
import { RecentActivity } from '../components/dashboard/recent-activity';
import { TasksAndBidsList } from '../components/dashboard/tasks-and-bids-list';


const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  const {
    tasks: myTasks,
    isLoading,
    isError,
    error,
    refetch
  } = useDashboard();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!user) {
    return null;
  }

  // Error state
  if (isError) {
    return (
      <Layout>
        <div className="py-8 bg-white min-h-screen font-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-2">Error loading dashboard</h2>
              <p className="text-[hsl(220,14%,46%)] mb-4">
                {error instanceof Error ? error.message : 'Failed to load dashboard data.'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const userWithDetails = user as typeof user & { firstName?: string; email?: string; role?: UserRole };

  return (
    <Layout>
      <SEO
        title={`Dashboard | Welcome ${userWithDetails.firstName || 'back'} | Flextasker`}
        description="Manage your tasks, view your stats, check messages and track your progress on Flextasker."
        canonicalUrl="https://flextasker.com/dashboard"
      />
      <div className="py-8 bg-white min-h-screen font-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto py-6 max-w-7xl">
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)]"></div>
              </div>
            )}
            <h1 className="text-2xl font-bold mb-4 text-[hsl(206,33%,16%)] font-primary">
              Welcome, {userWithDetails.firstName || 'User'}!
            </h1>
            <p className="mt-1 text-[hsl(220,14%,46%)] font-primary">
              Welcome back, {userWithDetails.firstName || userWithDetails.email?.split('@')[0] || 'User'}
            </p>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">
                {userWithDetails.role === UserRole.USER ? 'My Tasks' : 'My Bids'}
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
