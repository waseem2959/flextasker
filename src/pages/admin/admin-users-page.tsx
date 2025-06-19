import { useState, useMemo } from 'react';
import { UserRole } from '../../../shared/types/common/enums';
import { useAdminUsers, useAdmin } from '../../hooks/use-admin-query';
import { Layout } from '../../components/layout/layout';
import { SEO } from '../../utils/seo';
import { usePerformance } from '../../hooks/use-performance';

// Import our components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Import optimized components
import {
  MemoizedUserAvatar,
  MemoizedRoleBadge,
  MemoizedStatusBadge,
  MemoizedFormattedDate,
  MemoizedLoadingSpinner,
  MemoizedStatsCard,
  MemoizedActionButtons,
  MemoizedEmptyState
} from '../../components/optimized/memoized-components';
import { DebouncedSearchInput } from '../../components/optimized/debounced-inputs';
import { VirtualizedTable } from '../../components/optimized/virtualized-list';

// Import Lucide icons
import { AlertCircle, Users, UserCheck, UserX } from 'lucide-react';

// Badge styling moved to memoized components for better performance

const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Performance monitoring
  const { } = usePerformance({
    componentName: 'AdminUsersPage',
    enabled: process.env.NODE_ENV === 'development'
  });

  // Prepare filters for the query
  const filters = useMemo(() => ({
    search: searchTerm || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    page,
    limit: rowsPerPage
  }), [searchTerm, roleFilter, statusFilter, page, rowsPerPage]);

  // Use React Query hooks
  const {
    data: usersData,
    isLoading,
    isError,
    error
  } = useAdminUsers(filters);

  const {
    updateUserStatus,
    deleteUser,
    isUpdatingStatus,
    isDeleting
  } = useAdmin();

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserStatus(userId, !currentStatus);
  };


  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalUsers / rowsPerPage);

  // Define table columns for virtualized table
  const tableColumns = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      width: '200px',
      render: (user: any) => (
        <div className="flex items-center space-x-3">
          <MemoizedUserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatar={user.avatar}
            size="sm"
          />
          <span>{user.firstName} {user.lastName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '180px',
      render: (user: any) => user.email,
    },
    {
      key: 'role',
      header: 'Role',
      width: '100px',
      render: (user: any) => <MemoizedRoleBadge role={user.role} />,
    },
    {
      key: 'rating',
      header: 'Rating',
      width: '80px',
      render: (user: any) => `${user.averageRating.toFixed(1)} ⭐`,
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (user: any) => (
        <MemoizedStatusBadge 
          status="status"
          isActive={user.isActive}
        />
      ),
    },
    {
      key: 'tasks',
      header: 'Tasks',
      width: '80px',
      render: (user: any) => user.totalTasks || 0,
    },
    {
      key: 'created',
      header: 'Created',
      width: '120px',
      render: (user: any) => <MemoizedFormattedDate date={user.createdAt} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      render: (user: any) => (
        <MemoizedActionButtons
          actions={[
            {
              label: user.isActive ? 'Deactivate' : 'Activate',
              onClick: () => handleToggleUserStatus(user.id, user.isActive),
              disabled: isUpdatingStatus
            },
            {
              label: 'View',
              onClick: () => console.log('View user', user.id),
              variant: 'outline'
            },
            {
              label: 'Delete',
              onClick: () => handleDeleteUser(user.id),
              variant: 'destructive',
              disabled: isDeleting
            }
          ]}
        />
      ),
    },
  ], [isUpdatingStatus, isDeleting]);

  return (
    <Layout>
      <SEO
        title="User Management | Admin Dashboard | Flextasker"
        description="Manage users, view user statistics, and control user access on Flextasker admin panel."
        canonicalUrl="https://flextasker.com/admin/users"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
          </div>

          {/* Stats Cards - Memoized for better performance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MemoizedStatsCard
              title="Total Users"
              value={totalUsers}
              icon={<Users className="h-4 w-4" />}
            />
            <MemoizedStatsCard
              title="Active Users"
              value={users.filter(u => u.isActive).length}
              icon={<UserCheck className="h-4 w-4" />}
            />
            <MemoizedStatsCard
              title="Inactive Users"
              value={users.filter(u => !u.isActive).length}
              icon={<UserX className="h-4 w-4" />}
            />
            <MemoizedStatsCard
              title="Taskers"
              value={users.filter(u => u.role === UserRole.TASKER).length}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DebouncedSearchInput
                  value={searchTerm}
                  onSearch={setSearchTerm}
                  placeholder="Search users..."
                  delay={300}
                  loading={isLoading}
                />
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value={UserRole.USER}>Users</SelectItem>
                    <SelectItem value={UserRole.TASKER}>Taskers</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={rowsPerPage.toString()} onValueChange={(value) => handleChangeRowsPerPage(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading and Error States - Memoized */}
          {isLoading && (
            <MemoizedLoadingSpinner
              size="lg"
              text="Loading users..."
              className="py-16"
            />
          )}

          {isError && (
            <MemoizedEmptyState
              icon={<AlertCircle className="h-12 w-12" />}
              title="Error loading users"
              description={error instanceof Error ? error.message : 'Failed to load users data.'}
              className="py-16"
            />
          )}

          {/* Users Table - Virtualized for better performance */}
          {!isLoading && !isError && (
            <Card>
              <CardHeader>
                <CardTitle>Users ({totalUsers})</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <VirtualizedTable
                    items={users}
                    columns={tableColumns}
                    rowHeight={72}
                    containerHeight={600}
                    className="w-full"
                    loading={isLoading}
                    emptyMessage="No users found"
                    onRowClick={(user) => console.log('Row clicked:', user.id)}
                  />
                ) : (
                  <MemoizedEmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="No users found"
                    description="No users match your current filters."
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleChangePage(page - 1)}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleChangePage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminUsersPage;