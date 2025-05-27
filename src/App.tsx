
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactQueryProvider } from "@/lib/query-provider";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import PostTask from "./pages/PostTask";
import Dashboard from "./pages/Dashboard";
import HowItWorks from "./pages/HowItWorks";
import Profile from "./pages/Profile";

// Contexts
import { EnhancedAuthProvider } from "./contexts";

const App = () => (
  <BrowserRouter>
    <ReactQueryProvider>
      <EnhancedAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/post-task" element={<PostTask />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </EnhancedAuthProvider>
    </ReactQueryProvider>
  </BrowserRouter>
);

export default App;
