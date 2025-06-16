import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAuth } from './utils/auth-initializer';

// Initialize authentication systems before rendering the app
// This sets up proactive token refresh and other auth-related services
initializeAuth();



// Render the application
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found - unable to render application');
}

// Service Worker registration disabled for development
// TODO: Enable service worker for production PWA support
if (false && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
