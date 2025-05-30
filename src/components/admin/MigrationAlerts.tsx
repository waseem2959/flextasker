import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Alert, 
  AlertTitle, 
  Button, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar
} from '@mui/material';

interface AlertItem {
  id: string;
  service: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  dismissed: boolean;
  details?: {
    count?: number;
    errorRate?: number;
    serviceAffected?: string;
    url?: string;
  };
}

const MigrationAlerts = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch alerts from the server
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/migration-dashboard/alerts');
      setAlerts(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching migration alerts:', err);
      setError('Failed to load migration alerts');
      setLoading(false);
    }
  };

  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const intervalId = setInterval(fetchAlerts, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Open alert details dialog
  const handleOpenDetails = (alert: AlertItem) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  // Close alert details dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAlert(null);
  };

  // Dismiss an alert
  const handleDismissAlert = async (alertId: string) => {
    try {
      await axios.post(`/api/admin/migration-dashboard/alerts/${alertId}/dismiss`);
      // Update local state to show alert as dismissed
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      ));
      setSnackbarMessage('Alert dismissed successfully');
      setSnackbarOpen(true);
      
      // Close dialog if open
      if (dialogOpen && selectedAlert?.id === alertId) {
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setSnackbarMessage('Failed to dismiss alert');
      setSnackbarOpen(true);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Generate alert severity level
  const getAlertSeverity = (type: string): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  // If there are no active alerts
  const noActiveAlerts = alerts.filter(alert => !alert.dismissed).length === 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Migration Alerts
      </Typography>
      
      {noActiveAlerts ? (
        <Alert severity="success" sx={{ my: 2 }}>
          No active alerts. Migration is running smoothly.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {alerts
            .filter(alert => !alert.dismissed)
            .map(alert => (
              <Alert 
                key={alert.id} 
                severity={getAlertSeverity(alert.type)}
                sx={{ mb: 2 }}
                action={
                  <Box>
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={() => handleOpenDetails(alert)}
                    >
                      Details
                    </Button>
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </Box>
                }
              >
                <AlertTitle>{alert.service} Alert - {formatTimestamp(alert.timestamp)}</AlertTitle>
                {alert.message}
              </Alert>
            ))}
        </Box>
      )}
      
      {/* Alert Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        {selectedAlert && (
          <>
            <DialogTitle>
              {selectedAlert.service} Alert Details
            </DialogTitle>
            <DialogContent>
              <DialogContentText component="div">
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Message:
                  </Typography>
                  <Typography variant="body1">
                    {selectedAlert.message}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Timestamp:
                  </Typography>
                  <Typography variant="body1">
                    {formatTimestamp(selectedAlert.timestamp)}
                  </Typography>
                </Box>
                
                {selectedAlert.details && (
                  <>
                    {selectedAlert.details.count !== undefined && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          Occurrence Count:
                        </Typography>
                        <Typography variant="body1">
                          {selectedAlert.details.count}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedAlert.details.errorRate !== undefined && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          Error Rate:
                        </Typography>
                        <Typography variant="body1">
                          {(selectedAlert.details.errorRate * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedAlert.details.serviceAffected && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          Service Affected:
                        </Typography>
                        <Typography variant="body1">
                          {selectedAlert.details.serviceAffected}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedAlert.details.url && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          URL:
                        </Typography>
                        <Typography variant="body1">
                          {selectedAlert.details.url}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                onClick={() => handleDismissAlert(selectedAlert.id)}
                color="primary"
              >
                Dismiss Alert
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MigrationAlerts;
