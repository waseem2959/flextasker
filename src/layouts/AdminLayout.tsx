import React from 'react';
import { Box, Container, Typography, AppBar, Toolbar, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, Settings as SettingsIcon, People as PeopleIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../../shared/types/enums';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Access Denied</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          You must be an administrator to view this page.
        </Typography>
        <Button 
          variant="contained" 
          component={Link} 
          to="/" 
          sx={{ mt: 3 }}
        >
          Return to Home
        </Button>
      </Container>
    );
  }

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          backgroundColor: theme => theme.palette.primary.main
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flextasker Admin
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<LogoutIcon />}
            onClick={() => logout()}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            <ListItem button component={Link} to="/admin">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem button component={Link} to="/admin/migration-dashboard">
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Migration Dashboard" />
            </ListItem>
            
            <ListItem button component={Link} to="/admin/users">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItem>
          </List>
          <Divider />
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacer for app bar */}
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
