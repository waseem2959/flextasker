/**
 * Skip Navigation Component
 * 
 * Provides a "Skip to main content" link for keyboard users
 * Essential for accessibility compliance
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipNavigationProps {
  mainContentId?: string;
  className?: string;
}

export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  mainContentId = 'main-content',
  className
}) => {
  return (
    <a
      href={`#${mainContentId}`}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'bg-primary-600 text-white px-4 py-2 rounded-md font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
    >
      Skip to main content
    </a>
  );
};

interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  id = 'main-content',
  className
}) => {
  return (
    <main
      id={id}
      tabIndex={-1}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </main>
  );
};