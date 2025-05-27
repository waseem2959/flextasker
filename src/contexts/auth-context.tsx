/**
 * Authentication Context
 * 
 * This context provides authentication state and methods throughout the application,
 * leveraging React Query for caching and the user service for API interactions.
 */

import { ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { LoginCredentials, RegisterData, AuthContextType } from '@/types';
import { handleError } from '@/utils/error-handler';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context-instance';

// Note: AuthContext is imported from context-instance.ts

/**
 * Provider component for authentication context
 * 
 * @param children - Child components
 * @returns Provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Fetch the current user data using React Query
  const { 
    data: userData,
    isLoading
  } = useQuery({
    queryKey: ['users', 'current'],
    queryFn: () => userService.getCurrentUser(),
    retry: false,
    // Convert API response to User object
    select: (response) => response.data
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
    onSuccess: (response) => {
      // Store user data in the cache
      queryClient.setQueryData(['users', 'current'], { 
        success: true,
        data: response.data?.user,
        message: 'User authenticated',
        timestamp: new Date().toISOString()
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => userService.register(data),
    onSuccess: (response) => {
      // Store user data in the cache
      queryClient.setQueryData(['users', 'current'], { 
        success: true,
        data: response.data?.user,
        message: 'User registered',
        timestamp: new Date().toISOString()
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(['users', 'current'], null);
      queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      
      // Redirect to home page
      navigate('/');
    }
  });

  // Login handler
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync(credentials);
      return true;
    } catch (error) {
      handleError(error, {
        context: 'Login',
        showToast: true
      });
      return false;
    }
  }, [loginMutation]);

  // Register handler
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      await registerMutation.mutateAsync(data);
      return true;
    } catch (error) {
      handleError(error, {
        context: 'Registration',
        showToast: true
      });
      return false;
    }
  }, [registerMutation]);

  // Logout handler
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Determine authentication state
  const isAuthenticated = !!userData;
  
  // Get the user's role, if authenticated
  const role = userData?.role || null;

  // Create the context value object
  const value: AuthContextType = useMemo(() => ({
    user: userData || null,
    isAuthenticated,
    role,
    login,
    logout,
    register,
    loading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending
  }), [
    userData,
    isAuthenticated,
    role,
    login,
    logout,
    register,
    isLoading,
    loginMutation.isPending,
    registerMutation.isPending,
    logoutMutation.isPending
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
