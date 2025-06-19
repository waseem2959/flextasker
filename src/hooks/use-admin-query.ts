/**
 * Admin Query Hook
 * 
 * React Query hooks for admin operations with proper caching,
 * loading states, and mutation handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { User, Task, UserRole } from '@/types';

// Admin-specific interfaces
export interface AdminUser extends User {
  isActive: boolean;
  lastLoginAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  averageRating: number;
  totalTasks: number;
  totalEarnings: number;
}

export interface AdminTask extends Task {
  reportCount: number;
  flaggedReason?: string;
  isDisputed: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageTaskCompletion: number;
  disputeRate: number;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskFilters {
  status?: string;
  reported?: boolean;
  disputed?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Mock API service
const adminService = {
  async getUsers(filters: UserFilters = {}): Promise<{ users: AdminUser[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock users data (using type assertion for simplified test data)
    const mockUsers = [
      {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        averageRating: 4.5,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2024-01-10'),
        username: 'johndoe',
        availableRoles: [UserRole.USER],
        activeRole: UserRole.USER,
        isSuspended: false,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        trustScore: 85,
        lastLoginAt: new Date('2024-01-10').toISOString(),
        totalTasks: 12,
        totalEarnings: 0
      },
      {
        id: '2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.TASKER,
        averageRating: 4.8,
        createdAt: new Date('2023-02-20'),
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        trustScore: 95,
        lastLoginAt: new Date('2024-01-09').toISOString(),
        totalTasks: 45,
        totalEarnings: 15420
      },
      {
        id: '3',
        email: 'mike.wilson@example.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        role: UserRole.ADMIN,
        averageRating: 5.0,
        createdAt: new Date('2022-12-01'),
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        trustScore: 100,
        lastLoginAt: new Date('2024-01-11').toISOString(),
        totalTasks: 0,
        totalEarnings: 0
      },
      {
        id: '4',
        email: 'sarah.johnson@example.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.TASKER,
        averageRating: 4.2,
        createdAt: new Date('2023-03-10'),
        isActive: false,
        emailVerified: true,
        phoneVerified: false,
        trustScore: 70,
        lastLoginAt: new Date('2023-12-15').toISOString(),
        totalTasks: 23,
        totalEarnings: 8900
      }
    ] as AdminUser[];

    let filtered = [...mockUsers];

    // Apply filters
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(user => user.isActive === filters.isActive);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = filters.page || 0;
    const limit = filters.limit || 10;
    const startIndex = page * limit;
    const paginatedUsers = filtered.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      total: filtered.length
    };
  },

  async getTasks(_filters: TaskFilters = {}): Promise<{ tasks: AdminTask[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Mock tasks data would go here
    return { tasks: [], total: 0 };
  },

  async getAdminStats(): Promise<AdminStats> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      totalUsers: 1247,
      activeUsers: 1089,
      totalTasks: 3456,
      activeTasks: 234,
      completedTasks: 3222,
      totalRevenue: 156789.50,
      monthlyRevenue: 23456.78,
      averageTaskCompletion: 93.2,
      disputeRate: 2.1
    };
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock update - in real implementation, this would call the API
    const mockUser = {
      id: userId,
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      role: UserRole.USER,
      averageRating: 4.5,
      createdAt: new Date(),
      isActive,
      emailVerified: true,
      phoneVerified: false,
      trustScore: 85,
      totalTasks: 0,
      totalEarnings: 0
    } as AdminUser;
    
    return mockUser;
  },

  async updateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = {
      id: userId,
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      role,
      averageRating: 4.5,
      createdAt: new Date(),
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      trustScore: 85,
      totalTasks: 0,
      totalEarnings: 0
    } as AdminUser;
    
    return mockUser;
  },

  async deleteUser(_userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Mock deletion
  }
};

// Query Keys
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (filters: UserFilters) => [...adminKeys.users(), 'list', filters] as const,
  tasks: () => [...adminKeys.all, 'tasks'] as const,
  tasksList: (filters: TaskFilters) => [...adminKeys.tasks(), 'list', filters] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch admin users with filtering and pagination
 */
export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: adminKeys.usersList(filters),
    queryFn: () => adminService.getUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

/**
 * Hook to fetch admin tasks with filtering and pagination
 */
export function useAdminTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: adminKeys.tasksList(filters),
    queryFn: () => adminService.getTasks(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch admin statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminService.getAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user status (active/inactive)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive),
    onMutate: async ({ userId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: adminKeys.users() });

      // Optimistically update users
      queryClient.setQueriesData(
        { queryKey: adminKeys.users() },
        (oldData: { users: AdminUser[]; total: number } | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            users: oldData.users.map(user =>
              user.id === userId ? { ...user, isActive } : user
            )
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateUserRole(userId, role),
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });

      const previousData = queryClient.getQueriesData({ queryKey: adminKeys.users() });

      queryClient.setQueriesData(
        { queryKey: adminKeys.users() },
        (oldData: { users: AdminUser[]; total: number } | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            users: oldData.users.map(user =>
              user.id === userId ? { ...user, role } : user
            )
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteUser,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });

      const previousData = queryClient.getQueriesData({ queryKey: adminKeys.users() });

      queryClient.setQueriesData(
        { queryKey: adminKeys.users() },
        (oldData: { users: AdminUser[]; total: number } | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            users: oldData.users.filter(user => user.id !== userId),
            total: oldData.total - 1
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Combined admin hook for all admin operations
 */
export function useAdmin() {
  const updateUserStatusMutation = useUpdateUserStatus();
  const updateUserRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const updateUserStatus = useCallback((userId: string, isActive: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive });
  }, [updateUserStatusMutation]);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    updateUserRoleMutation.mutate({ userId, role });
  }, [updateUserRoleMutation]);

  const deleteUser = useCallback((userId: string) => {
    deleteUserMutation.mutate(userId);
  }, [deleteUserMutation]);

  return {
    // Actions
    updateUserStatus,
    updateUserRole,
    deleteUser,
    
    // Mutation states
    isUpdatingStatus: updateUserStatusMutation.isPending,
    isUpdatingRole: updateUserRoleMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    
    // Errors
    statusError: updateUserStatusMutation.error,
    roleError: updateUserRoleMutation.error,
    deleteError: deleteUserMutation.error,
  };
}

export default useAdmin;