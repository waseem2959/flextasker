import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/lib/route-utils';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { UserRole } from '../../shared/types/common/enums';

// Page imports
import AdminDashboardPage from '../pages/admin/admin-dashboard-page';
import AdminTasksPage from '../pages/admin/admin-tasks-page';
import AdminUsersPage from '../pages/admin/admin-users-page';
import MigrationDashboardPage from '../pages/admin/migration-dashboard-page';

// Temporary placeholder components
// Using function declarations instead of const assignments to avoid read-only warnings
function LoginPagePlaceholder() { return <div>Login Page</div>; }
function RegisterPagePlaceholder() { return <div>Register Page</div>; }
function HomePagePlaceholder() { return <div>Home Page</div>; }
function NotFoundPagePlaceholder() { return <div>Not Found Page</div>; }
function CreateTaskPagePlaceholder() { return <div>Create Task Page</div>; }
function TaskDetailPagePlaceholder() { return <div>Task Detail Page</div>; }
function TasksPagePlaceholder() { return <div>Tasks Page</div>; }
function ProfilePagePlaceholder() { return <div>Profile Page</div>; }

// Use the placeholder components
const LoginPage = LoginPagePlaceholder;
const RegisterPage = RegisterPagePlaceholder;
const HomePage = HomePagePlaceholder;
const NotFoundPage = NotFoundPagePlaceholder;
const CreateTaskPage = CreateTaskPagePlaceholder;
const TaskDetailPage = TaskDetailPagePlaceholder;
const TasksPage = TasksPagePlaceholder;
const ProfilePage = ProfilePagePlaceholder;

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
  
  if (requiredRoles.length > 0 && user && !requiredRoles.includes((user as any).role)) {
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
