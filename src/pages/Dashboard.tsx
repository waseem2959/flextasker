import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TASKS } from '../data/mockData';
import { Task } from '@/types';

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

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return null; // Redirect handled above
  }

  // Filter tasks based on user role
  let myTasks: Task[] = [];
  if (user?.role === 'client') {
    myTasks = TASKS.filter(task => task.clientId === user.id);
  } else {
    // For workers, show tasks they've bid on
    myTasks = TASKS.filter(task => task.bids.some(bid => bid.workerId === user.id));
  }

  return (
    <Layout>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Welcome back, {user.name}
            </p>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">
                {user.role === 'client' ? 'My Tasks' : 'My Bids'}
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
