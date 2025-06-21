/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
    
    // Report to analytics/monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-neutral-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-neutral-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page or going back to the homepage.
              </p>
              
              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-neutral-100 rounded-md text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-neutral-600">
                      <summary className="cursor-pointer hover:text-neutral-800">
                        Component Stack
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async Error Boundary for handling async errors
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface AsyncErrorBoundaryState {
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  state: AsyncErrorBoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Async error caught:', error, errorInfo);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) {
        return <>{fallback(error, this.retry)}</>;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Async operation failed
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error.message}
              </p>
              <Button
                onClick={this.retry}
                size="sm"
                variant="outline"
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { resetError, captureError };
}

// Route Error Boundary for specific routes
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Failed to load this page
            </h2>
            <p className="text-neutral-600 mb-4">
              Please check your connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}