/**
 * @jest-environment jsdom
 */
import { CSRFProtection } from '../security';

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateKey: jest.fn(),
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('CSRFProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: ''
    });
  });

  describe('generateToken', () => {
    it('should generate a CSRF token and set cookie', () => {
      const token = CSRFProtection.generateToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(document.cookie).toContain(`csrf_token=${token}`);
    });

    it('should generate different tokens on successive calls', () => {
      const token1 = CSRFProtection.generateToken();
      const token2 = CSRFProtection.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens of reasonable length', () => {
      const token = CSRFProtection.generateToken();

      expect(token.length).toBeGreaterThanOrEqual(16);
      expect(token.length).toBeLessThanOrEqual(64);
    });
  });

  describe('getToken', () => {
    it('should retrieve CSRF token from cookie', () => {
      const testToken = 'test-csrf-token-123';
      document.cookie = `csrf_token=${testToken}; path=/`;

      const token = CSRFProtection.getToken();

      expect(token).toBe(testToken);
    });

    it('should return null when no CSRF token cookie exists', () => {
      document.cookie = 'other_cookie=value; path=/';

      const token = CSRFProtection.getToken();

      expect(token).toBeNull();
    });

    it('should handle multiple cookies correctly', () => {
      const testToken = 'test-csrf-token-456';
      document.cookie = `session=abc123; csrf_token=${testToken}; user=john; path=/`;

      const token = CSRFProtection.getToken();

      expect(token).toBe(testToken);
    });

    it('should handle empty cookies', () => {
      document.cookie = '';

      const token = CSRFProtection.getToken();

      expect(token).toBeNull();
    });

    it('should handle cookies without values', () => {
      document.cookie = 'csrf_token=; path=/';

      const token = CSRFProtection.getToken();

      expect(token).toBe('');
    });
  });

  describe('getHeaders', () => {
    it('should return CSRF headers when token exists', () => {
      const testToken = 'test-csrf-token-789';
      document.cookie = `csrf_token=${testToken}; path=/`;

      const headers = CSRFProtection.getHeaders();

      expect(headers).toEqual({
        'X-CSRF-Token': testToken
      });
    });

    it('should return empty headers when no token exists', () => {
      const headers = CSRFProtection.getHeaders();

      expect(headers).toEqual({});
    });

    it('should handle empty token gracefully', () => {
      document.cookie = 'csrf_token=; path=/';

      const headers = CSRFProtection.getHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('validateToken', () => {
    it('should return true when tokens match', () => {
      const testToken = 'matching-token-123';
      document.cookie = `csrf_token=${testToken}; path=/`;

      const isValid = CSRFProtection.validateToken(testToken);

      expect(isValid).toBe(true);
    });

    it('should return false when tokens do not match', () => {
      document.cookie = `csrf_token=stored-token; path=/`;

      const isValid = CSRFProtection.validateToken('different-token');

      expect(isValid).toBe(false);
    });

    it('should return false when no stored token exists', () => {
      const isValid = CSRFProtection.validateToken('any-token');

      expect(isValid).toBe(false);
    });

    it('should return false when provided token is null or empty', () => {
      document.cookie = `csrf_token=stored-token; path=/`;

      expect(CSRFProtection.validateToken(null)).toBe(false);
      expect(CSRFProtection.validateToken('')).toBe(false);
      expect(CSRFProtection.validateToken(undefined as any)).toBe(false);
    });

    it('should handle case-sensitive token comparison', () => {
      document.cookie = `csrf_token=CaseSensitive; path=/`;

      expect(CSRFProtection.validateToken('CaseSensitive')).toBe(true);
      expect(CSRFProtection.validateToken('casesensitive')).toBe(false);
      expect(CSRFProtection.validateToken('CASESENSITIVE')).toBe(false);
    });
  });

  describe('clearToken', () => {
    it('should clear CSRF token cookie', () => {
      document.cookie = `csrf_token=test-token; path=/`;

      CSRFProtection.clearToken();

      // Check that the cookie was set to expire
      expect(document.cookie).toContain('csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('should work even when no token exists', () => {
      document.cookie = '';

      expect(() => CSRFProtection.clearToken()).not.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should generate new token and replace old one', () => {
      const oldToken = CSRFProtection.generateToken();
      
      const newToken = CSRFProtection.refreshToken();

      expect(newToken).not.toBe(oldToken);
      expect(typeof newToken).toBe('string');
      expect(newToken.length).toBeGreaterThan(0);
      expect(document.cookie).toContain(`csrf_token=${newToken}`);
    });

    it('should work when no previous token exists', () => {
      document.cookie = '';

      const newToken = CSRFProtection.refreshToken();

      expect(typeof newToken).toBe('string');
      expect(newToken.length).toBeGreaterThan(0);
      expect(document.cookie).toContain(`csrf_token=${newToken}`);
    });
  });

  describe('Integration tests', () => {
    it('should handle full CSRF workflow', () => {
      // Generate initial token
      const token1 = CSRFProtection.generateToken();
      expect(CSRFProtection.getToken()).toBe(token1);
      expect(CSRFProtection.validateToken(token1)).toBe(true);

      // Get headers
      const headers = CSRFProtection.getHeaders();
      expect(headers['X-CSRF-Token']).toBe(token1);

      // Refresh token
      const token2 = CSRFProtection.refreshToken();
      expect(token2).not.toBe(token1);
      expect(CSRFProtection.getToken()).toBe(token2);
      expect(CSRFProtection.validateToken(token2)).toBe(true);
      expect(CSRFProtection.validateToken(token1)).toBe(false);

      // Clear token
      CSRFProtection.clearToken();
      expect(CSRFProtection.getToken()).toBe('');
      expect(CSRFProtection.validateToken(token2)).toBe(false);
    });
  });
});