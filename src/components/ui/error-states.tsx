import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  FileX,
  Home,
  RefreshCw,
  Server,
  ShieldAlert,
  Wifi
} from 'lucide-react';
import React from 'react';

// Base error component
interface ErrorStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  icon: Icon = AlertTriangle,
  actions,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('text-center py-12 px-4', className)}
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
          <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
        {actions && (
          <div className="space-y-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  onGoHome,
  className
}) => {
  return (
    <ErrorState
      title="Connection Problem"
      description="Unable to connect to our servers. Please check your internet connection and try again."
      icon={Wifi}
      className={className}
      actions={
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button variant="secondary" onClick={onGoHome} className="flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      }
    />
  );
};

// Server error component
interface ServerErrorProps {
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const ServerError: React.FC<ServerErrorProps> = ({
  onRetry,
  onGoBack,
  className
}) => {
  return (
    <ErrorState
      title="Server Error"
      description="Something went wrong on our end. Our team has been notified and is working to fix this issue."
      icon={Server}
      className={className}
      actions={
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button variant="secondary" onClick={onGoBack} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      }
    />
  );
};

// Not found error component
interface NotFoundErrorProps {
  title?: string;
  description?: string;
  onGoHome?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const NotFoundError: React.FC<NotFoundErrorProps> = ({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  onGoHome,
  onGoBack,
  className
}) => {
  return (
    <ErrorState
      title={title}
      description={description}
      icon={FileX}
      className={className}
      actions={
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onGoHome && (
            <Button onClick={onGoHome} className="flex items-center">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
          {onGoBack && (
            <Button variant="secondary" onClick={onGoBack} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      }
    />
  );
};

// Permission error component
interface PermissionErrorProps {
  onLogin?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({
  onLogin,
  onGoBack,
  className
}) => {
  return (
    <ErrorState
      title="Access Denied"
      description="You don't have permission to access this page. Please sign in or contact support if you believe this is an error."
      icon={ShieldAlert}
      className={className}
      actions={
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onLogin && (
            <Button onClick={onLogin} className="flex items-center">
              Sign In
            </Button>
          )}
          {onGoBack && (
            <Button variant="secondary" onClick={onGoBack} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      }
    />
  );
};

// Inline error component for forms and smaller areas
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('flex items-center space-x-2 text-error text-sm mt-2', className)}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
};

// Error card component
interface ErrorCardProps {
  title: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  description,
  onRetry,
  className
}) => {
  return (
    <Card className={cn('border-error/20', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-error" />
        </div>
        <CardTitle className="text-error">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-text-secondary mb-4">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Empty state component (not exactly an error, but related)
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FileX,
  action,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('text-center py-12 px-4', className)}
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-text-secondary" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>
          <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
        {action}
      </div>
    </motion.div>
  );
};

// Error boundary fallback component
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
  className
}) => {
  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4', className)}>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>
          <CardTitle className="text-error">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-text-secondary">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-surface p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-text-secondary overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/'}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

