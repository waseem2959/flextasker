import React from 'react';
import MigrationDashboard from '../../components/admin/MigrationDashboard';
import AdminLayout from '../../layouts/AdminLayout';

const MigrationDashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <MigrationDashboard />
    </AdminLayout>
  );
};

export default MigrationDashboardPage;
