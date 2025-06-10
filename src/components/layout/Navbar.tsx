import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getInitials } from '@/services/user';
import { UserRole } from '@/types';
import { Bell, LogOut, Menu, Settings, User as UserIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };



  // Helper function to determine if user is a client
  // This bridges the gap between your data model (CLIENT/TASKER) and UI logic (client/tasker)
  // It's a semantic adapter that makes your component logic more readable
  const isUserClient = (): boolean => {
    // Use the unified UserRole enum for type safety
    // CLIENT role in your system represents clients who post tasks
    return (user as any)?.role === UserRole.USER;
  };

  // Helper function to safely handle avatar URLs that might be null
  // This converts null to undefined to match the AvatarImage component's expectations
  // It demonstrates defensive programming - handling edge cases gracefully
  const getAvatarSrc = (avatarUrl: string | null | undefined): string | undefined => {
    // Convert null to undefined since AvatarImage expects string | undefined
    // This is a common pattern when interfacing between different type expectations
    return avatarUrl ?? undefined;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity py-2">
                <img
                  src="/flextasker.svg"
                  alt="FlexTasker - Get things done with trusted local experts"
                  className="h-8 w-auto"
                  loading="eager"
                />
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink
                to="/tasks"
                className={({isActive}) => cn(
                  'inline-flex items-center px-3 py-2 h-16 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary-600 text-neutral-900'
                    : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                )}
              >
                Find Tasks
              </NavLink>
              
              {isAuthenticated && (
                <>
                  {/* FIXED: Use semantic helper function instead of direct string comparison */}
                  {/* This makes the code more maintainable and self-documenting */}
                  {isUserClient() && (
                    <NavLink
                      to="/post-task"
                      className={({isActive}) => cn(
                        'inline-flex items-center px-3 py-2 h-16 border-b-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-primary-600 text-neutral-900'
                          : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                      )}
                    >
                      Post a Task
                    </NavLink>
                  )}
                  <NavLink
                    to="/dashboard"
                    className={({isActive}) => cn(
                      'inline-flex items-center px-3 py-2 h-16 border-b-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary-600 text-neutral-900'
                        : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                    )}
                  >
                    Dashboard
                  </NavLink>
                </>
              )}
              
              <NavLink
                to="/how-it-works"
                className={({isActive}) => cn(
                  'inline-flex items-center px-3 py-2 h-16 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary-600 text-neutral-900'
                    : 'border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                )}
              >
                How It Works
              </NavLink>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="relative h-10 w-10" onClick={() => navigate('/notifications')}>
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-8 w-8">
                        {/* FIXED: Use helper function to safely convert null to undefined */}
                        {/* This ensures type compatibility with the AvatarImage component */}
                        <AvatarImage src={getAvatarSrc((user as any)?.avatar)} alt={`${(user as any)?.firstName} ${(user as any)?.lastName}`} />
                        <AvatarFallback>
                          {(user as any)?.firstName && (user as any)?.lastName
                            ? getInitials(`${(user as any).firstName} ${(user as any).lastName}`)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-neutral-900">{(user as any)?.firstName} {(user as any)?.lastName}</p>
                        <p className="text-xs text-neutral-600">{(user as any)?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 h-10"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-primary-600 hover:bg-primary-700 text-neutral-700 font-bold px-6 h-10 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            {isMenuOpen ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-600 transition-colors"
                aria-expanded="true"
                aria-controls="mobile-menu"
                aria-label="Close main menu"
              >
                <span className="sr-only">Close menu</span>
                <X className="block h-6 w-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-600 transition-colors"
                aria-expanded="false"
                aria-controls="mobile-menu"
                aria-label="Open main menu"
              >
                <span className="sr-only">Open menu</span>
                <Menu className="block h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={isMenuOpen ? "sm:hidden" : "hidden"} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:bg-primary-50 hover:border-neutral-300 hover:text-neutral-900'
              )
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Find Tasks
          </NavLink>
          
          {isAuthenticated && (
            <>
              {/* FIXED: Apply the same semantic helper function pattern here */}
              {/* This ensures consistency across both desktop and mobile navigation */}
              {isUserClient() && (
                <NavLink
                  to="/post-task"
                  className={({ isActive }) =>
                    cn(
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 border-primary-600 text-primary-700'
                        : 'border-transparent text-neutral-600 hover:bg-primary-50 hover:border-neutral-300 hover:text-neutral-900'
                    )
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Post a Task
                </NavLink>
              )}
              
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 border-primary-600 text-primary-700'
                      : 'border-transparent text-neutral-600 hover:bg-primary-50 hover:border-neutral-300 hover:text-neutral-900'
                  )
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </NavLink>
            </>
          )}
          
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:bg-primary-50 hover:border-neutral-300 hover:text-neutral-900'
              )
            }
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </NavLink>
        </div>
        
        <div className="pt-4 pb-3 border-t border-neutral-200">
          {isAuthenticated ? (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    {/* FIXED: Apply the same avatar src fix in the mobile menu */}
                    {/* This ensures consistent behavior across all avatar instances */}
                    <AvatarImage src={getAvatarSrc((user as any)?.avatar)} alt={`${(user as any)?.firstName} ${(user as any)?.lastName}`} />
                    <AvatarFallback>
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? getInitials(`${(user as any).firstName} ${(user as any).lastName}`)
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-900">{(user as any)?.firstName} {(user as any)?.lastName}</div>
                  <div className="text-sm font-medium text-neutral-600">{(user as any)?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 w-full text-left transition-colors"
                >
                  Your Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 w-full text-left transition-colors"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-primary-50 w-full text-left transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 flex flex-col space-y-2">
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }}
                variant="ghost"
                className="justify-center"
              >
                Log in
              </Button>
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/register');
                }}
                variant="default"
                className="justify-center"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
