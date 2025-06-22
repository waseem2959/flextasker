/**
 * Essential App Component Test
 * Basic smoke test to ensure the app renders without crashing
 */

import { render } from '@testing-library/react';
import React from 'react';
import App from '../../App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: () => <div>Route</div>,
  Navigate: () => <div>Navigate</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

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

// Mock the auth hook
jest.mock('../../hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'USER' },
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock security utils
jest.mock('../../utils/security', () => ({
  setupSecurityEventListeners: jest.fn(),
}));

// Mock environment utilities
jest.mock('../../utils/env', () => ({
  isDev: () => false,
  isProd: () => true,
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});