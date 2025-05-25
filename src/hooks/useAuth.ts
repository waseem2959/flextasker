// hooks/useAuth.ts
// Custom hook for accessing authentication context throughout the application
// This hook provides a clean interface for components to interact with auth state

import { useContext } from 'react';
import { AuthContext } from '../contexts/context-instance';
import { AuthContextType } from '../types';

/**
 * Custom hook for accessing authentication context
 * 
 * This hook provides a safe way to access the authentication context throughout
 * your component tree. It includes proper error handling to catch cases where
 * components try to use authentication outside of an AuthProvider.
 * 
 * Usage example:
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *   
 *   return <div>Welcome, {user?.name}!</div>;
 * }
 * ```
 * 
 * @returns AuthContextType object containing user state and authentication methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  // Get the context value from React's context system
  const context = useContext(AuthContext);
  
  // Provide a helpful error message if the hook is used incorrectly
  // This happens when a component tries to use useAuth() without being
  // wrapped in an <AuthProvider> component
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped in <AuthProvider>...</AuthProvider>'
    );
  }
  
  return context;
}

/**
 * Type guard to check if a user is authenticated
 * This provides a clean way to narrow the user type in TypeScript
 * 
 * Usage example:
 * ```tsx
 * function MyComponent() {
 *   const auth = useAuth();
 *   
 *   if (isAuthenticated(auth)) {
 *     // TypeScript now knows auth.user is not null
 *     return <div>Hello, {auth.user.name}!</div>;
 *   }
 *   
 *   return <LoginForm />;
 * }
 * ```
 * 
 * @param auth - Authentication context object
 * @returns Boolean indicating if user is authenticated, with type narrowing
 */
export function isAuthenticated(auth: AuthContextType): auth is AuthContextType & { user: NonNullable<AuthContextType['user']> } {
  return auth.isAuthenticated && auth.user !== null;
}

/**
 * Hook for getting user information with null safety
 * This hook returns user information only if the user is authenticated
 * 
 * Usage example:
 * ```tsx
 * function UserProfile() {
 *   const user = useAuthenticatedUser();
 *   
 *   if (!user) {
 *     return <div>Please log in to view your profile</div>;
 *   }
 *   
 *   // TypeScript knows user is not null here
 *   return <div>Profile for {user.name}</div>;
 * }
 * ```
 * 
 * @returns User object if authenticated, null otherwise
 */
export function useAuthenticatedUser() {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
}

/**
 * Hook for checking if the current user has a specific role
 * This provides a convenient way to implement role-based access control
 * 
 * Usage example:
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasRole('ADMIN');
 *   
 *   if (!isAdmin) {
 *     return <div>Access denied. Admin role required.</div>;
 *   }
 *   
 *   return <div>Admin control panel content</div>;
 * }
 * ```
 * 
 * @param requiredRole - The role to check for
 * @returns Boolean indicating if the current user has the required role
 */
export function useHasRole(requiredRole: 'USER' | 'TASKER' | 'ADMIN'): boolean {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && user?.role === requiredRole;
}

/**
 * Hook for checking if the current user has any of multiple roles
 * This is useful for components that should be accessible to multiple role types
 * 
 * Usage example:
 * ```tsx
 * function TaskManagement() {
 *   const canManageTasks = useHasAnyRole(['ADMIN', 'TASKER']);
 *   
 *   if (!canManageTasks) {
 *     return <div>You need to be a Tasker or Admin to manage tasks</div>;
 *   }
 *   
 *   return <TaskManagementInterface />;
 * }
 * ```
 * 
 * @param roles - Array of roles to check against
 * @returns Boolean indicating if the current user has any of the specified roles
 */
export function useHasAnyRole(roles: Array<'USER' | 'TASKER' | 'ADMIN'>): boolean {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated && user ? roles.includes(user.role) : false;
}

/**
 * Hook that provides authentication loading state
 * This is useful for showing loading spinners during auth operations
 * 
 * Usage example:
 * ```tsx
 * function LoginButton() {
 *   const { login } = useAuth();
 *   const isLoading = useAuthLoading();
 *   
 *   return (
 *     <button 
 *       onClick={() => login(email, password)}
 *       disabled={isLoading}
 *     >
 *       {isLoading ? 'Logging in...' : 'Log In'}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @returns Boolean indicating if an authentication operation is in progress
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuth();
  return loading;
}