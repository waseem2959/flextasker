import {
    Toast,
    ToastProvider,
    ToastViewport
} from "./toast"
import { useToast } from "./use-toast"

// Removed unused ToastItemProps interface

export function Toaster() {
  const { toasts, dismissToast } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={String(toast.description || toast.title || '')}
          variant={toast.variant || 'default'}
          title={toast.title ? String(toast.title) : undefined}
          onClose={() => dismissToast(toast.id)}
          defaultDuration={5000}
        />
      ))}
      <ToastViewport>
        <div />
      </ToastViewport>
    </ToastProvider>
  )
}
