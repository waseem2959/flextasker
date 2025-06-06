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

});
