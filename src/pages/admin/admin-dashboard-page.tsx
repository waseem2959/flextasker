import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { UserRole } from '../../../shared/types/enums';
import AdminLayout from '../../layouts/admin-layout';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  
  // Redirect if not admin (handled by AdminLayout as well, but adding here for extra safety)
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      // Redirect would be handled by the AdminLayout component
      console.warn('Non-admin user attempted to access admin dashboard');
    }
  }, [user]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)]">
          Admin Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[hsl(206,33%,16%)]">User Statistics</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium text-[hsl(196,80%,43%)]">Total Users: 245</p>
              <p className="text-[hsl(220,14%,46%)]">Active in last 30 days: 189</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[hsl(206,33%,16%)]">Task Statistics</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium text-[hsl(196,80%,43%)]">Total Tasks: 412</p>
              <p className="text-[hsl(220,14%,46%)]">Completed this month: 78</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[hsl(206,33%,16%)]">Platform Health</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium text-[hsl(142,72%,29%)]">System Status: Good</p>
              <p className="text-[hsl(220,14%,46%)]">Server uptime: 99.8%</p>
            </CardContent>
          </Card>
          
          <div className="col-span-1 md:col-span-3">
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-[hsl(206,33%,16%)]">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-auto">
                  {/* Activity log would be populated from an API */}
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 10:45 - User registration: john.doe@example.com</p>
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 10:30 - Task completed: Website redesign for client XYZ</p>
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 10:15 - New task posted: Mobile app development</p>
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 09:45 - User login: admin@flextasker.com</p>
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 09:30 - System backup completed successfully</p>
                  <p className="py-2 border-b border-[hsl(215,16%,90%)] text-[hsl(220,14%,46%)]">2023-10-22 09:00 - Daily system check: All services operational</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
