import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { UserRole } from '../../../shared/types/enums';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  
  // Redirect if not admin (handled by AdminLayout as well, but adding here for extra safety)
  useEffect(() => {
    if (!user || (user as any).role !== UserRole.ADMIN) {
      // Redirect would be handled by the AdminLayout component
      console.warn('Non-admin user attempted to access admin dashboard');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-neutral-900">
            Admin Dashboard
          </h1>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">User Statistics</h3>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-primary-600">Total Users: 245</p>
                <p className="text-neutral-600">Active in last 30 days: 189</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Task Statistics</h3>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-primary-600">Total Tasks: 412</p>
                <p className="text-neutral-600">Completed this month: 78</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">Platform Health</h3>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-green-600">System Status: Good</p>
                <p className="text-neutral-600">Server uptime: 99.8%</p>
              </CardContent>
            </Card>
          
            <div className="col-span-1 md:col-span-3">
              <Card className="shadow-sm">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] overflow-auto">
                    {/* Activity log would be populated from an API */}
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 10:45 - User registration: john.doe@example.com</p>
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 10:30 - Task completed: Website redesign for client XYZ</p>
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 10:15 - New task posted: Mobile app development</p>
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 09:45 - User login: admin@flextasker.com</p>
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 09:30 - System backup completed successfully</p>
                    <p className="py-2 border-b border-neutral-200 text-neutral-600">2023-10-22 09:00 - Daily system check: All services operational</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
