
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ReactQueryProvider } from "./lib/query-provider";
import { ROUTES } from "./lib/route-utils";
import { useAuth } from "./hooks/use-auth";
import { UserRole } from "../shared/types/common/enums";
import { setupSecurityEventListeners } from "./utils/security";
import { ErrorBoundary } from "./components/error-boundary";

// PWA Components
import InstallPrompt from "./components/pwa/install-prompt";
import PWAStatusComponent from "./components/pwa/pwa-status";
// import pwaManager from "./services/pwa/pwa-manager";

// Auth Provider
import AuthProvider from "./services/providers/auth-provider";

// Theme Provider
import { ThemeProvider } from "./contexts/theme-context";

// Performance Monitor (dev only)
import { PerformanceMonitor } from "./components/dev/performance-monitor";

// Image Performance Monitor (dev only)
import { ImagePerformanceToggle } from "./components/dev/image-performance-dashboard";

// Import centralized lazy components
import {
    DashboardPage,
    HowItWorksPage,
    IndexPage,
    LoginPage,
    NotFoundPage,
    ProfilePage,
    RegisterPage,
    TaskCreateWizardPage,
    TaskDetailPage,
    TasksPage
} from "./components/lazy-components";

// Lazy load admin components
const AdminDashboardPage = lazy(() => import('./pages/admin/admin-dashboard-page'));
const AdminTasksPage = lazy(() => import('./pages/admin/admin-tasks-page'));
const AdminUsersPage = lazy(() => import('./pages/admin/admin-users-page'));
const MigrationDashboardPage = lazy(() => import('./pages/admin/migration-dashboard-page'));

// Lazy load PWA offline page
const OfflinePage = lazy(() => import('./pages/offline'));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }
  
  if (requiredRoles.length > 0 && user && !requiredRoles.includes((user as any).role)) {
    return <Navigate to={ROUTES.HOME} />;
  }
  
  return <>{children}</>;
};

const App = () => {
  // Setup security event listeners and PWA on app initialization
  useEffect(() => {
    setupSecurityEventListeners();
    
    // Initialize PWA manager (already happens in the module, but ensure it's ready)
    if ('serviceWorker' in navigator) {
      console.log('PWA features available');
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <ReactQueryProvider>
            <AuthProvider>
              <ThemeProvider>
                <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
              <PerformanceMonitor />
              <ImagePerformanceToggle />
              
              {/* PWA Components */}
              <InstallPrompt />
              <PWAStatusComponent 
                position="bottom-right" 
                variant="compact" 
                showWhenOnline={false}
              />
              
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path={ROUTES.HOME} element={<IndexPage />} />
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                  <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
                  
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
                        <TaskCreateWizardPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path={ROUTES.DASHBOARD} 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
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
                  
                  {/* PWA Offline Route */}
                  <Route path="/offline" element={<OfflinePage />} />
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
                </TooltipProvider>
              </ThemeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
