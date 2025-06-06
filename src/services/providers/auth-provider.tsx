/**
 * Authentication Provider
 * 
 * A provider component that manages authentication state and methods throughout the application,
 * leveraging React Query for caching and the user service for API interactions.
 * 
 * This component should be placed near the root of your application,
 * typically inside the QueryClientProvider.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/context-instance';
import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '../../types';
import { userService } from '../api/user-service';
import { showErrorNotification } from '../error/error-service';
import { logger } from '../logging';

/**
 * Authentication Provider Component
 */
const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
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
    return token ?? localStorage.getItem('accessToken');
  }, [token]);

  const getRefreshToken = useCallback(() => {
    return refreshToken ?? localStorage.getItem('refreshToken');
  }, [refreshToken]);

  // Auth state management methods
  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setRole((newUser as any).role ?? null);
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

  // Auth mutations
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => userService.login(credentials),
    onSuccess: (data) => {
      setTokens((data as any).token, (data as any).refreshToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      showErrorNotification('Login failed');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate('/');
    },
    onError: () => {
      // Even if the API call fails, we still want to clear local auth state
      clearAuth();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate('/');
    }
  });

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
      if (error instanceof Error) {
        logger.error('Login error', { error: error.message });
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
        logger.error('Logout error', { error: error.message });
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
        logger.error('Registration error', { error: error.message });
      }
      return false;
    }
  };

  useEffect(() => {
    if (userData?.data) {
      updateUser(userData.data);
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
      
      // Auth operations
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

export default AuthProvider;