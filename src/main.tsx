import { createRoot } from 'react-dom/client';
import './index.css';

// Render the application immediately for better FCP
const rootElement = document.getElementById("root");

if (rootElement) {
  // Start rendering immediately
  const root = createRoot(rootElement);
  
  // Load App component
  import('./App').then(({ default: App }) => {
    root.render(<App />);
  });
  
  // Initialize auth in parallel
  import('./utils').then(({ initializeAuth }) => {
    initializeAuth();
  });
} else {
  console.error('Root element not found - unable to render application');
}

// Service Worker implementation removed - will be implemented when PWA features are needed
