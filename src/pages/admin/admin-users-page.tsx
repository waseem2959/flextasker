import { useEffect, useState } from 'react';
import { UserRole } from '../../../shared/types/enums';
import AdminLayout from '../../layouts/AdminLayout';

// Import our components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Import Lucide icons instead of Material UI
import { Edit, Eye, MoreVertical, Search } from 'lucide-react';

// Helper function to get badge class name based on user role
const getBadgeClassNameByRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-[hsl(196,80%,42%)] text-white hover:bg-[hsl(196,80%,36%)]';
    case UserRole.TASKER:
      return 'bg-[hsl(263,85%,50%)] text-white hover:bg-[hsl(263,85%,44%)]';
    default:
      return 'bg-[hsl(220,14%,96%)] text-[hsl(206,33%,35%)] hover:bg-[hsl(220,14%,90%)]';
  }
};

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
  // Keep error state for potential API error handling in the future
  const [error] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch users data
  useEffect(() => {
    // In a real implementation, this would call an API
    // Currently using mock data for demonstration purposes
    setLoading(true);
    
    // Mock data
    const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      role: getUserRole(i),
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
  
  // Page and rows per page are now handled directly in the UI
  
  // Date formatting is now handled directly in JSX
  
  // Helper function to determine user role based on index
  const getUserRole = (index: number): UserRole => {
    if (index % 10 === 0) {
      return UserRole.ADMIN;
    } else if (index % 3 === 0) {
      return UserRole.TASKER;
    } else {
      return UserRole.USER;
    }
  };
  
  // Render functions to extract the nested ternary
  const renderLoading = () => (
    <div className="py-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)] mx-auto"></div>
      <p className="mt-4 text-[hsl(220,14%,46%)]">Loading users...</p>
    </div>
  );

  const renderError = () => (
    <div className="py-8 text-center text-[hsl(354,70%,54%)]">{error}</div>
  );

  const renderUsersTable = () => (
    <Card className="w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell className="text-[hsl(220,14%,46%)]">{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      className={getBadgeClassNameByRole(user.role)}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.averageRating.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.isActive ? "default" : "outline"}
                      className={
                        user.isActive ? 'bg-[hsl(142,71%,45%)] text-white' : 'text-[hsl(356,100%,65%)] border-[hsl(356,100%,85%)]'
                      }
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(215,16%,90%)]">
        <div className="text-sm text-[hsl(220,14%,46%)]">
          Showing <span className="font-medium">{Math.min(page * rowsPerPage + 1, filteredUsers.length)}</span> to <span className="font-medium">
          {Math.min((page + 1) * rowsPerPage, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
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

          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="rounded-r-none border-r-0"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
              className="rounded-l-none"
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
    return renderUsersTable();
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)]">User Management</h1>

        <div className="flex flex-wrap gap-4 items-center mb-6">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(220,14%,46%)]" />
            <Input
              placeholder="Search users by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
