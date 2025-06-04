
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ReactQueryProvider } from "./lib/query-provider";

// Pages
import Dashboard from "./pages/dashboard";
import HowItWorks from "./pages/how-it-works";
import Index from "./pages/Index";
import Login from "./pages/login";
import NotFound from "./pages/not-found";
import Profile from "./pages/profile";
import Register from "./pages/register";
import TaskCreate from "./pages/task-create";
import TaskDetail from "./pages/task-detail";
import Tasks from "./pages/tasks";

// Auth Provider
import AuthProvider from "./services/providers/auth-provider";

const App = () => (
    <BrowserRouter>
      <ReactQueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Toaster />
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
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </BrowserRouter>
);

export default App;
