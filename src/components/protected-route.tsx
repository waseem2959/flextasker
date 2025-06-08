// src/components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
  readonly requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && (user as any)?.role !== requiredRole && (user as any)?.role !== UserRole.ADMIN) {
    // User doesn't have required role
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}