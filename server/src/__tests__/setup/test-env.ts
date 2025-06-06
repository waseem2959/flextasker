/**
 * Test Environment Setup
 * 
 * This file sets up the test environment with proper configuration
 * for database connections, Redis, and other services.
 */

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.DATABASE_READ_URLS = 'postgresql://test:test@localhost:5433/test_db_read1,postgresql://test:test@localhost:5434/test_db_read2';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_POOL_MIN = '2';
process.env.DB_POOL_MAX = '10';
process.env.DB_CONNECTION_TIMEOUT = '10000';
process.env.DB_QUERY_TIMEOUT = '30000';
process.env.DB_RETRY_ATTEMPTS = '3';
process.env.DB_RETRY_DELAY = '1000';
process.env.CACHE_TTL_DEFAULT = '300';
process.env.CACHE_MAX_SIZE = '1000';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock external services that aren't available in test environment
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(0),
    ttl: jest.fn().mockResolvedValue(-1),
    expire: jest.fn().mockResolvedValue(0),
    info: jest.fn().mockResolvedValue('used_memory:1048576'),
    on: jest.fn(),
    off: jest.fn(),
    isReady: true,
    isOpen: true
  }))
}));

// Global test setup
beforeAll(async () => {
  // Suppress console logs during tests unless LOG_LEVEL is debug
  if (process.env.LOG_LEVEL !== 'debug') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(async () => {
  // Restore console methods
  jest.restoreAllMocks();
});

export {};
