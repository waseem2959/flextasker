/**
 * Standardized Page Header Component
 * 
 * Provides consistent page header styling and layout across the application
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  showBackButton = false,
  backUrl,
  className,
  children
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('border-b border-neutral-200 bg-white', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Back Button */}
          {showBackButton && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="inline-flex items-center space-x-2 text-neutral-600 hover:text-neutral-900"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 font-display">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-lg text-neutral-600 font-primary">
                  {subtitle}
                </p>
              )}
              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>

            {actions && (
              <div className="flex items-center space-x-3 ml-6">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = '7xl'
}) => {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
};

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  headerClassName?: string;
  containerClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  actions,
  showBackButton = false,
  backUrl,
  headerClassName,
  containerClassName,
  maxWidth = '7xl',
  children
}) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        showBackButton={showBackButton}
        backUrl={backUrl}
        className={headerClassName}
      />
      
      <main className="py-8">
        <PageContainer maxWidth={maxWidth} className={containerClassName}>
          {children}
        </PageContainer>
      </main>
    </div>
  );
};