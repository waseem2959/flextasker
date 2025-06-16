import { ToastProvider } from "./toast"

// Main Toaster component that provides the context
export function Toaster() {
  return (
    <ToastProvider>
      <div />
    </ToastProvider>
  )
}
