/**
 * Dashboard Query Hook
 * 
 * React Query hooks for dashboard data with proper caching,
 * loading states, and error handling
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { Task, UserRole } from '@/types';
import { taskService } from '@/services/api/task-service';
import { useAuth } from './use-auth';

// Dashboard statistics interface
export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalBids: number;
  acceptedBids: number;
  pendingBids: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  totalReviews: number;
}

// Recent activity interface
export interface RecentActivity {
  id: string;
  type: 'task_created' | 'task_completed' | 'bid_received' | 'bid_accepted' | 'message_received';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Mock API functions (replace with actual API calls)
const dashboardService = {
  async getUserTasks(userId: string, role: UserRole): Promise<Task[]> {
    try {
      let response;
      
      if (role === UserRole.USER) {
        // Get tasks owned by the user
        response = await taskService.getTasks({ userId });
      } else if (role === UserRole.TASKER) {
        // Get tasks assigned to the tasker
        response = await taskService.getAssignedTasks({ userId });
      } else {
        // Admin or other roles - get all tasks
        response = await taskService.getTasks();
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user tasks:', error);
      return [];
    }
  },

  async getDashboardStats(_userId: string, _role: UserRole): Promise<DashboardStats> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock stats based on role
    if (_role === UserRole.TASKER) {
      return {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalBids: 24,
        acceptedBids: 18,
        pendingBids: 6,
        totalEarnings: 15420,
        thisMonthEarnings: 2340,
        averageRating: 4.8,
        totalReviews: 42
      };
    }
    
    // User stats
    return {
      totalTasks: 12,
      activeTasks: 3,
      completedTasks: 9,
      totalBids: 0,
      acceptedBids: 0,
      pendingBids: 0,
      totalEarnings: 0,
      thisMonthEarnings: 0,
      averageRating: 4.5,
      totalReviews: 8
    };
  },

  async getRecentActivity(_userId: string, _role: UserRole): Promise<RecentActivity[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock recent activities based on role
    const baseActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'task_created',
        title: 'New task posted',
        description: 'Website Redesign task has been posted',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        actionUrl: '/tasks/123'
      },
      {
        id: '2',
        type: 'bid_received',
        title: 'New bid received',
        description: 'Received a bid of $500 for Logo Design',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        actionUrl: '/tasks/456'
      },
      {
        id: '3',
        type: 'message_received',
        title: 'New message',
        description: 'John Doe sent you a message',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        actionUrl: '/messages/1'
      },
      {
        id: '4',
        type: 'task_completed',
        title: 'Task completed',
        description: 'Mobile App Development has been completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        actionUrl: '/tasks/789'
      }
    ];

    if (_role === UserRole.TASKER) {
      return [
        {
          id: '5',
          type: 'bid_accepted',
          title: 'Bid accepted',
          description: 'Your bid for Website Redesign was accepted',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          actionUrl: '/tasks/123'
        },
        ...baseActivities.slice(2)
      ];
    }

    return baseActivities;
  }
};

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  tasks: (userId: string, role: UserRole) => [...dashboardKeys.all, 'tasks', userId, role] as const,
  stats: (userId: string, role: UserRole) => [...dashboardKeys.all, 'stats', userId, role] as const,
  activity: (userId: string, role: UserRole) => [...dashboardKeys.all, 'activity', userId, role] as const,
};

/**
 * Hook to fetch user's tasks for dashboard
 */
export function useDashboardTasks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: user ? dashboardKeys.tasks(user.id, (user as any).role) : ['dashboard', 'tasks', 'anonymous'],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return dashboardService.getUserTasks(user.id, (user as any).role);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: user ? dashboardKeys.stats(user.id, (user as any).role) : ['dashboard', 'stats', 'anonymous'],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return dashboardService.getDashboardStats(user.id, (user as any).role);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch recent activity
 */
export function useDashboardActivity() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: user ? dashboardKeys.activity(user.id, (user as any).role) : ['dashboard', 'activity', 'anonymous'],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return dashboardService.getRecentActivity(user.id, (user as any).role);
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Combined dashboard hook that fetches all dashboard data
 */
export function useDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  const queries = useQueries({
    queries: [
      {
        queryKey: user ? dashboardKeys.tasks(user.id, (user as any).role) : ['dashboard', 'tasks', 'anonymous'],
        queryFn: () => {
          if (!user) throw new Error('User not authenticated');
          return dashboardService.getUserTasks(user.id, (user as any).role);
        },
        enabled: !!user && isAuthenticated,
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: user ? dashboardKeys.stats(user.id, (user as any).role) : ['dashboard', 'stats', 'anonymous'],
        queryFn: () => {
          if (!user) throw new Error('User not authenticated');
          return dashboardService.getDashboardStats(user.id, (user as any).role);
        },
        enabled: !!user && isAuthenticated,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: user ? dashboardKeys.activity(user.id, (user as any).role) : ['dashboard', 'activity', 'anonymous'],
        queryFn: () => {
          if (!user) throw new Error('User not authenticated');
          return dashboardService.getRecentActivity(user.id, (user as any).role);
        },
        enabled: !!user && isAuthenticated,
        staleTime: 1 * 60 * 1000,
      }
    ]
  });

  const [tasksQuery, statsQuery, activityQuery] = queries;

  return {
    // Data
    tasks: tasksQuery.data ?? [],
    stats: statsQuery.data,
    activity: activityQuery.data ?? [],
    
    // Loading states
    isLoading: tasksQuery.isLoading || statsQuery.isLoading || activityQuery.isLoading,
    isError: tasksQuery.isError || statsQuery.isError || activityQuery.isError,
    error: tasksQuery.error || statsQuery.error || activityQuery.error,
    
    // Individual loading states
    isTasksLoading: tasksQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isActivityLoading: activityQuery.isLoading,
    
    // Refetch functions
    refetch: () => {
      tasksQuery.refetch();
      statsQuery.refetch();
      activityQuery.refetch();
    },
    refetchTasks: tasksQuery.refetch,
    refetchStats: statsQuery.refetch,
    refetchActivity: activityQuery.refetch,
  };
}

export default useDashboard;