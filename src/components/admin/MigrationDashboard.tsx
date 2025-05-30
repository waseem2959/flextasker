import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
// MigrationAlerts component is not used in this file
import { UserRole } from '../../../shared/types/enums';

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  type: string;
}

interface MetricSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p95: number;
  lastUpdated: number;
}

interface ServiceMetrics {
  httpRequests: {
    legacy: MetricSummary;
    consolidated: MetricSummary;
    adoptionRate: number;
  };
  wsEvents: {
    legacy: MetricSummary;
    consolidated: MetricSummary;
    adoptionRate: number;
  };
}

interface DashboardData {
  metrics: {
    bid: ServiceMetrics;
    chat: ServiceMetrics;
    notification: ServiceMetrics;
    review: ServiceMetrics;
    [key: string]: ServiceMetrics;
  };
  featureFlags: FeatureFlag[];
  summary: {
    servicesEnabled: number;
    totalServices: number;
    averageAdoption: number;
    lastUpdated: string;
  };
}

const MigrationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({});
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      setError('You do not have permission to access this dashboard');
      setLoading(false);
    }
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/admin/migration-dashboard/stats');
        const data = response.data.data;
        setDashboardData(data);
        
        // Initialize slider values with current rollout percentages
        const initialSliderValues: { [key: string]: number } = {};
        data.featureFlags.forEach((flag: FeatureFlag) => {
          initialSliderValues[flag.name] = flag.rolloutPercentage;
        });
        setSliderValues(initialSliderValues);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load migration dashboard data');
        setLoading(false);
        console.error('Error fetching dashboard data:', err);
      }
    };
    
    if (user && user.role === UserRole.ADMIN) {
      fetchDashboardData();
      
      // Refresh data every 60 seconds
      const intervalId = setInterval(fetchDashboardData, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Update feature flag rollout percentage
  const updateRolloutPercentage = async (flagName: string) => {
    try {
      setUpdatingFlag(flagName);
      await axios.post(`/api/admin/migration-dashboard/feature-flags/${flagName}/rollout`, {
        percentage: sliderValues[flagName]
      });
      
      // Refresh dashboard data
      const response = await axios.get('/api/admin/migration-dashboard/stats');
      setDashboardData(response.data.data);
      setUpdatingFlag(null);
    } catch (err) {
      setError(`Failed to update ${flagName} rollout percentage`);
      setUpdatingFlag(null);
      console.error('Error updating rollout percentage:', err);
    }
  };

  // Toggle feature flag enabled state
  const toggleFeatureFlag = async (flagName: string, enabled: boolean) => {
    try {
      setUpdatingFlag(flagName);
      await axios.post(`/api/admin/migration-dashboard/feature-flags/${flagName}/toggle`, {
        enabled
      });
      
      // Refresh dashboard data
      const response = await axios.get('/api/admin/migration-dashboard/stats');
      setDashboardData(response.data.data);
      setUpdatingFlag(null);
    } catch (err) {
      setError(`Failed to toggle ${flagName}`);
      setUpdatingFlag(null);
      console.error('Error toggling feature flag:', err);
    }
  };

  // Reset metrics
  const resetMetrics = async () => {
    try {
      await axios.post('/api/admin/migration-dashboard/metrics/reset');
      
      // Refresh dashboard data
      const response = await axios.get('/api/admin/migration-dashboard/stats');
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Failed to reset metrics');
      console.error('Error resetting metrics:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading migration dashboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">No dashboard data available</Alert>
      </Container>
    );
  }

  // Data for adoption rate chart
  const adoptionRateData = Object.keys(dashboardData.metrics).map(service => ({
    name: service.charAt(0).toUpperCase() + service.slice(1),
    httpAdoption: dashboardData.metrics[service].httpRequests.adoptionRate * 100,
    wsAdoption: dashboardData.metrics[service].wsEvents.adoptionRate * 100,
  }));

  // Data for request volume chart
  const requestVolumeData = Object.keys(dashboardData.metrics).map(service => ({
    name: service.charAt(0).toUpperCase() + service.slice(1),
    legacy: dashboardData.metrics[service].httpRequests.legacy.count,
    consolidated: dashboardData.metrics[service].httpRequests.consolidated.count,
  }));

  // Data for WebSocket events chart
  const wsEventsData = Object.keys(dashboardData.metrics).map(service => ({
    name: service.charAt(0).toUpperCase() + service.slice(1),
    legacy: dashboardData.metrics[service].wsEvents.legacy.count,
    consolidated: dashboardData.metrics[service].wsEvents.consolidated.count,
  }));

  // Data for overall adoption pie chart
  const overallAdoptionData = [
    { name: 'Consolidated', value: dashboardData.summary.averageAdoption * 100 },
    { name: 'Legacy', value: 100 - (dashboardData.summary.averageAdoption * 100) },
  ];

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Migration Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        Monitor the transition from legacy to consolidated services
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Services Enabled
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {dashboardData.summary.servicesEnabled}/{dashboardData.summary.totalServices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Average Adoption
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {Math.round(dashboardData.summary.averageAdoption * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                Last Updated
              </Typography>
              <Typography variant="body1" component="div">
                {new Date(dashboardData.summary.lastUpdated).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth
                onClick={resetMetrics}
              >
                Reset Metrics
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Adoption Rate Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Adoption Rate by Service
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adoptionRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Adoption Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="httpAdoption" name="HTTP Requests" fill="#8884d8" />
                <Bar dataKey="wsAdoption" name="WebSocket Events" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Overall Adoption Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Adoption
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overallAdoptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overallAdoptionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Request Volume Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              HTTP Request Volume by Service
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={requestVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Requests', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="legacy" name="Legacy" fill="#FF8042" />
                <Bar dataKey="consolidated" name="Consolidated" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* WebSocket Events Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              WebSocket Events by Service
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wsEventsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Events', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="legacy" name="Legacy" fill="#FF8042" />
                <Bar dataKey="consolidated" name="Consolidated" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Feature Flags Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Feature Flags Configuration
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Feature</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Enabled</TableCell>
                    <TableCell>Rollout %</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.featureFlags.map((flag) => (
                    <TableRow key={flag.name}>
                      <TableCell>{flag.name.replace('consolidated-', '')}</TableCell>
                      <TableCell>{flag.description}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={flag.enabled}
                              onChange={(e) => toggleFeatureFlag(flag.name, e.target.checked)}
                              disabled={updatingFlag === flag.name}
                            />
                          }
                          label=""
                        />
                      </TableCell>
                      <TableCell sx={{ width: 300 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Slider
                            value={sliderValues[flag.name] || 0}
                            onChange={(_, value) => setSliderValues({
                              ...sliderValues,
                              [flag.name]: value as number,
                            })}
                            disabled={!flag.enabled || updatingFlag === flag.name}
                            valueLabelDisplay="auto"
                          />
                          <Typography sx={{ ml: 2, minWidth: 30 }}>
                            {sliderValues[flag.name] || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => updateRolloutPercentage(flag.name)}
                          disabled={!flag.enabled || updatingFlag === flag.name}
                        >
                          {updatingFlag === flag.name ? 'Updating...' : 'Update'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MigrationDashboard;
