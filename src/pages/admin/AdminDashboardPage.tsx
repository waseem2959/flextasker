import { useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardHeader, Box } from '@mui/material';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../../shared/types/enums';

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
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="User Statistics" />
              <CardContent>
                <Typography variant="h5">Total Users: 245</Typography>
                <Typography>Active in last 30 days: 189</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Task Statistics" />
              <CardContent>
                <Typography variant="h5">Total Tasks: 412</Typography>
                <Typography>Completed this month: 78</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Platform Health" />
              <CardContent>
                <Typography variant="h5">System Status: Good</Typography>
                <Typography>Server uptime: 99.8%</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Quick Links" />
              <CardContent>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="subtitle1">
                      <a href="/admin/users">User Management</a>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">
                      <a href="/admin/tasks">Task Management</a>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">
                      <a href="/admin/migration-dashboard">Migration Dashboard</a>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
