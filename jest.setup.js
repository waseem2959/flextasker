/**
 * Jest Setup File
 * 
 * Global setup for Jest tests including import.meta polyfill and other mocks.
 */

// Mock import.meta for Jest environment
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3000/api/v1',
      VITE_SOCKET_URL: 'http://localhost:3000',
      VITE_UPLOAD_URL: 'http://localhost:3000/uploads',
      VITE_AUTH_ENDPOINT: '/api/v1/auth',
      DEV: false,
      PROD: false,
      MODE: 'test',
      VITE_APP_VERSION: '1.0.0',
      VITE_BUILD_TIME: '2024-01-01T00:00:00.000Z',
      VITE_ENABLE_ANALYTICS: 'false',
      VITE_ENABLE_OFFLINE: 'true',
      VITE_ENABLE_NOTIFICATIONS: 'true',
      VITE_ENABLE_PWA: 'true',
    },
  },
};

// Set NODE_ENV for tests
process.env.NODE_ENV = 'test';

// Mock window.matchMedia
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

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
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

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mocked-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalWarn(...args);
};
