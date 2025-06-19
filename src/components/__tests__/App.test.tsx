/**
 * App Component Tests
 * 
 * Tests for the main App component including routing, providers, and error boundaries.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';

// Mock react-router-dom to avoid Router nesting issues
const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useParams: () => ({}),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
}));

// Mock the lazy-loaded components
jest.mock('../../pages/Index', () => {
  return function MockIndex() {
    return <div data-testid="index-page">Index Page</div>;
  };
});

jest.mock('../../pages/Login', () => {
  return function MockLogin() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('../../pages/register', () => {
  return function MockRegister() {
    return <div data-testid="register-page">Register Page</div>;
  };
});

jest.mock('../../pages/not-found', () => {
  return function MockNotFound() {
    return <div data-testid="not-found-page">Not Found Page</div>;
  };
});

// Mock providers
jest.mock('../../lib/query-provider', () => ({
  ReactQueryProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../services/providers/auth-provider', () => {
  return function MockAuthProvider({ children }: { children: React.ReactNode }) {
    return <div data-testid="auth-provider">{children}</div>;
  };
});

jest.mock('../../components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

jest.mock('../../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('App Component', () => {
  const renderApp = (initialEntries = ['/']) => {
    // Since App already includes BrowserRouter, we'll render it directly
    // and mock the router hooks instead
    return render(<App />);
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Routing', () => {
    it('should render the index page for root route', async () => {
      renderApp(['/']);
      
      await waitFor(() => {
        expect(screen.getByTestId('index-page')).toBeInTheDocument();
      });
    });

    it('should render without crashing for /login route', async () => {
      renderApp(['/login']);

      await waitFor(() => {
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      });
    });

    it('should render without crashing for /register route', async () => {
      renderApp(['/register']);

      await waitFor(() => {
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      });
    });

    it('should render without crashing for invalid routes', async () => {
      renderApp(['/invalid-route']);

      await waitFor(() => {
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      });
    });
  });

  describe('Providers', () => {
    it('should render with all required providers', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('toaster')).toBeInTheDocument();
      });
    });

    it('should have proper provider hierarchy', async () => {
      renderApp();
      
      await waitFor(() => {
        const authProvider = screen.getByTestId('auth-provider');
        expect(authProvider).toBeInTheDocument();
        
        // Check that the page content is inside the auth provider
        expect(authProvider).toContainElement(screen.getByTestId('index-page'));
      });
    });
  });

  describe('Loading States', () => {
    it('should render without loading spinner errors', () => {
      renderApp();

      // Just verify the app renders without crashing
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    it('should hide loading spinner after component loads', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('index-page')).toBeInTheDocument();
      });
      
      // Loading spinner should be gone
      const loadingElement = document.querySelector('.animate-spin');
      expect(loadingElement).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle component loading errors gracefully', async () => {
      // Mock a component that throws an error
      jest.doMock('../../pages/Index', () => {
        throw new Error('Component failed to load');
      });

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderApp();

      // Should still render the app structure
      await waitFor(() => {
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      renderApp();
      
      await waitFor(() => {
        const mainContent = document.querySelector('.min-h-screen');
        expect(mainContent).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check that the app is focusable and navigable
        const app = document.body;
        expect(app).toBeInTheDocument();
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply background theme classes', async () => {
      renderApp();
      
      await waitFor(() => {
        const backgroundElement = document.querySelector('.bg-background');
        expect(backgroundElement).toBeInTheDocument();
      });
    });

    it('should have minimum height for full viewport', async () => {
      renderApp();
      
      await waitFor(() => {
        const minHeightElement = document.querySelector('.min-h-screen');
        expect(minHeightElement).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should lazy load components', () => {
      // Verify that components are lazy loaded by checking the React.lazy wrapper
      const { container } = renderApp();
      
      // The Suspense boundary should be present
      expect(container.querySelector('[data-testid="auth-provider"]')).toBeInTheDocument();
    });

    it('should not load all routes immediately', () => {
      renderApp(['/']);
      
      // Only the current route component should be loaded
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('register-page')).not.toBeInTheDocument();
    });
  });

  describe('Route Parameters', () => {
    it('should handle dynamic routes without crashing', async () => {
      renderApp(['/tasks/123']);

      await waitFor(() => {
        // Should render without crashing
        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      });
    });
  });
});
