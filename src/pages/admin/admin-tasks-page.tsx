import { useEffect, useState } from 'react';
import { TaskPriority, TaskStatus } from '../../../shared/types/enums';
// Removed unused admin layout

// Import our components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import Lucide icons instead of Material UI
import { Edit, Eye, Search } from 'lucide-react';

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
  // Error state is defined but not currently used - preserved for future error handling
  const [error] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper functions for styling
  const getStatusBadgeClassName = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-[hsl(142,72%,29%)]';
      case TaskStatus.ACCEPTED:
        return 'bg-[hsl(196,80%,43%)]';
      case TaskStatus.IN_PROGRESS:
        return 'bg-[hsl(196,80%,43%)]';
      case TaskStatus.OPEN:
        return 'bg-[hsl(38,92%,50%)]';
      default:
        return 'bg-[hsl(220,14%,46%)]';
    }
  };

  const getPriorityBadgeClassName = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'text-[hsl(354,70%,54%)] border-[hsl(354,70%,54%)]';
      case TaskPriority.MEDIUM:
        return 'text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]';
      default:
        return 'text-[hsl(220,14%,46%)] border-[hsl(220,14%,46%)]';
    }
  };

  // Fetch tasks data
  useEffect(() => {
    // In a real implementation, this would call an API
    // Currently using mock data for demonstration purposes
    setLoading(true);
    
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
  // Handled directly in the select onChange
  
  // Date and currency formatting is handled directly in the JSX
  
  // Render functions to extract the nested ternary
  const renderLoading = () => (
    <div className="py-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)] mx-auto"></div>
      <p className="mt-4 text-[hsl(220,14%,46%)]">Loading tasks...</p>
    </div>
  );

  const renderError = () => (
    <div className="py-8 text-center text-[hsl(354,70%,54%)]">{error}</div>
  );

  const renderTasksTable = () => (
    <Card className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(215,16%,80%)] bg-[hsl(215,16%,95%)]">
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">ID</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Title</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Status</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Priority</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Budget</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Creator</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Created</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Due Date</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Bids</th>
              <th className="text-left p-3 text-sm font-medium text-[hsl(206,33%,16%)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((task) => (
                <tr key={task.id} className="border-b border-[hsl(215,16%,90%)] hover:bg-[hsl(215,16%,98%)]">
                  <td className="p-3 text-[hsl(220,14%,46%)]">{task.id}</td>
                  <td className="p-3 text-[hsl(206,33%,16%)]">{task.title.length > 30 ? `${task.title.substring(0, 30)}...` : task.title}</td>
                  <td className="p-3">
                    <Badge 
                      className={getStatusBadgeClassName(task.status)} 
                    >
                      {task.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" 
                      className={getPriorityBadgeClassName(task.priority)}
                    >
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="p-3 text-[hsl(220,14%,46%)]">₹{task.budget}</td>
                  <td className="p-3 text-[hsl(206,33%,16%)]">{`${task.owner.firstName} ${task.owner.lastName}`}</td>
                  <td className="p-3 text-[hsl(220,14%,46%)]">{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-[hsl(220,14%,46%)]">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="p-3 text-[hsl(220,14%,46%)]">{task.bidCount}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(215,16%,90%)]">
        <div className="text-sm text-[hsl(220,14%,46%)]">
          Showing <span className="font-medium">{Math.min(page * rowsPerPage + 1, filteredTasks.length)}</span> to <span className="font-medium">
          {Math.min((page + 1) * rowsPerPage, filteredTasks.length)}</span> of <span className="font-medium">{filteredTasks.length}</span> results
        </div>
        
        <div className="flex space-x-2">
          <select
            className="border border-[hsl(215,16%,80%)] rounded-md text-sm py-1"
            value={rowsPerPage}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setRowsPerPage(value);
              setPage(0);
            }}
            aria-label="Rows per page"
            title="Select number of rows per page"
          >
            {[10, 25, 50].map(value => (
              <option key={value} value={value}>Show {value}</option>
            ))}
          </select>
          
          <div className="flex space-x-1">
            <Button 
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => handleChangePage(null, page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * rowsPerPage >= filteredTasks.length}
              onClick={() => handleChangePage(null, page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  // Function to determine which content to render based on state
  const renderContent = () => {
    if (loading) {
      return renderLoading();
    }
    if (error) {
      return renderError();
    }
    return renderTasksTable();
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)]">Task Management</h1>

        <div className="flex flex-wrap gap-4 items-center mb-6">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(220,14%,46%)]" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminTasksPage;
