/**
 * Test Setup Configuration
 * 
 * Global test setup for Jest including DOM polyfills, mocks, and utilities.
 */

import '@testing-library/jest-dom';

// === POLYFILLS ===

// Mock TextEncoder/TextDecoder for React Router
global.TextEncoder = class TextEncoder {
  encode(input?: string): Uint8Array {
    return new Uint8Array(Buffer.from(input || '', 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(input?: BufferSource): string {
    return Buffer.from(input as ArrayBuffer).toString('utf8');
  }
};

// === GLOBAL MOCKS ===

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch and Request API
global.fetch = jest.fn();
global.Request = jest.fn().mockImplementation((url, init) => ({
  url,
  method: init?.method || 'GET',
  headers: init?.headers || {},
  body: init?.body,
}));
global.Response = jest.fn().mockImplementation((body, init) => ({
  ok: init?.status ? init.status < 400 : true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: init?.headers || {},
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
}));

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// === PERFORMANCE API MOCKS ===

// Mock performance.now
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: jest.fn(() => Date.now()),
});

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }
  
  callback: PerformanceObserverCallback;
  
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// === CONSOLE MOCKS ===

// Suppress console.warn in tests unless explicitly needed
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

// === ERROR BOUNDARY MOCK ===

// Mock React Error Boundary for testing
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    try {
      return children;
    } catch (error) {
      return fallback;
    }
  },
  withErrorBoundary: (Component: any) => Component,
}));

// === ROUTER MOCKS ===

// Mock react-router-dom for components that use navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}));

// === ANIMATION MOCKS ===

// Mock framer-motion for components that use animations
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
  },
  AnimatePresence: ({ children }: any) => children,
}));

// === CUSTOM MATCHERS ===

// Add custom Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// === GLOBAL TEST UTILITIES ===

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage
  localStorageMock.clear();
  
  // Clear sessionStorage
  sessionStorageMock.clear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// === TYPE DECLARATIONS ===

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

// === ENVIRONMENT VARIABLES ===

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3001';

// === TEST UTILITIES EXPORT ===

import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock data
export const mockUser = {
  id: 'test-user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'USER' as const,
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2023-01-01'),
  emailVerified: true,
  phoneVerified: false,
};

export const mockTask = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'This is a test task',
  budget: 100,
  budgetType: 'FIXED' as const,
  category: 'Technology',
  location: 'Test City',
  status: 'OPEN' as const,
  priority: 'MEDIUM' as const,
  createdAt: new Date('2023-01-01'),
  dueDate: new Date('2023-12-31'),
  userId: 'test-user-1',
  user: mockUser,
};

// Test providers
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return React.createElement(BrowserRouter, null, children);
};

// Custom render
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Utilities
export const createMockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const createMockApiError = (message = 'Test error', status = 500) => {
  const error = new Error(message) as any;
  error.response = { status, data: { message } };
  return Promise.reject(error);
};

// Re-exports
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };

// === MOCK IMPLEMENTATIONS ===

// Mock crypto.randomUUID for ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  constructor(
    public parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
    public name: string,
    public options?: FilePropertyBag
  ) {}
  
  size = 1024;
  type = 'text/plain';
  lastModified = Date.now();
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  slice(): Blob {
    return new Blob();
  }
  
  stream(): ReadableStream {
    return new ReadableStream();
  }
  
  text(): Promise<string> {
    return Promise.resolve('');
  }
};

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState = 0;
  
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  readAsText() {
    this.result = 'mocked file content';
    if (this.onload) {
      this.onload({} as ProgressEvent<FileReader>);
    }
  }
  
  readAsDataURL() {
    this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
    if (this.onload) {
      this.onload({} as ProgressEvent<FileReader>);
    }
  }
  
  abort() {}
  readAsArrayBuffer() {}
  readAsBinaryString() {}
  
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
};
