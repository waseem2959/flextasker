import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../../shared/types/enums';
import { useAuth } from '../hooks/use-auth';

// Import Lucide icons instead of Material UI
import { LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';

// Import our styled components
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (user && (user as any).role !== UserRole.ADMIN) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || (user as any).role !== UserRole.ADMIN) {
    return (
      <div className="container py-10 text-center font-primary">
        <h1 className="text-2xl font-bold text-[hsl(354,70%,54%)] mb-4">Access Denied</h1>
        <p className="text-[hsl(220,14%,46%)] mb-6">
          You must be an administrator to view this page.
        </p>
        <Button 
          asChild
          className="mt-4" 
        >
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-primary">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[hsl(215,16%,80%)] flex flex-col">
        <div className="p-4 border-b border-[hsl(215,16%,80%)]">
          <h1 className="text-xl font-bold text-[hsl(196,80%,43%)]">FlexTasker Admin</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/admin/dashboard"
                className="flex items-center p-2 rounded-lg text-[hsl(206,33%,16%)] hover:bg-[hsl(196,80%,95%)] transition-colors"
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users"
                className="flex items-center p-2 rounded-lg text-[hsl(206,33%,16%)] hover:bg-[hsl(196,80%,95%)] transition-colors"
              >
                <Users className="mr-3 h-5 w-5" />
                <span>Users</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/tasks"
                className="flex items-center p-2 rounded-lg text-[hsl(206,33%,16%)] hover:bg-[hsl(196,80%,95%)] transition-colors"
              >
                <Settings className="mr-3 h-5 w-5" />
                <span>Tasks</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-[hsl(215,16%,80%)]">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
