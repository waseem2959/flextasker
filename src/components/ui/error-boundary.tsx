/**
 * Enhanced Error Boundary Component
 * 
 * This component implements the error handling patterns defined in ERROR-HANDLING-FRAMEWORK.md
 * and follows the component architecture guidelines from COMPONENT-ARCHITECTURE.md.
 */

import { useTheme } from '@/contexts/theme-context';
import { AppError, ErrorFactory, ErrorType } from '@/types/errors';
import { announce } from '@/utils/accessibility';
// Error logging removed for simplicity
import React, { Component, ErrorInfo, ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /**
   * Children components that will be rendered normally if no errors occur
   */
  children: ReactNode;
  
  /**
   * Optional custom fallback UI to show when an error occurs
   */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  
  /**
   * Optional callback for when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /**
   * Whether to show detailed error information
   * @default false in production, true in development
   */
  showDetails?: boolean;
  
  /**
   * Only catch errors of specific type
   * When specified, other error types will be rethrown to parent error boundaries
   */
  errorType?: ErrorType;
  
  /**
   * Additional context for error reporting
   */
  errorContext?: Record<string, any>;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
  
  /**
   * Optional CSS class for the error container
   */
  className?: string;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * The core error boundary component (class component required for error boundaries)
 */
class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Convert to AppError for consistent handling
    const appError = error instanceof AppError 
      ? error 
      : ErrorFactory.createFromError(error);
    
    // Log the error to the console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by ErrorBoundary:', appError);
      console.error('Component stack:', errorInfo.componentStack);
    }
    
    // Error logging simplified
    console.error('React Error Boundary:', appError, {
      componentStack: errorInfo.componentStack,
      ...this.props.errorContext
    });
    
    // Update state with error details
    this.setState({ 
      errorInfo, 
      // Store the normalized error in state
      error: appError 
    });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
    
    // Announce error to screen readers
    announce(`Error: ${appError.message}`, 'assertive');
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    
    // If there's an errorType specified and it doesn't match, let the error propagate
    if (hasError && error && this.props.errorType) {
      const appError = error instanceof AppError 
        ? error 
        : ErrorFactory.createFromError(error);
      
      if (appError.type !== this.props.errorType) {
        throw error;
      }
    }
    
    if (hasError && error) {
      // If a custom fallback function was provided, use that
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(error, this.resetError);
      }
      
      // If a custom fallback element was provided, use that
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, use our default error UI
      return (
        <ErrorFallbackUI 
          error={error} 
          errorInfo={this.state.errorInfo} 
          showDetails={this.props.showDetails} 
          onReset={this.resetError}
          testId={this.props.testId}
          className={this.props.className}
        />
      );
    }
    
    // If there's no error, render the children
    return this.props.children;
  }
}

/**
 * Props for the fallback UI
 */
interface ErrorFallbackUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  showDetails?: boolean;
  onReset: () => void;
  testId?: string;
  className?: string;
}

/**
 * Default fallback UI for errors
 */
const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({ 
  error, 
  errorInfo, 
  showDetails = process.env.NODE_ENV !== 'production', 
  onReset,
  testId = 'error-boundary',
  className = '',
}) => {
  const { t } = useTranslation();
  useTheme(); // Theme context available but not used in this component
  
  // Convert to AppError if needed
  const appError = error instanceof AppError 
    ? error 
    : ErrorFactory.createFromError(error);
  
  // Get error message based on error type
  const getErrorContent = () => {
    const errorType = appError.type;
    
    const title = t(`error.${errorType}.title`, { 
      defaultValue: t('error.unknown.title', 'Something went wrong') 
    });
    
    const message = t(`error.${errorType}.message`, { 
      defaultValue: t('error.unknown.message', 'The application encountered an error.') 
    });
    
    const action = t(`error.${errorType}.action`, { 
      defaultValue: t('error.unknown.action', 'Try again') 
    });
    
    return { title, message, action };
  };
  
  const { title, message, action } = getErrorContent();
  
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${className}`} 
      role="alert" 
      aria-live="assertive"
      data-testid={testId}
    >
      <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
        {title}
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        {message}
      </p>
      
      {showDetails && (
        <div className="mb-6">
          <details className="bg-gray-50 dark:bg-slate-900 rounded p-3">
            <summary className="cursor-pointer font-medium text-sm">
              {t('error.details.show', 'Show technical details')}
            </summary>
            <div className="mt-3 text-sm font-mono break-all whitespace-pre-wrap text-gray-600 dark:text-gray-400">
              <p><strong>{t('error.details.type', 'Type')}:</strong> {appError.type}</p>
              <p><strong>{t('error.details.code', 'Code')}:</strong> {appError.code}</p>
              <p><strong>{t('error.details.message', 'Message')}:</strong> {appError.message}</p>
              
              {appError.details && (
                <p className="mt-2">
                  <strong>{t('error.details.additionalInfo', 'Additional Info')}:</strong> 
                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                    {JSON.stringify(appError.details, null, 2)}
                  </pre>
                </p>
              )}
              
              {errorInfo && (
                <div className="mt-2">
                  <strong>{t('error.details.componentStack', 'Component Stack')}:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-slate-800 rounded text-xs overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
          aria-label={action}
          data-testid={`${testId}-reset`}
        >
          {action}
        </button>
        
        <button
          type="button"
          onClick={handleReload}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
          aria-label={t('error.reload', 'Reload page')}
          data-testid={`${testId}-reload`}
        >
          {t('error.reload', 'Reload page')}
        </button>
        
        <a 
          href="/"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
          aria-label={t('error.goHome', 'Go to home page')}
          data-testid={`${testId}-home`}
        >
          {t('error.goHome', 'Go to home page')}
        </a>
      </div>
    </div>
  );
};

/**
 * The main ErrorBoundary component with theming
 */
export function ErrorBoundary(props: ErrorBoundaryProps): React.ReactElement {
  return <ErrorBoundaryBase {...props} />;
}

/**
 * Higher-order component for wrapping components with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = Component.displayName ?? (Component.name || 'Component');
  
  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return ComponentWithErrorBoundary;
}

/**
 * Hook for programmatically throwing errors (useful for testing error handling)
 */
export function useErrorBoundary(): (error: Error) => void {
  const [, setError] = useState<Error | null>(null);
  
  const throwError = useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
  
  return throwError;
}

/**
 * Specialized error boundary for API errors
 */
export function ApiErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'errorType'>): React.ReactElement {
  return (
    <ErrorBoundary 
      errorType={ErrorType.SERVER}
      errorContext={{ source: 'api' }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized error boundary for authentication errors
 */
export function AuthErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'errorType'>): React.ReactElement {
  return (
    <ErrorBoundary 
      errorType={ErrorType.AUTHENTICATION} 
      errorContext={{ source: 'auth' }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized error boundary for form validation errors
 */
export function FormErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'errorType'>): React.ReactElement {
  return (
    <ErrorBoundary 
      errorType={ErrorType.VALIDATION} 
      errorContext={{ source: 'form' }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized error boundary for page-level errors (route-level boundary)
 */
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'fallback'>): React.ReactElement {
  const pageFallback = (error: Error, resetError: () => void) => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <ErrorFallbackUI 
          error={error} 
          errorInfo={null} 
          onReset={resetError}
          className="w-full"
        />
      </div>
    </div>
  );
  
  return (
    <ErrorBoundary 
      fallback={pageFallback} 
      errorContext={{ source: 'page' }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specialized error boundary for component-level errors
 */
export function ComponentErrorBoundary({ 
  children, 
  componentName,
  ...props 
}: Omit<ErrorBoundaryProps, 'errorContext'> & { componentName: string }): React.ReactElement {
  return (
    <ErrorBoundary 
      errorContext={{ 
        source: 'component',
        componentName
      }}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
