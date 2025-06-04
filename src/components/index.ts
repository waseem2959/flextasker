/**
 * Components Barrel Export
 * 
 * Centralized export point for all application components.
 * Organized by feature and complexity level for optimal tree-shaking.
 */

// === UI COMPONENTS (Atomic Design) ===
export * from './ui';

// === LAYOUT COMPONENTS ===
export * from './layout/Layout';

// === FEATURE COMPONENTS ===

// Authentication & User Management
export * from './protected-route';

// Task Management
export * from './task/task-card';
export * from './task/task-form';
export * from './task/task-list';

// Homepage Components
export * from './homepage/hero-section';

// Dashboard Components
export * from './dashboard/dashboard-stats';

// Notifications
export * from './notifications/notification-bell';

// Chat Components
export * from './chat/chat-interface';

// Status Components
export * from './status/connection-status';

// Monitoring Components
export * from './monitoring/monitoring-dashboard';

