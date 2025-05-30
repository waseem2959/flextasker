/**
 * Authentication Context
 * 
 * This context provides authentication state and methods throughout the application,
 * leveraging React Query for caching and the user service for API interactions.
 */

import { ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { LoginCredentials, RegisterData, AuthContextType, User, UserRole } from '@/types';
import { showErrorNotification } from '@/services/error';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './contextInstance';

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for authentication
  const [user, setUserState] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [loading, setLoadingState] = useState(false);

  // Fetch the current user (if authenticated)
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.getCurrentUser,
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
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      setRole(newUser.role ?? null);
      setIsAuthenticated(true);
    } else {
      setRole(null);
      setIsAuthenticated(false);
    }
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setLoadingState(isLoading);
  }, []);

  const clearAuth = useCallback(() => {
    setUserState(null);
    setRole(null);
    setIsAuthenticated(false);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
    onSuccess: (response) => {
      if (response.data) {
        const { accessToken, refreshToken } = response.data;
        if (accessToken) {
          setTokens(accessToken, refreshToken);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      showErrorNotification('Login failed');
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.setQueryData(['currentUser'], null);
      navigate('/login');
    },
    onError: () => {
      showErrorNotification('Logout failed');
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => userService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      showErrorNotification('Registration failed');
    }
  });
  
  // Login handler - returns true if successful
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync(credentials);
      return true;
    } catch (error) {
      // Error is handled by the mutation's onError
      return false;
    }
  };
  
  // Logout handler - returns true if successful
  const logout = async (): Promise<boolean> => {
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch (error) {
      // Error is handled by the mutation's onError
      return false;
    }
  };
  
  // Register handler - returns true if successful
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await registerMutation.mutateAsync(data);
      return true;
    } catch (error) {
      // Error is handled by the mutation's onError
      return false;
    }
  };
  
  // Automatically update auth state when user data changes
  useEffect(() => {
    if (userData?.data) {
      setUser(userData.data);
    } else if (!userData && !isUserLoading && token) {
      // If we have a token but no user, clear auth
      clearAuth();
    }
  }, [userData, isUserLoading, token, setUser, clearAuth]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isUserLoading || loginMutation.isPending || 
      logoutMutation.isPending || registerMutation.isPending);
  }, [isUserLoading, loginMutation.isPending, logoutMutation.isPending, 
      registerMutation.isPending, setIsLoading]);
  
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
      setUser,
      setIsLoading,
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
    setUser,
    setIsLoading,
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
