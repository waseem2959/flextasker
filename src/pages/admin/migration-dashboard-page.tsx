import React from 'react';
import MigrationDashboard from '../../components/admin/migration-dashboard';
// Removed unused admin layout

const MigrationDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <MigrationDashboard />
    </div>
  );
};

export default MigrationDashboardPage;
