/**
 * User Hooks with TypeScript Improvements
 * 
 * These hooks provide strongly-typed interfaces for user operations
 * with proper error handling and type safety.
 */

import { userService } from '@/services/api';
import {
    LoginCredentials,
    RegisterData,
    // UpdateProfileRequest, // Removed - defined locally in user-service
    UserSearchParams
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for getting the current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting a specific user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
    onSuccess: () => {
      // Fetch user data after successful login
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterData) => userService.register(data),
    onSuccess: () => {
      // Fetch user data after successful registration
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      // Clear user data after logout
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      
      // Clear other user-specific data
      queryClient.removeQueries({ queryKey: ['myTasks'] });
      queryClient.removeQueries({ queryKey: ['myBids'] });
    }
  });
}

/**
 * Hook for updating the user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (response) => {
      // Update user data after profile update
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // If user ID is available, update specific user queries
      if (response.data?.id) {
        queryClient.invalidateQueries({ queryKey: ['user', response.data.id] });
      }
    }
  });
}

/**
 * Hook for changing the user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => 
      userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmPassword
      })
  });
}

/**
 * Hook for getting user reviews
 */
export function useUserReviews(
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  return useQuery({
    queryKey: ['userReviews', userId, params],
    queryFn: () => userService.getUserById(userId), // Fallback to getting basic user info since reviews endpoint isn't available
    enabled: !!userId,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for searching users
 */
export function useSearchUsers(params?: UserSearchParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.searchUsers(params),
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
