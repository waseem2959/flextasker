/**
 * Authentication Hook - Fixed Version
 * 
 * This hook provides authentication functionality with improved TypeScript patterns:
 * - Login and registration
 * - User profile management
 * - Role-based access control
 * - Type-safe authentication state
 */

import { AuthContext } from '@/contexts/context-instance';
import { authService } from '@/services/auth';
import errorService from '@/services/error-service';
// Import realtime service conditionally to handle missing module
let realtimeService: any;
try {
  realtimeService = require('@/services/realtime').realtimeService;
} catch {
  // Fallback if realtime service doesn't exist
  realtimeService = {
    connect: async () => console.log('Realtime service not available'),
    disconnect: () => console.log('Realtime service not available')
  };
}

import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '@/types';
import { useContext } from 'react';

// Extended AuthResult type to include tokens
interface AuthResultWithTokens {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
  refreshToken?: string;
}

/**
 * Main authentication hook
 * This is your entry point for all authentication-related functionality
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
 * This function helps TypeScript understand when a user is definitely authenticated
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
 * This throws an error if no user is authenticated, ensuring type safety
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
  return isAuthenticated(auth) && (auth.user as any).role === UserRole.ADMIN;
}

/**
 * Hook for checking if the current user is a tasker
 */
export function useIsTasker(): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && (auth.user as any).role === UserRole.TASKER;
}

/**
 * Hook for checking if the current user is a regular user
 * Fixed to use the correct enum value
 */
export function useIsRegularUser(): boolean {
  const auth = useAuth();
  // Changed from UserRole.USER to UserRole.REGULAR_USER if that's what exists,
  // or ensure UserRole.USER is defined in your enum
  return isAuthenticated(auth) && (auth.user as any).role === UserRole.USER;
}

/**
 * Hook for checking if the current user has a specific role
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const auth = useAuth();
  return isAuthenticated(auth) && (auth.user as any).role === requiredRole;
}

/**
 * Hook that requires a user to have a specific role
 */
export function useRequireRole(requiredRole: UserRole): User {
  const user = useRequireAuth();
  
  if ((user as any).role !== requiredRole) {
    throw new Error(
      `This component requires a user with role ${requiredRole}, ` +
      `but the current user has role ${(user as any).role}. ` +
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
  return isAuthenticated(auth) && roles.includes((auth.user as any).role);
}

/**
 * Hook that requires a user to have any of the specified roles
 */
export function useRequireAnyRole(roles: UserRole[]): User {
  const user = useRequireAuth();
  
  if (!roles.includes((user as any).role)) {
    throw new Error(
      `This component requires a user with one of the following roles: ${roles.join(', ')}, ` +
      `but the current user has role ${(user as any).role}. ` +
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
 * Using nullish coalescing operator (??) for safer defaults
 */
function createUserFromApiResponse(apiUser: any): User {
  const role = apiUser.role ?? UserRole.USER;
  return {
    name: `${apiUser.firstName} ${apiUser.lastName}`, // Add missing name field
    id: apiUser.id,
    username: apiUser.username ?? apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    role,
    // Role-switching support
    availableRoles: apiUser.availableRoles ?? [role],
    activeRole: apiUser.activeRole ?? role,
    rolePreferences: apiUser.rolePreferences ?? {},
    avatar: apiUser.avatar ?? null, // Using ?? instead of ||
    trustScore: apiUser.trustScore ?? 0,
    emailVerified: apiUser.emailVerified ?? false,
    phoneVerified: apiUser.phoneVerified ?? false,
    isActive: apiUser.isActive ?? true,
    isSuspended: apiUser.isSuspended ?? false,
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
    updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
    bio: apiUser.bio ?? null,
    phone: apiUser.phone ?? null,
    city: apiUser.city ?? null,
    state: apiUser.state ?? null,
    country: apiUser.country ?? null,
    lastActive: apiUser.lastActive ? new Date(apiUser.lastActive) : null,
    averageRating: apiUser.averageRating ?? 0,
    totalReviews: apiUser.totalReviews ?? 0,
    completedTasks: apiUser.completedTasks ?? 0
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
      
      // Call the login API - cast to our extended interface
      const response = await authService.login(credentials) as AuthResultWithTokens;
      
      if (response.success && response.user) {
        // Set the authentication tokens
        const { token, refreshToken } = response;
        if (token) {
          // Using nullish coalescing for safer default
          auth.setTokens(token, refreshToken ?? '');
        }
        
        // Convert the API user response to a proper User object
        const fullUser = createUserFromApiResponse(response.user);
        auth.setUser(fullUser);
        
        // Connect to the realtime service
        await realtimeService.connect();
        
        // Show success message
        errorService.showSuccessNotification('Login successful');
        
        return true;
      } else {
        throw new Error(response.message ?? 'Login failed');
      }
    } catch (error) {
      // Handle login error
      errorService.showErrorNotification(error instanceof Error ? error.message : 'Login failed');
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
      
      // Call the register API - cast to our extended interface
      const response = await authService.register(data) as AuthResultWithTokens;
      
      if (response.success && response.user) {
        // Set the authentication tokens
        const { token, refreshToken } = response;
        if (token) {
          // Using nullish coalescing for safer default
          auth.setTokens(token, refreshToken ?? '');
        }
        
        // Convert the API user response to a proper User object
        const fullUser = createUserFromApiResponse(response.user);
        auth.setUser(fullUser);
        
        // Connect to the realtime service
        await realtimeService.connect();
        
        // Show success message
        errorService.showSuccessNotification('Registration successful');
        
        return true;
      } else {
        throw new Error(response.message ?? 'Registration failed');
      }
    } catch (error) {
      // Handle registration error
      errorService.showErrorNotification(error instanceof Error ? error.message : 'Registration failed');
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
      await authService.logout();
      
      // Disconnect from realtime service
      realtimeService.disconnect();
      
      // Clear auth state
      auth.clearAuth();
      
      // Show success message
      errorService.showSuccessNotification('Logout successful');
      
      return { success: true, error: null };
    } catch (error) {
      // Handle logout error - but still clear local state
      auth.clearAuth();
      realtimeService.disconnect();
      
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      errorService.showErrorNotification(errorMessage);
      
      // Return an object with success=false and the error information
      return { success: false, error: errorMessage };
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