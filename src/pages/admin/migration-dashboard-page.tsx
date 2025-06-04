import React from 'react';
import MigrationDashboard from '../../components/admin/migration-dashboard';
import AdminLayout from '../../layouts/admin-layout';

const MigrationDashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <MigrationDashboard />
    </AdminLayout>
  );
};

export default MigrationDashboardPage;
