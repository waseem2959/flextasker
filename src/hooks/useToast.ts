/**
 * Toast Notification Hook
 * 
 * This hook provides a simple interface for showing toast notifications
 * in the application.
 */

// Types for toast notifications
export interface ToastOptions {
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

/**
 * Show a toast notification
 */
export function toast(options: ToastOptions): void {
  // This is a simplified implementation
  // In a real app, this would integrate with a toast library or component
  console.log(`[TOAST] ${options.variant || 'default'}: ${options.title} - ${options.description}`);
  
  // If we're in a browser environment, use the browser's native notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    // Check if notification permissions are granted
    if (Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.description,
      });
    }
  }
}

/**
 * Hook for using toast notifications
 */
export function useToast() {
  return { toast };
}

export default useToast;
