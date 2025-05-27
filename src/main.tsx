import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeAuth } from './utils/auth-initializer'

// Initialize authentication systems before rendering the app
// This sets up proactive token refresh and other auth-related services
initializeAuth();

// Log initialization in development mode
if (import.meta.env.DEV) {
  console.log('🔐 Authentication system initialized');
}

// Render the application
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found - unable to render application');
}
