/**
 * Enhanced Test Helpers and Utilities
 * 
 * Comprehensive testing utilities for unit, integration, and E2E tests
 * with advanced mocking, assertions, and test data generation.
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import AuthProvider from '../services/providers/auth-provider';
import { TooltipProvider } from '../components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';

// Types
interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'tasker' | 'admin';
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
}

interface TestTask {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budget: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  category: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  dueDate: Date;
}

interface TestBid {
  id: string;
  taskId: string;
  userId: string;
  amount: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
}

interface WrapperProps {
  children: ReactNode;
}

// Test data generators
export const TestDataGenerators = {
  /**
   * Generate a test user
   */
  user: (overrides?: Partial<TestUser>): TestUser => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['client', 'tasker', 'admin']),
    avatar: faker.image.avatar(),
    isVerified: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    ...overrides
  }),

  /**
   * Generate a test task
   */
  task: (overrides?: Partial<TestTask>): TestTask => ({
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['DRAFT', 'POSTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    budget: faker.number.int({ min: 50, max: 5000 }),
    location: {
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
      address: faker.location.streetAddress()
    },
    category: faker.helpers.arrayElement(['cleaning', 'delivery', 'handyman', 'moving', 'gardening']),
    createdBy: faker.string.uuid(),
    assignedTo: faker.datatype.boolean() ? faker.string.uuid() : undefined,
    createdAt: faker.date.past(),
    dueDate: faker.date.future(),
    ...overrides
  }),

  /**
   * Generate a test bid
   */
  bid: (overrides?: Partial<TestBid>): TestBid => ({
    id: faker.string.uuid(),
    taskId: faker.string.uuid(),
    userId: faker.string.uuid(),
    amount: faker.number.int({ min: 50, max: 5000 }),
    message: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED', 'REJECTED']),
    createdAt: faker.date.past(),
    ...overrides
  }),

  /**
   * Generate multiple items
   */
  many: <T>(generator: () => T, count: number): T[] => {
    return Array.from({ length: count }, generator);
  }
};

// Mock providers
export const MockProviders = {
  /**
   * Create a mock QueryClient with default options
   */
  createQueryClient: () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    }
  }),

  /**
   * Create a mock auth context
   */
  createAuthContext: (user?: TestUser | null) => ({
    user: user || null,
    isAuthenticated: !!user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn()
  }),

  /**
   * Create a mock router context
   */
  createRouterContext: (initialEntries: string[] = ['/']) => ({
    initialEntries,
    navigate: vi.fn(),
    location: {
      pathname: initialEntries[0],
      search: '',
      hash: '',
      state: null,
      key: 'default'
    }
  })
};

// Enhanced render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: TestUser | null;
  queryClient?: QueryClient;
  initialRoute?: string;
  withProviders?: boolean;
}

export function renderWithProviders(
  component: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const {
    user = null,
    queryClient = MockProviders.createQueryClient(),
    initialRoute = '/',
    withProviders = true,
    ...renderOptions
  } = options;

  // Setup user event
  const userEventInstance = userEvent.setup();

  // Create wrapper component
  const Wrapper = ({ children }: WrapperProps) => {
    if (!withProviders) {
      return <>{children}</>;
    }

    return (
      <HelmetProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  // Set initial route
  if (initialRoute !== '/') {
    window.history.pushState({}, '', initialRoute);
  }

  const renderResult = render(component, {
    wrapper: Wrapper,
    ...renderOptions
  });

  return {
    ...renderResult,
    user: userEventInstance
  };
}

// API mocking utilities
export const MockAPI = {
  /**
   * Mock successful API response
   */
  success: <T>(data: T, delay = 0) => {
    return vi.fn().mockImplementation(() => 
      delay > 0 
        ? new Promise(resolve => setTimeout(() => resolve(data), delay))
        : Promise.resolve(data)
    );
  },

  /**
   * Mock failed API response
   */
  error: (error: Error | string, delay = 0) => {
    return vi.fn().mockImplementation(() =>
      delay > 0
        ? new Promise((_, reject) => setTimeout(() => reject(error), delay))
        : Promise.reject(error)
    );
  },

  /**
   * Mock paginated API response
   */
  paginated: <T>(items: T[], page = 1, limit = 10) => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: items.slice(startIndex, endIndex),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
};

// Advanced assertion helpers
export const CustomAssertions = {
  /**
   * Assert element has specific CSS classes
   */
  toHaveClasses: (element: HTMLElement, classes: string[]) => {
    classes.forEach(className => {
      expect(element).toHaveClass(className);
    });
  },

  /**
   * Assert element is visible and enabled
   */
  toBeInteractive: (element: HTMLElement) => {
    expect(element).toBeVisible();
    expect(element).toBeEnabled();
    expect(element).not.toHaveAttribute('aria-disabled', 'true');
  },

  /**
   * Assert form validation state
   */
  toHaveValidationError: (element: HTMLElement, errorMessage?: string) => {
    expect(element).toHaveAttribute('aria-invalid', 'true');
    if (errorMessage) {
      const errorElement = element.parentElement?.querySelector('[role="alert"]');
      expect(errorElement).toHaveTextContent(errorMessage);
    }
  },

  /**
   * Assert loading state
   */
  toBeLoading: (element: HTMLElement) => {
    const loadingIndicator = element.querySelector('[data-testid="loading-spinner"]') ||
                           element.querySelector('.animate-spin') ||
                           element.querySelector('[aria-busy="true"]');
    expect(loadingIndicator).toBeInTheDocument();
  },

  /**
   * Assert empty state
   */
  toShowEmptyState: (element: HTMLElement, message?: string) => {
    const emptyState = element.querySelector('[data-testid="empty-state"]') ||
                      element.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
    if (message) {
      expect(emptyState).toHaveTextContent(message);
    }
  }
};

// Performance testing utilities
export const PerformanceUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (component: ReactElement): Promise<number> => {
    const startTime = performance.now();
    renderWithProviders(component);
    const endTime = performance.now();
    return endTime - startTime;
  },

  /**
   * Assert render time is within limit
   */
  assertRenderTime: async (component: ReactElement, maxTime: number) => {
    const renderTime = await PerformanceUtils.measureRenderTime(component);
    expect(renderTime).toBeLessThan(maxTime);
  },

  /**
   * Measure rerender count
   */
  countRerenders: () => {
    let count = 0;
    const Counter = () => {
      count++;
      return null;
    };
    return { Counter, getCount: () => count };
  }
};

// Accessibility testing utilities
export const A11yUtils = {
  /**
   * Assert element is accessible
   */
  assertAccessible: (element: HTMLElement) => {
    // Check for proper ARIA attributes
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(el => {
      // Check for accessible name
      const hasLabel = el.getAttribute('aria-label') || 
                      el.getAttribute('aria-labelledby') ||
                      el.textContent?.trim();
      expect(hasLabel).toBeTruthy();

      // Check for keyboard accessibility
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex) {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      expect(level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = level;
    });
  },

  /**
   * Assert focus management
   */
  assertFocusManagement: async (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);
    }
  }
};

// Network mocking utilities
export const NetworkMocks = {
  /**
   * Mock fetch for specific endpoints
   */
  mockEndpoint: (endpoint: string, response: any, options?: {
    status?: number;
    delay?: number;
    headers?: Record<string, string>;
  }) => {
    const { status = 200, delay = 0, headers = {} } = options || {};

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes(endpoint)) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: status >= 200 && status < 300,
              status,
              headers: new Headers(headers),
              json: async () => response,
              text: async () => JSON.stringify(response)
            });
          }, delay);
        });
      }
      return Promise.reject(new Error('Endpoint not mocked'));
    });
  },

  /**
   * Mock WebSocket connection
   */
  mockWebSocket: () => {
    const mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: WebSocket.OPEN,
      dispatchEvent: vi.fn()
    };

    global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);
    return mockWebSocket;
  }
};

// Test scenario builders
export const ScenarioBuilders = {
  /**
   * Build authenticated user scenario
   */
  authenticatedUser: (role: TestUser['role'] = 'client') => {
    const user = TestDataGenerators.user({ role, isVerified: true });
    const authContext = MockProviders.createAuthContext(user);
    
    return { user, authContext };
  },

  /**
   * Build task with bids scenario
   */
  taskWithBids: (bidCount = 5) => {
    const task = TestDataGenerators.task({ status: 'POSTED' });
    const bids = TestDataGenerators.many(
      () => TestDataGenerators.bid({ taskId: task.id }),
      bidCount
    );
    
    return { task, bids };
  },

  /**
   * Build user dashboard scenario
   */
  userDashboard: () => {
    const user = TestDataGenerators.user({ role: 'client' });
    const tasks = TestDataGenerators.many(
      () => TestDataGenerators.task({ createdBy: user.id }),
      10
    );
    const bids = tasks.flatMap(task => 
      TestDataGenerators.many(
        () => TestDataGenerators.bid({ taskId: task.id }),
        3
      )
    );
    
    return { user, tasks, bids };
  }
};

// Snapshot testing utilities
export const SnapshotUtils = {
  /**
   * Serialize dates for consistent snapshots
   */
  dateSerializer: {
    test: (val: any) => val instanceof Date,
    print: (val: Date) => `Date(${val.toISOString()})`
  },

  /**
   * Serialize IDs for consistent snapshots
   */
  idSerializer: {
    test: (val: any) => typeof val === 'string' && val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
    print: () => 'UUID'
  }
};

// Export everything
export {
  renderWithProviders,
  userEvent,
  faker
};