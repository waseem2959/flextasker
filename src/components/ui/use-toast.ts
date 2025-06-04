/**
 * Toast UI Component
 * Provides toast notification functionality
 */

import { useCallback, type ReactNode } from "react"

export type ToastProps = {
  id?: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  variant?: "default" | "destructive" | "success" | "warning" | "info"
}

export type Toast = ToastProps & {
  id: string
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  timeout: ReturnType<typeof setTimeout>
}

let toasts: ToasterToast[] = []

export const useToast = () => {
  const toast = useCallback(({ ...props }: ToastProps) => {
    const id = props.id ?? String(Date.now())

    const update = (props: ToastProps) => {
      toasts = toasts.map((t) => (t.id === id ? { ...t, ...props } : t))
    }

    const dismiss = () => {
      toasts = toasts.filter((t) => t.id !== id)
    }

    const newToast: ToasterToast = {
      ...props,
      id,
      timeout: setTimeout(() => {
        dismiss()
      }, TOAST_REMOVE_DELAY),
    }

    toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT)
    
    return {
      id,
      dismiss,
      update,
    }
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    const toast = toasts.find((t) => t.id === toastId)
    if (toast) {
      clearTimeout(toast.timeout)
      toasts = toasts.filter((t) => t.id !== toastId)
    }
  }, [])

  const dismissAll = useCallback(() => {
    toasts.forEach((toast) => {
      clearTimeout(toast.timeout)
    })
    toasts = []
  }, [])

  return {
    toast,
    dismissToast,
    dismissAll,
    toasts,
  }
}

// Create a global toast function that can be used outside of React components
let globalToastFn: ((options: Omit<Toast, "id">) => void) | null = null;

export const setGlobalToastFn = (fn: (options: Omit<Toast, "id">) => void) => {
  globalToastFn = fn;
};

// Export toast function for compatibility
export const toast = (options: Omit<Toast, "id">) => {
  if (globalToastFn) {
    return globalToastFn(options);
  } else {
    console.warn('Toast function not initialized. Make sure to use ToastProvider.');
  }
};
