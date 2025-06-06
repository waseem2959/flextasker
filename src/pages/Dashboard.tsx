import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks';
import { Task, TaskStatus, UserRole } from '@/types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

// Import dashboard components
import { DashboardStats } from '../components/dashboard/dashboard-stats';
import { MessagesSection } from '../components/dashboard/messages-section';
import { ProfileSection } from '../components/dashboard/profile-section';
import { QuickLinks } from '../components/dashboard/quick-links';
import { RecentActivity } from '../components/dashboard/recent-activity';
import { TasksAndBidsList } from '../components/dashboard/tasks-and-bids-list';

// Helper function to transform API response to Task type
const transformToTask = (data: any): Task => ({
  ...data,
  category: data.category ?? { id: 'default', name: 'General', icon: 'default', subcategories: [] },
  status: data.status as TaskStatus,
  priority: data.priority ?? 'MEDIUM',
  budget: data.budget ?? 0,
  budgetType: data.budgetType ?? 'FIXED',
  isRemote: data.isRemote ?? false,
  tags: data.tags ?? [],
  requirements: data.requirements ?? [],
  createdAt: new Date(data.createdAt),
  deadline: data.deadline ? new Date(data.deadline) : undefined,
  startDate: data.startDate ? new Date(data.startDate) : undefined,
  completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
  owner: data.owner ?? { id: data.ownerId, firstName: 'Unknown', lastName: 'User', email: '', role: UserRole.USER, trustScore: 0, emailVerified: false, phoneVerified: false, createdAt: new Date() },
  assignee: data.assignee ?? null,
  bidCount: data.bidCount ?? 0
});

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  // Initialize tasks state at the top level
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchTasks = async () => {
      if (!user) return;
      
      setIsTasksLoading(true);
      try {
        // Prepare query parameters based on user role
        const params = new URLSearchParams();
        
        if ((user as any).role === UserRole.USER) {
          params.append('ownerId', (user as any).id);
        } else if ((user as any).role === UserRole.TASKER) {
          params.append('assigneeId', (user as any).id);
        }
        
        // Make API call to fetch tasks
        const response = await fetch(`/api/tasks?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        const tasks = Array.isArray(responseData) 
          ? responseData.map(transformToTask)
          : [transformToTask(responseData)];
        setMyTasks(tasks);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        // Optionally show error toast to user
      } finally {
        setIsTasksLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTasks();
    }
  }, [user, isAuthenticated, navigate]);

  if (!user) {
    return null; // Redirect handled above
  }

  return (
    <Layout>
      <div className="py-8 bg-white min-h-screen font-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto py-6 max-w-7xl">
          {isTasksLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)]"></div>
            </div>
          ) : null}
          <h1 className="text-2xl font-bold mb-4 text-[hsl(206,33%,16%)] font-primary">Welcome, {(user as any).firstName}!</h1>
            <p className="mt-1 text-[hsl(220,14%,46%)] font-primary">
              Welcome back, {(user as any).firstName ?? (user as any).email?.split('@')[0]}
            </p>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">
                {(user as any).role === UserRole.USER ? 'My Tasks' : 'My Bids'}
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
