
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ReactQueryProvider } from "./lib/query-provider";

// Auth Provider
import AuthProvider from "./services/providers/auth-provider";

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded components for code splitting and optimal performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/login"));
const Register = lazy(() => import("./pages/register"));
const Tasks = lazy(() => import("./pages/tasks"));
const TaskDetail = lazy(() => import("./pages/task-detail"));
const TaskCreateWizard = lazy(() => import("./pages/task-create-wizard"));
const TaskCreate = lazy(() => import("./pages/task-create"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const HowItWorks = lazy(() => import("./pages/how-it-works"));
const Profile = lazy(() => import("./pages/profile"));
const NotFound = lazy(() => import("./pages/not-found"));

const App = () => (
    <BrowserRouter>
      <ReactQueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/post-task" element={<TaskCreateWizard />} />
                  <Route path="/post-task/advanced" element={<TaskCreate />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </BrowserRouter>
);

export default App;
