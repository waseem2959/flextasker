// Mock import.meta for Jest
global.importMeta = {
  env: {
    DEV: true,
    PROD: false,
    MODE: 'test',
    VITE_API_URL: 'http://localhost:3000/api',
    VITE_SOCKET_URL: 'http://localhost:3000',
  }
};

// Replace import.meta with global mock
Object.defineProperty(global, 'import.meta', {
  get() {
    return global.importMeta;
  }
});