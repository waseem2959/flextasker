/**
 * Application Routes
 * 
 * This module defines all the routes for the Flextasker application.
 * It centralizes route definitions to avoid hardcoding paths throughout the app.
 */

import { UserRole } from '../../shared/types/enums';

// Route configuration type
export interface RouteConfig {
  path: string;
  label: string;
  roles?: UserRole[];
  showInNav?: boolean;
  icon?: string;
  children?: RouteConfig[];
}

// Define main routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Task routes
  TASKS: '/tasks',
  TASK_DETAIL: (id: string = ':id') => `/tasks/${id}`,
  TASK_CREATE: '/tasks/create',
  TASK_EDIT: (id: string = ':id') => `/tasks/${id}/edit`,
  
  // Bid routes
  BIDS: '/bids',
  BID_DETAIL: (id: string = ':id') => `/bids/${id}`,
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_TASKS: '/admin/tasks',
  ADMIN_MIGRATION: '/admin/migration-dashboard',
};

// Navigation routes configuration
export const navRoutes: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    label: 'Home',
    showInNav: true,
    icon: 'home'
  },
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    showInNav: true,
    icon: 'dashboard',
    roles: [UserRole.USER, UserRole.TASKER, UserRole.ADMIN]
  },
  {
    path: ROUTES.TASKS,
    label: 'Tasks',
    showInNav: true,
    icon: 'task',
    roles: [UserRole.USER, UserRole.TASKER, UserRole.ADMIN]
  },
  {
    path: ROUTES.PROFILE,
    label: 'Profile',
    showInNav: true,
    icon: 'person',
    roles: [UserRole.USER, UserRole.TASKER, UserRole.ADMIN]
  },
  {
    path: ROUTES.ADMIN,
    label: 'Admin',
    showInNav: true,
    icon: 'admin_panel_settings',
    roles: [UserRole.ADMIN],
    children: [
      {
        path: ROUTES.ADMIN_DASHBOARD,
        label: 'Dashboard',
        showInNav: true,
        icon: 'dashboard',
        roles: [UserRole.ADMIN]
      },
      {
        path: ROUTES.ADMIN_USERS,
        label: 'Users',
        showInNav: true,
        icon: 'people',
        roles: [UserRole.ADMIN]
      },
      {
        path: ROUTES.ADMIN_TASKS,
        label: 'Tasks',
        showInNav: true,
        icon: 'task',
        roles: [UserRole.ADMIN]
      },
      {
        path: ROUTES.ADMIN_MIGRATION,
        label: 'Migration Dashboard',
        showInNav: true,
        icon: 'trending_up',
        roles: [UserRole.ADMIN]
      }
    ]
  }
];

export default ROUTES;
