/**
 * Error Message Components
 * 
 * A set of components for displaying different types of errors consistently
 * across the application, following the error handling framework.
 */

import { useTheme } from '@/contexts/theme-context';
import { ErrorType } from '@/types/app-enums';
import { AppError } from '@/types/errors';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Convert any error to an AppError for consistent handling
 */
function normalizeError(error: Error | AppError | string): AppError {
  if (typeof error === 'string') {
    return new AppError(error);
  }
  
  if (error instanceof AppError) {
    return error;
  }
  
  return new AppError(error.message);
}

/**
 * Props for the ErrorMessage component
 */
export interface ErrorMessageProps {
  /**
   * The error to display
   */
  error: Error | AppError | string;
  
  /**
   * Callback to retry the operation that caused the error
   */
  onRetry?: () => void;
  
  /**
   * Whether to show a compact version of the error
   * @default false
   */
  compact?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
  
  /**
   * Optional title override
   */
  title?: string;
  
  /**
   * Optional message override
   */
  message?: string;
}

/**
 * Main error message component for displaying errors with action buttons
 */
export function ErrorMessage({
  error,
  onRetry,
  compact = false,
  className = '',
  testId = 'error-message',
  title: titleOverride,
  message: messageOverride
}: ErrorMessageProps): React.ReactElement {
  const { t } = useTranslation();
  useTheme(); // Theme context available but not used in this component
  
  // Normalize the error
  const appError = normalizeError(error);
  
  // Get error content based on error type
  const getErrorContent = () => {
    const errorType = appError.type;
    
    const title = titleOverride ?? t(`error.${errorType}.title`, { 
      defaultValue: t('error.unknown.title', 'Error') 
    });
    
    const message = messageOverride ?? t(`error.${errorType}.message`, { 
      defaultValue: appError.message || t('error.unknown.message', 'An error occurred') 
    });
    
    const action = t(`error.${errorType}.action`, { 
      defaultValue: t('error.retry', 'Try Again') 
    });
    
    return { title, message, action };
  };
  
  const { title, message, action } = getErrorContent();
  
  // Render compact version
  if (compact) {
    return (
      <div 
        className={`text-red-600 dark:text-red-400 rounded p-2 text-sm ${className}`}
        role="alert"
        data-testid={testId}
      >
        <div className="flex items-center">
          <svg 
            className="w-4 h-4 mr-2 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd"
            />
          </svg>
          <span>{message}</span>
        </div>
        
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-1 text-sm text-primary dark:text-primary-light font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            data-testid={`${testId}-retry`}
          >
            {action}
          </button>
        )}
      </div>
    );
  }
  
  // Render full version
  return (
    <div 
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 ${className}`}
      role="alert"
      data-testid={testId}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-500 dark:text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            <p>{message}</p>
            
            {appError.details && (
              <ul className="list-disc list-inside mt-2 text-xs">
                {Object.entries(appError.details).map(([key, value]) => (
                  <li key={key} className="ml-2">
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:hover:bg-red-700"
                data-testid={`${testId}-retry`}
              >
                {action}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the FieldError component
 */
export interface FieldErrorProps {
  /**
   * The error message to display
   */
  message: string;
  
  /**
   * Optional ID for accessibility
   */
  id?: string;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * Component for displaying form field validation errors
 */
export function FieldError({
  message,
  id,
  className = '',
  testId = 'field-error'
}: FieldErrorProps): React.ReactElement {
  return (
    <p 
      id={id}
      className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`}
      data-testid={testId}
    >
      {message}
    </p>
  );
}

/**
 * Props for the AsyncErrorHandler component
 */
export interface AsyncErrorHandlerProps {
  /**
   * Whether the async operation is loading
   */
  loading: boolean;
  
  /**
   * The error, if any
   */
  error: Error | null;
  
  /**
   * Callback to retry the operation
   */
  onRetry: () => void;
  
  /**
   * Content to render when there's no error and not loading
   */
  children: React.ReactNode;
  
  /**
   * Optional CSS class name for the loading spinner
   */
  loadingClassName?: string;
  
  /**
   * Optional CSS class name for the error message
   */
  errorClassName?: string;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * Component for handling loading and error states for async operations
 */
export function AsyncErrorHandler({
  loading,
  error,
  onRetry,
  children,
  loadingClassName = '',
  errorClassName = '',
  testId = 'async-handler'
}: AsyncErrorHandlerProps): React.ReactElement {
  if (loading) {
    return (
      <div 
        className={`flex justify-center items-center py-4 ${loadingClassName}`}
        data-testid={`${testId}-loading`}
        aria-live="polite"
      >
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={onRetry} 
        className={errorClassName}
        testId={`${testId}-error`}
      />
    );
  }
  
  return <>{children}</>;
}

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps {
  /**
   * Title for the empty state
   */
  title: string;
  
  /**
   * Description for the empty state
   */
  description: string;
  
  /**
   * Optional icon element
   */
  icon?: React.ReactNode;
  
  /**
   * Optional action button label
   */
  actionLabel?: string;
  
  /**
   * Optional action callback
   */
  onAction?: () => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional test ID for testing
   */
  testId?: string;
}

/**
 * Component for displaying empty states (no items, no results, etc.)
 */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
  testId = 'empty-state'
}: EmptyStateProps): React.ReactElement {
  return (
    <div 
      className={`text-center py-8 px-4 ${className}`}
      data-testid={testId}
    >
      {icon && (
        <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={onAction}
            data-testid={`${testId}-action`}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Create a specialized error message for a specific error type
 */
export function createErrorMessage(
  errorType: ErrorType,
  defaultProps?: Partial<ErrorMessageProps>
): React.FC<ErrorMessageProps> {
  const SpecializedErrorMessage: React.FC<ErrorMessageProps> = (props) => {
    // Force the specific error type by creating a new AppError
    const error = new AppError(
      props.error instanceof Error ? props.error.message : String(props.error),
      errorType
    );
    
    return (
      <ErrorMessage
        {...defaultProps}
        {...props}
        error={error}
      />
    );
  };
  
  return SpecializedErrorMessage;
}

// Pre-configured error messages for common error types
export const NetworkErrorMessage = createErrorMessage(ErrorType.NETWORK_ERROR);
export const AuthErrorMessage = createErrorMessage(ErrorType.AUTHENTICATION);
export const ValidationErrorMessage = createErrorMessage(ErrorType.VALIDATION);
export const NotFoundErrorMessage = createErrorMessage(ErrorType.NOT_FOUND);
export const ServerErrorMessage = createErrorMessage(ErrorType.SERVER_ERROR);

export default ErrorMessage;
