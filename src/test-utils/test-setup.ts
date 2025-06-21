/**
 * Test Setup Configuration
 * 
 * Configures the testing environment to disable problematic services
 * and set up proper mocks for testing.
 */

// Disable security monitoring in tests to prevent infinite loops
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // Mock localStorage to prevent security monitoring interference
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Mock performance observer
  global.PerformanceObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock intersection observer
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock matchMedia for theme tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock URL constructor for image optimization
  global.URL = {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  } as any;

  // Mock Image constructor
  global.Image = jest.fn().mockImplementation(() => {
    const img = {
      src: '',
      onload: null,
      onerror: null,
      complete: false,
      naturalWidth: 0,
      naturalHeight: 0
    };
    
    // Simulate successful image loading when src is set
    Object.defineProperty(img, 'src', {
      get() {
        return this._src || '';
      },
      set(value) {
        this._src = value;
        this.complete = true;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        
        // Trigger onload asynchronously
        setTimeout(() => {
          if (this.onload) {
            this.onload(new Event('load'));
          }
        }, 0);
      }
    });
    
    return img;
  });

  // Mock canvas for image format detection
  global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');

  // Suppress console warnings in tests
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (args[0]?.includes?.('React Router')) return;
    if (args[0]?.includes?.('act')) return;
    if (args[0]?.includes?.('Warning:')) return;
    originalWarn(...args);
  };

  // Suppress console errors for expected test failures
  const originalError = console.error;
  const originalLog = console.log;
  const originalGroup = console.group;
  const originalGroupEnd = console.groupEnd;

  console.error = (...args: any[]) => {
    if (args[0]?.includes?.('Warning:')) return;
    if (args[0]?.includes?.('act')) return;
    if (args[0]?.includes?.('Error Report')) return;
    if (args[0]?.includes?.('🚨')) return;
    if (args[0]?.includes?.('Service Worker')) return;
    if (args[0]?.includes?.('PWA')) return;
    originalError(...args);
  };

  console.log = (...args: any[]) => {
    if (args[0]?.includes?.('Service Worker')) return;
    if (args[0]?.includes?.('Context:')) return;
    if (args[0]?.includes?.('Fingerprint:')) return;
    if (args[0]?.includes?.('Breadcrumbs:')) return;
    originalLog(...args);
  };

  console.group = (...args: any[]) => {
    if (args[0]?.includes?.('🚨')) return;
    originalGroup(...args);
  };

  console.groupEnd = () => {
    // Suppress group endings for error reports
  };
}

export {};