/**
 * Authentication Hook
 * 
 * This hook provides authentication functionality with improved TypeScript patterns:
 * - Login and registration
 * - User profile management
 * - Role-based access control
 * - Type-safe authentication state
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/contextInstance';
import { User, AuthContextType, LoginCredentials, RegisterData, UserRole } from '@/types';
import { userService } from '@/services/api/services';
import { socketService } from '@/services/socket';
import { showErrorNotification, showSuccessNotification } from '@/services/error';

/**
 * Main authentication hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped in the AuthProvider component.'
    );
  }
  
  return context;
}

/**
 * Type guard to verify authenticated state
 */
export function isAuthenticated(
  auth: AuthContextType
): auth is AuthContextType & { user: NonNullable<AuthContextType['user']> } {
  return auth.isAuthenticated && auth.user !== null;
}

/**
 * Hook for accessing the authenticated user with type safety
 */
export function useAuthenticatedUser(): User | null {
  const auth = useAuth();
  return auth.user;
}

/**
 * Hook that requires an authenticated user
 */
export function useRequireAuth(): User {
  const auth = useAuth();
  
  if (!isAuthenticated(auth)) {
    throw new Error(
      'useRequireAuth must be used when authenticated. ' +
      'Wrap your component in a conditional that checks auth.isAuthenticated, ' +
      'use a route guard, or catch this error.'
    );
  }
  
  return auth.user;
}

/**
 * Hook for checking if the current user is an admin
 */
export function useIsAdmin(): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && auth.user.role === UserRole.ADMIN;
}

/**
 * Hook for checking if the current user is a tasker
 */
export function useIsTasker(): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && auth.user.role === UserRole.TASKER;
}

/**
 * Hook for checking if the current user is a regular user
 */
export function useIsRegularUser(): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && auth.user.role === UserRole.USER;
}

/**
 * Hook for checking if the current user has a specific role
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && auth.user.role === requiredRole;
}

/**
 * Hook that requires a user to have a specific role
 */
export function useRequireRole(requiredRole: UserRole): User {
  const user = useRequireAuth();
  
  if (user.role !== requiredRole) {
    throw new Error(
      `This component requires a user with role ${requiredRole}, ` +
      `but the current user has role ${user.role}. ` +
      `Use a conditional or route guard to check roles before rendering this component.`
    );
  }
  
  return user;
}

/**
 * Hook for checking if the current user has any of the specified roles
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && roles.includes(auth.user.role);
}

/**
 * Hook that requires a user to have any of the specified roles
 */
export function useRequireAnyRole(roles: UserRole[]): User {
  const user = useRequireAuth();
  
  if (!roles.includes(user.role)) {
    throw new Error(
      `This component requires a user with one of the following roles: ${roles.join(', ')}, ` +
      `but the current user has role ${user.role}. ` +
      `Use a conditional or route guard to check roles before rendering this component.`
    );
  }
  
  return user;
}

/**
 * Hook that provides authentication loading state
 */
export function useAuthLoading(): boolean {
  const auth = useAuth();
  return auth.loading;
}

/**
 * Converts an API user response to a valid User object
 */
function createUserFromApiResponse(apiUser: any): User {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    role: apiUser.role,
    avatar: apiUser.avatar || null,
    trustScore: apiUser.trustScore || 0,
    emailVerified: apiUser.emailVerified || false,
    phoneVerified: apiUser.phoneVerified || false,
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
    bio: apiUser.bio || null,
    phone: apiUser.phone || null,
    city: apiUser.city || null,
    state: apiUser.state || null,
    country: apiUser.country || null,
    lastActive: apiUser.lastActive ? new Date(apiUser.lastActive) : null,
    averageRating: apiUser.averageRating || 0,
    totalReviews: apiUser.totalReviews || 0,
    completedTasks: apiUser.completedTasks || 0
  };
}

/**
 * Hook that provides enhanced login functionality
 */
export function useLogin() {
  const auth = useAuth();
  
  const login = async (credentials: LoginCredentials) => {
    try {
      // Start loading
      auth.setIsLoading(true);
      
      // Call the login API
      const response = await userService.login(credentials);
      
      if (response.success && response.data) {
        // Set the authentication tokens
        const { accessToken, refreshToken, user } = response.data;
        auth.setTokens(accessToken, refreshToken);
        
        // Convert the API user response to a proper User object
        const fullUser = createUserFromApiResponse(user);
        auth.setUser(fullUser);
        
        // Connect to the socket service
        await socketService.connect();
        
        // Show success message
        showSuccessNotification('Login successful');
        
        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      // Handle login error
      showErrorNotification(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      // Stop loading
      auth.setIsLoading(false);
    }
  };
  
  return {
    login,
    isLoading: auth.loading
  };
}

/**
 * Hook that provides enhanced registration functionality
 */
export function useRegister() {
  const auth = useAuth();
  
  const register = async (data: RegisterData) => {
    try {
      // Start loading
      auth.setIsLoading(true);
      
      // Call the register API
      const response = await userService.register(data);
      
      if (response.success && response.data) {
        // Set the authentication tokens
        const { accessToken, refreshToken, user } = response.data;
        auth.setTokens(accessToken, refreshToken);
        
        // Convert the API user response to a proper User object
        const fullUser = createUserFromApiResponse(user);
        auth.setUser(fullUser);
        
        // Connect to the socket service
        await socketService.connect();
        
        // Show success message
        showSuccessNotification('Registration successful');
        
        return true;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      // Handle registration error
      showErrorNotification(error instanceof Error ? error.message : 'Registration failed');
      return false;
    } finally {
      // Stop loading
      auth.setIsLoading(false);
    }
  };
  
  return {
    register,
    isLoading: auth.loading
  };
}

/**
 * Hook that provides logout functionality
 */
export function useLogout() {
  const auth = useAuth();
  
  const logout = async () => {
    try {
      // Start loading
      auth.setIsLoading(true);
      
      // Call the logout API
      await userService.logout();
      
      // Disconnect from socket service
      socketService.disconnect();
      
      // Clear auth state
      auth.clearAuth();
      
      // Show success message
      showSuccessNotification('Logout successful');
      
      return true;
    } catch (error) {
      // Handle logout error - but still clear local state
      auth.clearAuth();
      socketService.disconnect();
      
      showErrorNotification(error instanceof Error ? error.message : 'Logout failed');
      return true; // Still return true as we've cleared local state
    } finally {
      // Stop loading
      auth.setIsLoading(false);
    }
  };
  
  return {
    logout,
    isLoading: auth.loading
  };
}

// Default export for convenience
export default useAuth;
