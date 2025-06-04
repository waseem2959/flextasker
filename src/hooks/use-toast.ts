import React from 'react';

/**
 * Toast variant types
 */
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

/**
 * Toast action interface
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * Toast props interface
 */
export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  onDismiss?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Toast type for the hook
 */
type Toast = Omit<ToastProps, 'id'> & { id: string };

/**
 * Toast state interface
 */
interface ToastState {
  toasts: Toast[];
}

/**
 * Toast action types
 */
type ToastActionType =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; id: string; toast: Partial<Toast> }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'REMOVE_TOAST'; id: string };

/**
 * Toast reducer
 */
function toastReducer(state: ToastState, action: ToastActionType): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts],
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, ...action.toast } : toast
        ),
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, open: false } : toast
        ),
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    default:
      return state;
  }
}

/**
 * Toast context
 */
interface ToastContextValue {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  update: (id: string, props: Partial<Toast>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast provider props
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });

  const toast = React.useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      open: true,
      ...props,
    };

    dispatch({ type: 'ADD_TOAST', toast: newToast });

    // Auto dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST', id });
      }, newToast.duration);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: 'DISMISS_TOAST', id });
  }, []);

  const update = React.useCallback((id: string, props: Partial<Toast>) => {
    dispatch({ type: 'UPDATE_TOAST', id, toast: props });
  }, []);

  // Remove toast after animation
  React.useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.toasts.forEach((toast) => {
      if (toast.open === false) {
        const timeout = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', id: toast.id });
        }, 200); // Animation duration
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.toasts]);

  const value: ToastContextValue = {
    toasts: state.toasts,
    toast,
    dismiss,
    update,
  };

  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

/**
 * Hook to use toast functionality
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Standalone toast function for convenience
 */
let toastFunction: ((props: Omit<Toast, 'id'>) => void) | undefined;

export function setToastFunction(fn: (props: Omit<Toast, 'id'>) => void) {
  toastFunction = fn;
}

/**
 * Simple toast function that can be used outside of React components
 */
export function toast(props: Omit<Toast, 'id'> | string) {
  if (!toastFunction) {
    console.warn('Toast function not initialized. Make sure ToastProvider is mounted.');
    return;
  }

  if (typeof props === 'string') {
    toastFunction({ description: props });
  } else {
    toastFunction(props);
  }
}

/**
 * Convenience toast methods
 */
toast.success = (message: string, title?: string) => {
  toast({
    title,
    description: message,
    variant: 'success',
  });
};

toast.error = (message: string, title?: string) => {
  toast({
    title,
    description: message,
    variant: 'destructive',
  });
};

toast.warning = (message: string, title?: string) => {
  toast({
    title,
    description: message,
    variant: 'warning',
  });
};

toast.info = (message: string, title?: string) => {
  toast({
    title,
    description: message,
    variant: 'info',
  });
};

/**
 * Toast styles based on variant
 */
export const toastVariantStyles = {
  default: 'border bg-background text-foreground',
  destructive: 'destructive border-destructive bg-destructive text-destructive-foreground',
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
};

/**
 * Hook to get toast styles
 */
export function useToastStyles(variant: ToastVariant = 'default') {
  return toastVariantStyles[variant];
}

export type { Toast };
