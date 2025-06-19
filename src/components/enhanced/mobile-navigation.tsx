/**
 * Enhanced Mobile Navigation
 * 
 * Accessible mobile navigation with:
 * - Proper ARIA attributes and roles
 * - Keyboard navigation support
 * - Touch-friendly interactions
 * - Screen reader compatibility
 * - Search integration and user context
 * - Quick actions and smooth animations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Home, 
  Briefcase, 
  MessageSquare, 
  Settings,
  Plus,
  ChevronRight,
  MapPin,
  Star,
  Shield,
  HelpCircle,
  LogOut,
  DollarSign,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../accessibility/accessibility-provider';
import { i18nService } from '../../../shared/services/i18n-service';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '../ui/sheet';
import { useAuth } from '../../hooks/use-auth';
import { useNotifications } from '../../hooks/use-notifications';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

interface MobileNavigationProps {
  className?: string;
  showSearch?: boolean;
  onSearchFocus?: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: <Home className="w-5 h-5" />
  },
  {
    id: 'tasks',
    label: 'Browse Tasks',
    href: '/tasks',
    icon: <Briefcase className="w-5 h-5" />
  },
  {
    id: 'my-tasks',
    label: 'My Tasks',
    href: '/dashboard/tasks',
    icon: <Clock className="w-5 h-5" />,
    requiresAuth: true
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
    requiresAuth: true
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/dashboard/earnings',
    icon: <DollarSign className="w-5 h-5" />,
    requiresAuth: true
  },
  {
    id: 'trending',
    label: 'Trending',
    href: '/trending',
    icon: <TrendingUp className="w-5 h-5" />
  }
];

const userMenuItems = [
  {
    id: 'profile',
    label: 'My Profile',
    href: '/profile',
    icon: <User className="w-4 h-4" />
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-4 h-4" />
  },
  {
    id: 'help',
    label: 'Help & Support',
    href: '/help',
    icon: <HelpCircle className="w-4 h-4" />
  },
  {
    id: 'safety',
    label: 'Safety Center',
    href: '/safety',
    icon: <Shield className="w-4 h-4" />
  }
];

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className = '',
  showSearch = true,
  onSearchFocus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { settings, actions } = useAccessibility();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Handle escape key to close menus
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showUserMenu) {
          setShowUserMenu(false);
        } else if (isOpen) {
          setIsOpen(false);
          // Return focus to menu button
          if (menuButtonRef.current) {
            menuButtonRef.current.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showUserMenu]);

  // Focus management for menu opening
  const handleMenuOpen = useCallback(() => {
    setIsOpen(true);
    actions.announce(i18nService.translate('accessibility.navigationOpened'));
    
    // Focus first menu item after animation completes
    setTimeout(() => {
      if (firstMenuItemRef.current) {
        firstMenuItemRef.current.focus();
      }
    }, 300);
  }, [actions]);

  // Focus management for menu closing
  const handleMenuClose = useCallback(() => {
    setIsOpen(false);
    actions.announce(i18nService.translate('accessibility.navigationClosed'));
    
    // Return focus to menu button
    if (menuButtonRef.current) {
      menuButtonRef.current.focus();
    }
  }, [actions]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    onSearchFocus?.();
  };

  // Filter navigation items based on auth status
  const visibleNavItems = navigationItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.adminOnly && !user?.isAdmin) return false;
    return true;
  });

  // Get current page indicator
  const isActivePage = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className={`lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                ref={menuButtonRef}
                variant="ghost" 
                size="sm" 
                className="p-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={i18nService.translate('accessibility.openMenu')}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation-menu"
              >
                <Menu className="w-6 h-6" aria-hidden="true" />
                <span className="sr-only">
                  {isOpen 
                    ? i18nService.translate('accessibility.closeMenu') 
                    : i18nService.translate('accessibility.openMenu')
                  }
                </span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.svg" 
              alt="Flextasker" 
              className="h-8 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Flextasker
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => navigate('/notifications')}
                aria-label={
                  unreadCount > 0 
                    ? i18nService.translate('notifications.unreadCount', { count: unreadCount })
                    : i18nService.translate('navigation.notifications')
                }
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">
                  {unreadCount > 0 
                    ? i18nService.translate('notifications.unreadCount', { count: unreadCount })
                    : i18nService.translate('navigation.notifications')
                  }
                </span>
              </Button>
            )}

            {/* User Avatar / Login */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => setShowUserMenu(true)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search tasks, skills, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="pl-10 pr-4 w-full"
              />
            </form>
          </div>
        )}
      </header>

      {/* Side Navigation Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                {isAuthenticated && (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate('/task/create');
                      setIsOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Post Task
                  </Button>
                )}
              </div>
              
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3 pt-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                      <span>{user.rating || '0.0'}</span>
                      {user.location && (
                        <>
                          <span className="mx-2">•</span>
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{user.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SheetHeader>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`
                      flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium transition-colors
                      ${isActivePage(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Quick Stats for authenticated users */}
              {isAuthenticated && user && (
                <div className="mt-6 px-3">
                  <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-900">
                        Active Tasks
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {user.stats?.activeTasks || 0}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">
                        Completed
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {user.stats?.completedTasks || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate('/login');
                      setIsOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/register');
                      setIsOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="ml-3">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* User Menu Sheet */}
      {isAuthenticated && (
        <Sheet open={showUserMenu} onOpenChange={setShowUserMenu}>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Account</SheetTitle>
            </SheetHeader>
            
            <div className="py-6">
              {/* User Profile Summary */}
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{user?.name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{user?.rating || '0.0'}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({user?.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Balance */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Available Balance</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${user?.balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                {userMenuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3 font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="ml-3 font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default MobileNavigation;