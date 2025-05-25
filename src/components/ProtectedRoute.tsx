// src/components/ProtectedRoute.tsx
import { useAuthStore } from '@/stores/authStore';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
  readonly requiredRole?: 'USER' | 'TASKER' | 'ADMIN';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    // User doesn't have required role
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}