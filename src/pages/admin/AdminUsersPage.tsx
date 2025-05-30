import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminLayout from '../../layouts/AdminLayout';
import { UserRole } from '../../../shared/types/enums';
import axios from 'axios';

// User interface matching the backend model
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  averageRating: number;
  createdAt: string;
  isActive: boolean;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be a paginated API call
        const response = await axios.get('/api/admin/users');
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again later.');
        setLoading(false);
      }
    };
    
    // For demo purposes, we'll use mock data instead of making the API call
    // fetchUsers();
    
    // Mock data
    const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      role: i % 10 === 0 ? UserRole.ADMIN : (i % 3 === 0 ? UserRole.TASKER : UserRole.USER),
      averageRating: Math.round((Math.random() * 4 + 1) * 10) / 10,
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      isActive: Math.random() > 0.2
    }));
    
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
    setLoading(false);
  }, []);
  
  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(term) ||
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
    );
    
    setFilteredUsers(filtered);
    setPage(0); // Reset to first page on search
  }, [searchTerm, users]);
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get role chip color
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.TASKER:
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        
        {/* Search bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        {loading ? (
          <Typography>Loading users...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{user.averageRating}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isActive ? 'Active' : 'Inactive'} 
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" title="View user">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Edit user">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminUsersPage;
