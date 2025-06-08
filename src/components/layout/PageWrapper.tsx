import React from 'react';
import { Layout } from './Layout';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  containerClassName?: string;
  hideFooter?: boolean;
}

/**
 * PageWrapper - Consistent page layout component
 * 
 * Provides standardized page structure with:
 * - Layout component (navbar + footer)
 * - Container with consistent padding
 * - Optional page title and subtitle
 * - Consistent spacing and typography
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  subtitle,
  className = '',
  containerClassName = '',
  hideFooter = false,
}) => {
  return (
    <Layout hideFooter={hideFooter}>
      <div className={`min-h-screen bg-neutral-50 ${className}`}>
        <div className={`container mx-auto px-4 py-8 ${containerClassName}`}>
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-neutral-600 font-body max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </Layout>
  );
};

/**
 * AdminPageWrapper - Specialized wrapper for admin pages
 * 
 * Provides admin-specific styling and layout
 */
export const AdminPageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  subtitle,
  className = '',
  containerClassName = '',
}) => {
  return (
    <PageWrapper
      title={title}
      subtitle={subtitle}
      className={`bg-neutral-50 ${className}`}
      containerClassName={containerClassName}
    >
      {children}
    </PageWrapper>
  );
};

/**
 * AuthPageWrapper - Specialized wrapper for auth pages (login, register)
 * 
 * Provides centered layout for authentication forms
 */
export const AuthPageWrapper: React.FC<{
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}> = ({ children, title, subtitle }) => {
  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {(title || subtitle) && (
            <div className="text-center">
              {title && (
                <h1 className="text-3xl font-bold text-neutral-900 font-heading mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-neutral-600 font-body">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default PageWrapper;
