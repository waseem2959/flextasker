/**
 * Breadcrumb Navigation Component
 * 
 * Provides hierarchical navigation with automatic path detection,
 * custom breadcrumb generation, and responsive design.
 */

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isCurrentPage?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  showHomeIcon?: boolean;
  showBackButton?: boolean;
  maxItems?: number;
  className?: string;
  onBack?: () => void;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items: customItems,
  showHomeIcon = true,
  showBackButton = false,
  maxItems = 5,
  className = '',
  onBack
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if no custom items provided
  const breadcrumbItems = useMemo(() => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Add home
    items.push({
      label: 'Home',
      href: '/',
      icon: showHomeIcon ? <Home className="w-4 h-4" /> : undefined
    });

    // Generate items from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      const label = formatSegmentLabel(segment, currentPath);
      
      items.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    });

    return items;
  }, [location.pathname, customItems, showHomeIcon]);

  // Truncate items if they exceed maxItems
  const displayItems = useMemo(() => {
    if (breadcrumbItems.length <= maxItems) {
      return breadcrumbItems;
    }

    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-2);
    const truncatedItems = [
      firstItem,
      { label: '...', href: undefined, isEllipsis: true },
      ...lastItems
    ];

    return truncatedItems;
  }, [breadcrumbItems, maxItems]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  if (displayItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Back Button */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mr-2 p-2"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Breadcrumb Items */}
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}

              {/* Breadcrumb Item */}
              {isEllipsis ? (
                <span className="text-gray-400 px-1">...</span>
              ) : item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-150"
                >
                  {item.icon && (
                    <span className="mr-1">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span 
                  className={`flex items-center ${
                    isLast 
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-600'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="mr-1">{item.icon}</span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Helper function to format path segments into readable labels
function formatSegmentLabel(segment: string, fullPath: string): string {
  // Handle specific route patterns
  const routeLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'tasks': 'Tasks',
    'create': 'Create Task',
    'edit': 'Edit',
    'profile': 'Profile',
    'settings': 'Settings',
    'messages': 'Messages',
    'notifications': 'Notifications',
    'admin': 'Administration',
    'users': 'Users',
    'analytics': 'Analytics',
    'reports': 'Reports',
    'billing': 'Billing',
    'help': 'Help & Support',
    'safety': 'Safety Center',
    'trending': 'Trending',
    'categories': 'Categories',
    'skills': 'Skills',
    'reviews': 'Reviews',
    'earnings': 'Earnings',
    'payments': 'Payments',
    'verification': 'Verification'
  };

  // Check if segment is a known route
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Handle UUID patterns (likely IDs)
  if (isUUID(segment)) {
    // Try to determine what kind of ID this might be based on the path
    if (fullPath.includes('/tasks/')) {
      return 'Task Details';
    } else if (fullPath.includes('/users/')) {
      return 'User Profile';
    } else if (fullPath.includes('/messages/')) {
      return 'Conversation';
    } else {
      return 'Details';
    }
  }

  // Handle URL-encoded segments
  try {
    const decoded = decodeURIComponent(segment);
    if (decoded !== segment) {
      return formatString(decoded);
    }
  } catch (e) {
    // Ignore decoding errors
  }

  // Convert kebab-case or snake_case to title case
  return formatString(segment);
}

// Helper function to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to format strings into title case
function formatString(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
    .trim();
}

// Pre-configured breadcrumb components for common pages

export const TaskDetailBreadcrumb: React.FC<{ 
  taskId: string; 
  taskTitle?: string;
  categoryName?: string;
}> = ({ 
  taskId, 
  taskTitle, 
  categoryName 
}) => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Browse Tasks', href: '/tasks' },
    ...(categoryName ? [{ label: categoryName, href: `/tasks?category=${categoryName}` }] : []),
    { label: taskTitle || `Task ${taskId.slice(0, 8)}...`, isCurrentPage: true }
  ];

  return <BreadcrumbNavigation items={items} showBackButton />;
};

export const DashboardBreadcrumb: React.FC<{ 
  section?: string;
  subsection?: string;
}> = ({ 
  section, 
  subsection 
}) => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Dashboard', href: '/dashboard' },
    ...(section ? [{ 
      label: formatString(section), 
      href: subsection ? `/dashboard/${section}` : undefined,
      isCurrentPage: !subsection 
    }] : []),
    ...(subsection ? [{ 
      label: formatString(subsection), 
      isCurrentPage: true 
    }] : [])
  ];

  return <BreadcrumbNavigation items={items} />;
};

export const AdminBreadcrumb: React.FC<{ 
  section?: string;
  subsection?: string;
}> = ({ 
  section, 
  subsection 
}) => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Administration', href: '/admin' },
    ...(section ? [{ 
      label: formatString(section), 
      href: subsection ? `/admin/${section}` : undefined,
      isCurrentPage: !subsection 
    }] : []),
    ...(subsection ? [{ 
      label: formatString(subsection), 
      isCurrentPage: true 
    }] : [])
  ];

  return <BreadcrumbNavigation items={items} />;
};

export const UserProfileBreadcrumb: React.FC<{ 
  userId: string;
  userName?: string;
  section?: string;
}> = ({ 
  userId, 
  userName, 
  section 
}) => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Users', href: '/users' },
    { 
      label: userName || `User ${userId.slice(0, 8)}...`, 
      href: section ? `/users/${userId}` : undefined,
      isCurrentPage: !section 
    },
    ...(section ? [{ 
      label: formatString(section), 
      isCurrentPage: true 
    }] : [])
  ];

  return <BreadcrumbNavigation items={items} showBackButton />;
};

export default BreadcrumbNavigation;