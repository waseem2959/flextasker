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
  Chip,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminLayout from '../../layouts/AdminLayout';
import { TaskStatus, TaskPriority } from '../../../shared/types/enums';
import axios from 'axios';

// Task interface matching the backend model
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  budget: number;
  createdAt: string;
  dueDate: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bidCount: number;
}

const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be a paginated API call
        const response = await axios.get('/api/admin/tasks');
        setTasks(response.data.data);
        setFilteredTasks(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks. Please try again later.');
        setLoading(false);
      }
    };
    
    // For demo purposes, we'll use mock data instead of making the API call
    // fetchTasks();
    
    // Mock data
    const mockTasks: Task[] = Array.from({ length: 50 }, (_, i) => ({
      id: `task-${i + 1}`,
      title: `Task ${i + 1}: ${['Website design', 'Logo creation', 'Content writing', 'App development', 'Data entry'][i % 5]}`,
      status: Object.values(TaskStatus)[i % Object.values(TaskStatus).length],
      priority: Object.values(TaskPriority)[i % Object.values(TaskPriority).length],
      budget: Math.round(Math.random() * 900 + 100),
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      dueDate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 10000000000).toISOString() : null,
      owner: {
        id: `user-${i % 10 + 1}`,
        firstName: `First${i % 10 + 1}`,
        lastName: `Last${i % 10 + 1}`
      },
      bidCount: Math.floor(Math.random() * 10)
    }));
    
    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
    setLoading(false);
  }, []);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.id.toLowerCase().includes(term) ||
        `${task.owner.firstName} ${task.owner.lastName}`.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
    setPage(0); // Reset to first page on filter change
  }, [searchTerm, statusFilter, tasks]);
  
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };
  
  // Get status chip color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return 'primary';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Get priority chip color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'error';
      case TaskPriority.MEDIUM:
        return 'warning';
      case TaskPriority.LOW:
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom>
          Task Management
        </Typography>
        
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search tasks by title or owner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.values(TaskStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Typography>Loading tasks...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Bids</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{`${task.owner.firstName} ${task.owner.lastName}`}</TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority} 
                            color={getPriorityColor(task.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(task.budget)}</TableCell>
                        <TableCell>{formatDate(task.createdAt)}</TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell>{task.bidCount}</TableCell>
                        <TableCell>
                          <IconButton size="small" title="View task">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Edit task">
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
              count={filteredTasks.length}
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

export default AdminTasksPage;
