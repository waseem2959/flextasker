/**
 * Toast Notification Component
 * 
 * A system for displaying temporary notifications (toasts) to users.
 * Follows accessibility best practices and integrates with our error handling system.
 */

import { ErrorType } from '../../types/app-enums';
import { AppError } from '../../types/errors';
// Error utils removed for simplicity
import React, { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast variant types
 */
export type ToastVariant = 'default' | 'destructive' | 'success' | 'error' | 'warning' | 'info';

/**
 * Base toast data structure
 */
export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

/**
 * Context for the toast system
 */
interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  updateToast: (id: string, data: Partial<ToastData>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to use the toast system
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { addToast, removeToast, updateToast, removeAllToasts } = context;
  
  // Pre-configured toast functions
  const success = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'success', ...options });
  }, [addToast]);
  
  const error = useCallback((error: Error | AppError | string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => {
    const message = typeof error === 'string'
      ? error
      : error.message || 'An error occurred';
    
    return addToast({ 
      message, 
      variant: 'error', 
      title: typeof error === 'string' ? undefined : 'Error', 
      ...options 
    });
  }, [addToast]);
  
  const warning = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'warning', ...options });
  }, [addToast]);
  
  const info = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => {
    return addToast({ message, variant: 'info', ...options });
  }, [addToast]);
  
  // Error variant that creates a toast from an AppError
  const errorFromAppError = useCallback((appError: AppError, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => {
    let title: string;
    
    // Use error type to determine title
    switch (appError.type) {
      case ErrorType.AUTHENTICATION:
        title = 'Authentication Error';
        break;
      case ErrorType.AUTHORIZATION:
        title = 'Permission Error';
        break;
      case ErrorType.VALIDATION:
        title = 'Validation Error';
        break;
      case ErrorType.NETWORK_ERROR:
        title = 'Network Error';
        break;
      case ErrorType.SERVER_ERROR:
        title = 'Server Error';
        break;
      default:
        title = 'Error';
    }
    
    return error(appError, { title, ...options });
  }, [error]);
  
  return {
    success,
    error,
    warning,
    info,
    errorFromAppError,
    dismiss: removeToast,
    dismissAll: removeAllToasts,
    update: updateToast,
  };
}

/**
 * Props for the ToastProvider component
 */
interface ToastProviderProps {
  children: React.ReactNode;
  /**
   * Default auto-close duration in milliseconds
   * @default 5000 (5 seconds)
   */
  defaultDuration?: number;
  /**
   * Maximum number of toasts to show at once
   * @default 5
   */
  maxToasts?: number;
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Provider component for the toast system
 */
export function ToastProvider({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
  position = 'bottom-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // Add a new toast
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prev => {
      // Limit the number of toasts
      const newToasts = [...prev, { id, ...toast }];
      
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts);
      }
      
      return newToasts;
    });
    
    return id;
  }, [maxToasts]);
  
  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Remove all toasts
  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Update a toast
  const updateToast = useCallback((id: string, data: Partial<ToastData>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...data } : toast
    ));
  }, []);
  
  // Position classes for the container
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default: // bottom-right
        return 'bottom-4 right-4';
    }
  };
  
  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    updateToast,
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed z-50 flex flex-col ${getPositionClasses()}`} 
          role="region"
          aria-label="Notifications"
        >
          {toasts.map(toast => (
            <Toast 
              key={toast.id} 
              {...toast} 
              onClose={() => {
                if (toast.onClose) toast.onClose();
                removeToast(toast.id);
              }}
              defaultDuration={defaultDuration}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

/**
 * Props for the Toast component
 */
interface ToastProps extends ToastData {
  onClose: () => void;
  defaultDuration: number;
}

/**
 * Individual toast component
 */
const Toast: React.FC<ToastProps> = ({
  message,
  variant,
  title,
  autoClose = true,
  duration,
  onClose,
  defaultDuration,
}) => {
  const toastId = useId();
  
  // Auto-close the toast after duration
  useEffect(() => {
    if (!autoClose) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration ?? defaultDuration);
    
    return () => clearTimeout(timer);
  }, [autoClose, duration, defaultDuration, onClose]);
  
  // Get variant-specific styles and icons
  const getVariantStyles = (): { className: string; icon: React.ReactNode } => {
    switch (variant) {
      case 'success':
        return {
          className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          icon: (
            <svg className="w-5 h-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'error':
        return {
          className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: (
            <svg className="w-5 h-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'warning':
        return {
          className: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          icon: (
            <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'info':
      default:
        return {
          className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          icon: (
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
        };
    }
  };
  
  const { className, icon } = getVariantStyles();
  
  return (
    <div
      id={toastId}
      className={`flex items-start w-80 border rounded-lg shadow-md mb-2 p-4 animate-slide-in ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="ml-3 flex-1">
        {title && (
          <h3 className="text-sm font-medium">
            {title}
          </h3>
        )}
        <div className={`text-sm ${title ? 'mt-1' : ''}`}>
          {message}
        </div>
      </div>
      <button
        type="button"
        className="ml-2 -mt-1 -mr-1 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Export individual components for compatibility
export { Toast };
export const ToastClose = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="toast-close">×</button>
);
export const ToastDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="toast-description">{children}</div>
);
export const ToastTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="toast-title">{children}</h3>
);
export const ToastViewport = ({ children }: { children: React.ReactNode }) => (
  <div className="toast-viewport">{children}</div>
);

export default ToastProvider;
