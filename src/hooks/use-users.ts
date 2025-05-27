/**
 * User Hooks with TypeScript Improvements
 * 
 * These hooks provide strongly-typed interfaces for user operations
 * with proper error handling and type safety.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, ChangePasswordRequest } from '@/services/api';
import { 
  UpdateProfileRequest,
  UserSearchParams,
  LoginCredentials, 
  RegisterData 
} from '@/types/api';

/**
 * Hook for getting the current authenticated user
 * 
 * @returns Query result with strongly-typed user data
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'current'],
    queryFn: () => userService.getCurrentUser(),
    meta: {
      showErrorNotification: false // Don't show errors for auth checks
    }
  });
}

/**
 * Hook for getting a specific user by ID
 * 
 * @param id - User ID
 * @returns Query result with strongly-typed user data
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id
  });
}

/**
 * Hook for user login
 * 
 * @returns Mutation result with strongly-typed auth data
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
    onSuccess: () => {
      // Invalidate the current user query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
    }
  });
}

/**
 * Hook for user registration
 * 
 * @returns Mutation result with strongly-typed auth data
 */
export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterData) => userService.register(userData),
    onSuccess: () => {
      // Invalidate the current user query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
    }
  });
}

/**
 * Hook for user logout
 * 
 * @returns Mutation result
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      // Invalidate the current user query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      
      // Clear all queries to ensure data is refetched after login
      queryClient.clear();
    }
  });
}

/**
 * Hook for updating the user profile
 * 
 * @returns Mutation result with strongly-typed user data
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData: UpdateProfileRequest) => userService.updateProfile(profileData),
    onSuccess: (response) => {
      // Update the current user query data
      queryClient.setQueryData(['users', 'current'], response);
      
      // If the user has a specific ID in the response, update that query too
      if (response.data?.id) {
        queryClient.setQueryData(['users', 'detail', response.data.id], response);
      }
    }
  });
}

/**
 * Hook for changing the user password
 * 
 * @returns Mutation result
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequest) => userService.changePassword(passwordData)
  });
}

/**
 * Hook for getting user reviews
 * 
 * @param userId - User ID
 * @param params - Pagination and filtering parameters
 * @returns Query result with strongly-typed review data
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
    queryKey: ['users', 'reviews', userId, params],
    queryFn: () => userService.getUserReviews(userId, params),
    enabled: !!userId
  });
}

/**
 * Hook for searching users
 * 
 * @param params - Search parameters
 * @returns Query result with strongly-typed user data
 */
export function useSearchUsers(params?: UserSearchParams) {
  return useQuery({
    queryKey: ['users', 'search', params],
    queryFn: () => userService.searchUsers(params || {})
  });
}

/**
 * Enhanced hook aliases for gradual migration
 * 
 * These aliases allow components to use the enhanced naming convention
 * while still using the original implementations.
 */

// Enhanced user hooks with the same functionality but new names
export const useEnhancedCurrentUser = useCurrentUser;
export const useEnhancedUser = useUser;
export const useEnhancedLogin = useLogin;
export const useEnhancedRegister = useRegister;
export const useEnhancedLogout = useLogout;
export const useEnhancedUpdateProfile = useUpdateProfile;
export const useEnhancedChangePassword = useChangePassword;
export const useEnhancedUserReviews = useUserReviews;
export const useEnhancedSearchUsers = useSearchUsers;
