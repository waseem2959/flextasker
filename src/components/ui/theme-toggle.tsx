/**
 * Theme Toggle Component
 * 
 * Provides a toggle button for switching between light, dark, and system themes.
 * Includes proper accessibility support and smooth animations.
 */

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/contexts/theme-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'dropdown',
  size = 'md',
  showLabel = false
}) => {
  const { theme, setTheme, isDarkMode } = useTheme();

  // Size classes for icons
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Get current theme icon
  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <Monitor className={iconSizeClasses[size]} />;
    }
    return isDarkMode ? 
      <Moon className={iconSizeClasses[size]} /> : 
      <Sun className={iconSizeClasses[size]} />;
  };

  // Simple toggle button (cycles through light -> dark -> system)
  if (variant === 'button') {
    const handleToggle = () => {
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'dark') {
        setTheme('system');
      } else {
        setTheme('light');
      }
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={cn(
          'transition-all duration-200 hover:scale-105',
          className
        )}
        aria-label={`Current theme: ${theme}. Click to cycle themes.`}
      >
        <div className="relative">
          {getCurrentIcon()}
          <span className="sr-only">
            {theme === 'light' ? 'Switch to dark theme' :
             theme === 'dark' ? 'Switch to system theme' :
             'Switch to light theme'}
          </span>
        </div>
        {showLabel && (
          <span className="ml-2 text-sm capitalize">
            {theme}
          </span>
        )}
      </Button>
    );
  }

  // Dropdown menu variant with all options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'transition-all duration-200 hover:scale-105',
            className
          )}
          aria-label="Toggle theme"
        >
          {getCurrentIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'light' && 'bg-accent'
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'dark' && 'bg-accent'
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'system' && 'bg-accent'
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Compact inline toggle for spaces where dropdown isn't suitable
interface CompactThemeToggleProps {
  className?: string;
}

export const CompactThemeToggle: React.FC<CompactThemeToggleProps> = ({
  className
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};

export default ThemeToggle;