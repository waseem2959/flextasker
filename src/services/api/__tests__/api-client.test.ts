/**
 * API Client Test Suite
 *
 * Focused tests for the API client covering core functionality.
 */

// Mock the config module before importing api-client
jest.mock('../../../config', () => ({
  config: {
    apiUrl: 'http://localhost:3000/api/v1',
    appName: 'Flextasker Test',
    environment: 'test',
  },
}));

// Mock AuthSecurity
jest.mock('../../../utils/security', () => ({
  ...jest.requireActual('../../../utils/security'),
  AuthSecurity: {
    getAuthData: jest.fn().mockResolvedValue({ accessToken: null, refreshToken: null }),
    isTokenExpired: jest.fn().mockReturnValue(false),
    clearAuthData: jest.fn(),
  },
  CSRFProtection: {
    getHeaders: jest.fn().mockReturnValue({}),
  },
}));

import { apiClient } from '../api-client';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  // === BASIC FUNCTIONALITY ===
  describe('Basic Functionality', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/test'),
        method: 'GET'
      }));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // === POST REQUESTS ===
  describe('POST Requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'Test', email: 'test@example.com' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/test'),
        method: 'POST',
        body: JSON.stringify(requestData),
      }));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          error: {
            message: 'Validation failed',
            details: { email: 'Invalid email format' }
          }
        }),
      });

      const result = await apiClient.post('/test', { email: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Validation failed');
    });
  });

  // === AUTHENTICATION ===
  describe('Authentication', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should include auth token in requests', async () => {
      // Set auth token on the client
      apiClient.setAuthToken('test-token');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/protected');

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();

      // Check the request object that was passed to fetch
      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.headers.get('Authorization')).toBe('Bearer test-token');

      // Clean up
      apiClient.setAuthToken(null);
    });

    it('should handle 401 unauthorized responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        }),
      });

      const result = await apiClient.get('/protected');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  // === ERROR HANDLING ===
  describe('Error Handling', () => {
    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          error: { message: 'Internal server error' }
        }),
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Internal server error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await apiClient.get('/test');

      // The API client should handle malformed JSON gracefully
      // and return a successful response with null data
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  // === REQUEST CONFIGURATION ===
  describe('Request Configuration', () => {
    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test', { page: 1, limit: 10 });

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();

      // Check the request URL
      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain('page=1');
      expect(request.url).toContain('limit=10');
    });

    it('should handle custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test', undefined, {
        headers: { 'X-Custom-Header': 'custom-value' }
      });

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalled();

      // Check the request headers
      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });

});
