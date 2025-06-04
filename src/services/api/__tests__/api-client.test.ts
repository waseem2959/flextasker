/**
 * API Client Test Suite
 * 
 * Comprehensive tests for the API client covering all HTTP methods, error handling, and edge cases.
 */

import { apiClient } from '../api-client';
import { createMockApiResponse, createMockApiError } from '@/test-utils';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

describe('API Client', () => {
  const mockAxios = require('axios').create();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === GET REQUESTS ===
  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxios.get.mockResolvedValue({ data: mockData });

      const result = await apiClient.get('/test');

      expect(mockAxios.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle GET request with query parameters', async () => {
      const mockData = { results: [] };
      mockAxios.get.mockResolvedValue({ data: mockData });

      const params = { page: 1, limit: 10 };
      const result = await apiClient.get('/test', { params });

      expect(mockAxios.get).toHaveBeenCalledWith('/test', { params });
      expect(result).toEqual(mockData);
    });

    it('should handle GET request errors', async () => {
      const errorMessage = 'Not found';
      mockAxios.get.mockRejectedValue(new Error(errorMessage));

      await expect(apiClient.get('/test')).rejects.toThrow(errorMessage);
    });
  });

  // === POST REQUESTS ===
  describe('POST Requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: 1, created: true };
      const postData = { name: 'New Item' };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await apiClient.post('/test', postData);

      expect(mockAxios.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle POST request with headers', async () => {
      const mockData = { success: true };
      const postData = { name: 'Test' };
      const headers = { 'Content-Type': 'application/json' };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await apiClient.post('/test', postData, { headers });

      expect(mockAxios.post).toHaveBeenCalledWith('/test', postData, { headers });
      expect(result).toEqual(mockData);
    });

    it('should handle POST request errors', async () => {
      const errorMessage = 'Validation failed';
      mockAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(apiClient.post('/test', {})).rejects.toThrow(errorMessage);
    });
  });

  // === PUT REQUESTS ===
  describe('PUT Requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, updated: true };
      const putData = { name: 'Updated Item' };
      mockAxios.put.mockResolvedValue({ data: mockData });

      const result = await apiClient.put('/test/1', putData);

      expect(mockAxios.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockData);
    });
  });

  // === PATCH REQUESTS ===
  describe('PATCH Requests', () => {
    it('should make successful PATCH request', async () => {
      const mockData = { id: 1, patched: true };
      const patchData = { status: 'active' };
      mockAxios.patch.mockResolvedValue({ data: mockData });

      const result = await apiClient.patch('/test/1', patchData);

      expect(mockAxios.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toEqual(mockData);
    });
  });

  // === DELETE REQUESTS ===
  describe('DELETE Requests', () => {
    it('should make successful DELETE request', async () => {
      const mockData = { deleted: true };
      mockAxios.delete.mockResolvedValue({ data: mockData });

      const result = await apiClient.delete('/test/1');

      expect(mockAxios.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle DELETE request errors', async () => {
      const errorMessage = 'Not authorized';
      mockAxios.delete.mockRejectedValue(new Error(errorMessage));

      await expect(apiClient.delete('/test/1')).rejects.toThrow(errorMessage);
    });
  });

  // === ERROR HANDLING ===
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      mockAxios.get.mockRejectedValue(networkError);

      await expect(apiClient.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockAxios.get.mockRejectedValue(timeoutError);

      await expect(apiClient.get('/test')).rejects.toThrow('Timeout');
    });

    it('should handle HTTP error responses', async () => {
      const httpError = {
        response: {
          status: 404,
          data: { message: 'Resource not found' }
        }
      };
      mockAxios.get.mockRejectedValue(httpError);

      await expect(apiClient.get('/test')).rejects.toMatchObject(httpError);
    });
  });

  // === REQUEST CONFIGURATION ===
  describe('Request Configuration', () => {
    it('should handle custom timeout', async () => {
      const mockData = { success: true };
      mockAxios.get.mockResolvedValue({ data: mockData });

      await apiClient.get('/test', { timeout: 5000 });

      expect(mockAxios.get).toHaveBeenCalledWith('/test', { timeout: 5000 });
    });

    it('should handle custom headers', async () => {
      const mockData = { success: true };
      const headers = { 'Authorization': 'Bearer token' };
      mockAxios.get.mockResolvedValue({ data: mockData });

      await apiClient.get('/test', { headers });

      expect(mockAxios.get).toHaveBeenCalledWith('/test', { headers });
    });
  });

  // === RESPONSE TRANSFORMATION ===
  describe('Response Transformation', () => {
    it('should return response data directly', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxios.get.mockResolvedValue({ 
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {}
      });

      const result = await apiClient.get('/test');

      expect(result).toEqual(mockData);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('headers');
    });
  });

  // === CONCURRENT REQUESTS ===
  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };
      
      mockAxios.get
        .mockResolvedValueOnce({ data: mockData1 })
        .mockResolvedValueOnce({ data: mockData2 });

      const [result1, result2] = await Promise.all([
        apiClient.get('/test/1'),
        apiClient.get('/test/2')
      ]);

      expect(result1).toEqual(mockData1);
      expect(result2).toEqual(mockData2);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
