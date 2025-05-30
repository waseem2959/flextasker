import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../../shared/types/enums';
import ROUTES from './routes';

// Page imports
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProfilePage from '../pages/user/ProfilePage';
import TasksPage from '../pages/tasks/TasksPage';
import TaskDetailPage from '../pages/tasks/TaskDetailPage';
import CreateTaskPage from '../pages/tasks/CreateTaskPage';
import MigrationDashboardPage from '../pages/admin/MigrationDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route 
          path={ROUTES.PROFILE} 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.TASKS} 
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.TASK_DETAIL()} 
          element={
            <ProtectedRoute>
              <TaskDetailPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.TASK_CREATE} 
          element={
            <ProtectedRoute>
              <CreateTaskPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path={ROUTES.ADMIN_DASHBOARD} 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.ADMIN_USERS} 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <AdminUsersPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.ADMIN_TASKS} 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <AdminTasksPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path={ROUTES.ADMIN_MIGRATION} 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <MigrationDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
