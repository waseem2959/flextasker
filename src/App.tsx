
import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ReactQueryProvider } from "./lib/query-provider";

// Auth Provider
import AuthProvider from "./services/providers/auth-provider";

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

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
    <BrowserRouter>
      <ReactQueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<IndexPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:id" element={<TaskDetailPage />} />
                  <Route path="/post-task" element={<TaskCreateWizardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </BrowserRouter>
);

export default App;
