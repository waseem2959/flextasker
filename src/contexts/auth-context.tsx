/**
 * Authentication Context
 * 
 * This context provides authentication state and methods throughout the application,
 * leveraging React Query for caching and the auth service for API interactions.
 */

import { authService } from '@/services/auth';
import errorService from '@/services/error';
import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context-instance';

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for authentication
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(false);

  // Fetch the current user (if authenticated)
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem('accessToken'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Token management methods
  const setTokens = useCallback((accessToken: string, refreshToken?: string) => {
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      setRefreshToken(refreshToken);
    }
  }, []);

  const getToken = useCallback(() => {
    return token;
  }, [token]);

  const getRefreshToken = useCallback(() => {
    return refreshToken;
  }, [refreshToken]);

  // Auth state management methods
  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setRole(newUser.role ?? null);
      setIsAuthenticated(true);
    } else {
      setRole(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.user) {
        // Note: AuthResult doesn't include tokens, they should be handled separately
        // or the auth service should be updated to return tokens
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      errorService.showErrorNotification('Login failed');
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.setQueryData(['currentUser'], null);
      navigate('/login');
    },
    onError: () => {
      errorService.showErrorNotification('Logout failed');
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      errorService.showErrorNotification('Registration failed');
    }
  });
  
  // Login handler - returns true if successful
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync(credentials);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login error:', error.message);
      }
      return false;
    }
  };
  
  // Logout handler - returns true if successful
  const logout = async (): Promise<boolean> => {
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Logout error:', error.message);
      }
      return false;
    }
  };
  
  // Register handler - returns true if successful
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await registerMutation.mutateAsync(data);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Registration error:', error.message);
      }
      return false;
    }
  };
  
  // Automatically update auth state when user data changes
  useEffect(() => {
    if (userData) {
      updateUser(userData);
    } else if (!userData && !isUserLoading && token) {
      // If we have a token but no user, clear auth
      clearAuth();
    }
  }, [userData, isUserLoading, token, updateUser, clearAuth]);

  // Update loading state
  useEffect(() => {
    updateLoadingState(isUserLoading || loginMutation.isPending || 
      logoutMutation.isPending || registerMutation.isPending);
  }, [isUserLoading, loginMutation.isPending, logoutMutation.isPending, 
      registerMutation.isPending, updateLoadingState]);
  
  // Auth context value
  const contextValue = useMemo<AuthContextType>(() => {
    return {
      // State
      user,
      isAuthenticated,
      role,
      loading,
      token,
      refreshToken,
      
      // State management methods
      setUser: updateUser,
      setIsLoading: updateLoadingState,
      setTokens,
      clearAuth,
      
      // Authentication methods
      login,
      logout,
      register,
      
      // Token management
      getToken,
      getRefreshToken
    };
  }, [
    user, 
    isAuthenticated, 
    role,
    loading,
    token,
    refreshToken,
    updateUser,
    updateLoadingState,
    setTokens,
    clearAuth,
    login, 
    logout, 
    register,
    getToken,
    getRefreshToken
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

