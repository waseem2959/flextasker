/**
 * Enhanced authentication hooks with improved TypeScript patterns
 * Consolidates functionality from previous auth hooks implementations
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/context-instance';
import { AuthContextType, User } from '@/types';
import { UserRole } from '@/types/enums';
import { isAdmin, isTasker, isRegularUser } from '@/utils/type-guards';

/**
 * Primary hook for accessing authentication context
 *
 * Provides type-safe access to authentication state and methods
 * 
 * @returns Authentication context with strong typing
 * @throws Error if used outside AuthProvider
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
 * 
 * This provides TypeScript with the knowledge that user is non-null
 * when the function returns true.
 * 
 * @param auth - Authentication context
 * @returns Type predicate for authenticated users
 */
export function isAuthenticated(
  auth: AuthContextType
): auth is AuthContextType & { user: NonNullable<AuthContextType['user']> } {
  return auth.isAuthenticated && auth.user !== null;
}

/**
 * Hook for accessing the authenticated user with type safety
 * 
 * @returns User object if authenticated, null otherwise
 */
export function useAuthenticatedUser(): User | null {
  const auth = useAuth();
  
  // This will be null if not authenticated
  return auth.user;
}

/**
 * Hook that provides strongly-typed authenticated user
 * This hook will throw an error if used when not authenticated
 * 
 * @returns User object with guaranteed non-null value
 * @throws Error if not authenticated
 */
export function useRequireAuth(): User {
  const auth = useAuth();
  
  if (!isAuthenticated(auth)) {
    throw new Error(
      'useRequireAuth must be used in an authenticated context. ' +
      'Check auth.isAuthenticated before using this hook or wrap in a conditional.'
    );
  }
  
  return auth.user;
}

/**
 * Hook for checking if the current user is an admin
 * 
 * @returns Boolean indicating if user is an admin
 */
export function useIsAdmin(): boolean {
  const auth = useAuth();
  return isAdmin(auth.user);
}

/**
 * Hook for checking if the current user is a tasker
 * 
 * @returns Boolean indicating if user is a tasker
 */
export function useIsTasker(): boolean {
  const auth = useAuth();
  return isTasker(auth.user);
}

/**
 * Hook for checking if the current user is a regular user
 * 
 * @returns Boolean indicating if user is a regular user
 */
export function useIsRegularUser(): boolean {
  const auth = useAuth();
  return isRegularUser(auth.user);
}

/**
 * Hook for checking if the current user has a specific role
 * 
 * @param requiredRole - Role to check for
 * @returns Boolean indicating if user has required role
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const auth = useAuth();
  
  if (!auth.isAuthenticated || !auth.user) {
    return false;
  }
  
  return auth.user.role === requiredRole;
}

/**
 * Hook that requires a user to have a specific role
 * Will throw an error if the user doesn't have the required role
 * 
 * @param requiredRole - Role to check for
 * @returns The authenticated user if they have the required role
 * @throws Error if not authenticated or missing required role
 */
export function useRequireRole(requiredRole: UserRole): User {
  const auth = useAuth();
  
  if (!isAuthenticated(auth)) {
    throw new Error(
      'useRequireRole must be used in an authenticated context. ' +
      'Check auth.isAuthenticated before using this hook.'
    );
  }
  
  if (auth.user.role !== requiredRole) {
    throw new Error(
      `This feature requires ${requiredRole} role, but you have ${auth.user.role} role. ` +
      'Access denied.'
    );
  }
  
  return auth.user;
}

/**
 * Hook for checking if the current user has any of the specified roles
 * 
 * @param roles - Array of roles to check against
 * @returns Boolean indicating if user has any of the roles
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const auth = useAuth();
  
  if (!auth.isAuthenticated || !auth.user) {
    return false;
  }
  
  return roles.includes(auth.user.role);
}

/**
 * Hook that requires a user to have any of the specified roles
 * Will throw an error if the user doesn't have any of the required roles
 * 
 * @param roles - Array of roles to check against
 * @returns The authenticated user if they have any of the required roles
 * @throws Error if not authenticated or missing required roles
 */
export function useRequireAnyRole(roles: UserRole[]): User {
  const auth = useAuth();
  
  if (!isAuthenticated(auth)) {
    throw new Error(
      'useRequireAnyRole must be used in an authenticated context. ' +
      'Check auth.isAuthenticated before using this hook.'
    );
  }
  
  if (!roles.includes(auth.user.role)) {
    throw new Error(
      `This feature requires one of these roles: ${roles.join(', ')}, ` +
      `but you have ${auth.user.role} role. Access denied.`
    );
  }
  
  return auth.user;
}

/**
 * Hook that provides authentication loading state
 * 
 * @returns Boolean indicating if an authentication operation is in progress
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuth();
  return loading;
}
