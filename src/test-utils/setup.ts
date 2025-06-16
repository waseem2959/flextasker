/**
 * Test Setup Configuration
 * 
 * Global test setup for Jest including DOM polyfills, mocks, and utilities.
 */

import '@testing-library/jest-dom';

// === POLYFILLS ===

// Mock TextEncoder/TextDecoder for React Router
global.TextEncoder = class MockTextEncoder {
  readonly encoding = 'utf-8';

  encode(input?: string): Uint8Array {
    const buffer = Buffer.from(input || '', 'utf8');
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
    const encoded = this.encode(source);
    const length = Math.min(encoded.length, destination.length);
    destination.set(encoded.subarray(0, length));
    return { read: source.length, written: length };
  }
} as any;

global.TextDecoder = class MockTextDecoder implements TextDecoder {
  readonly encoding = 'utf-8';
  readonly fatal = false;
  readonly ignoreBOM = false;

  decode(input?: BufferSource): string {
    return Buffer.from(input as ArrayBuffer).toString('utf8');
  }
} as any;

// === GLOBAL MOCKS ===

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor(
    private _callback: IntersectionObserverCallback,
    private _options?: IntersectionObserverInit
  ) {
    this.root = _options?.root || null;
    this.rootMargin = _options?.rootMargin || '0px';

    // Extract threshold logic to avoid nested ternary
    if (_options?.threshold) {
      this.thresholds = Array.isArray(_options.threshold) ? _options.threshold : [_options.threshold];
    } else {
      this.thresholds = [0];
    }
  }

  disconnect(): void {
    // Mock implementation - no-op for tests
  }

  observe(_target: Element): void {
    // Mock implementation - no-op for tests
  }

  unobserve(_target: Element): void {
    // Mock implementation - no-op for tests
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver implements ResizeObserver {
  constructor(private _callback: ResizeObserverCallback) {}

  disconnect(): void {
    // Mock implementation - no-op for tests
  }

  observe(_target: Element, _options?: ResizeObserverOptions): void {
    // Mock implementation - no-op for tests
  }

  unobserve(_target: Element): void {
    // Mock implementation - no-op for tests
  }
} as any;

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

// Create a proper Response mock
const MockResponse: any = jest.fn().mockImplementation((body, init) => ({
  ok: init?.status ? init.status < 400 : true,
  status: init?.status || 200,
  statusText: init?.statusText || 'OK',
  headers: init?.headers || {},
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
}));

// Add static methods to Response mock
MockResponse.error = jest.fn(() => ({
  ok: false,
  status: 0,
  statusText: '',
  headers: {},
}));

MockResponse.json = jest.fn((data, init) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json' },
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  ...init,
}));

MockResponse.redirect = jest.fn((url, status = 302) => ({
  ok: true,
  status,
  statusText: 'Found',
  headers: { location: url },
  url,
}));

global.Response = MockResponse;

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
const MockPerformanceObserver = class MockPerformanceObserver implements PerformanceObserver {
  constructor(private _callback: PerformanceObserverCallback) {}

  observe(_options?: PerformanceObserverInit): void {
    // Mock implementation - no-op for tests
  }

  disconnect(): void {
    // Mock implementation - no-op for tests
  }

  takeRecords(): PerformanceEntryList {
    return [];
  }
};

// Add static property
(MockPerformanceObserver as any).supportedEntryTypes = [
  'element',
  'event',
  'first-input',
  'largest-contentful-paint',
  'layout-shift',
  'long-task', // Fixed spelling: longtask -> long-task
  'mark',
  'measure',
  'navigation',
  'paint',
  'resource'
];

global.PerformanceObserver = MockPerformanceObserver as any;

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
      console.error('Error caught by mock ErrorBoundary:', error);
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
    randomUUID: () => 'mocked-uuid-' + Math.random().toString(36).substring(2, 11),
  },
});

// Mock File and FileReader for file upload tests
global.File = class MockFile {
  name: string;
  lastModified: number;
  size: number = 1024;
  type: string = 'text/plain';
  webkitRelativePath: string = '';

  constructor(
    fileBits: BlobPart[],
    fileName: string,
    options?: FilePropertyBag
  ) {
    this.name = fileName;
    this.lastModified = options?.lastModified || Date.now();
    this.type = options?.type || 'text/plain';
  }

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
    return Promise.resolve('mocked file content');
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(0));
  }
} as any;

global.FileReader = class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readonly EMPTY = 0;
  readonly LOADING = 1;
  readonly DONE = 2;

  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: 0 | 1 | 2 = 0;

  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsText(_file: Blob, _encoding?: string): void {
    this.result = 'mocked file content';
    this.readyState = 2; // DONE
    if (this.onload) {
      this.onload.call(this as any, {} as ProgressEvent<FileReader>);
    }
  }

  readAsDataURL(_file: Blob): void {
    this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
    this.readyState = 2; // DONE
    if (this.onload) {
      this.onload.call(this as any, {} as ProgressEvent<FileReader>);
    }
  }

  abort(): void {
    this.readyState = 0; // EMPTY
  }

  readAsArrayBuffer(_file: Blob): void {
    this.result = new ArrayBuffer(0);
    this.readyState = 2; // DONE
  }

  readAsBinaryString(_file: Blob): void {
    this.result = '';
    this.readyState = 2; // DONE
  }

  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void {
    // Mock implementation - no-op for tests
  }

  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject): void {
    // Mock implementation - no-op for tests
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }
} as any;
