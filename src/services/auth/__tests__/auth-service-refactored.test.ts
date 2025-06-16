/**
 * Auth Service Refactored Tests
 * 
 * Tests for the refactored auth service to ensure SonarLint fixes
 * didn't break functionality
 */

import { parseJwt, setupTokenRefresh, tokenManager, authService } from '../auth-service';
import { apiClient } from '../../api/api-client';
import axios from 'axios';

// Mock dependencies
jest.mock('../../api/api-client');
jest.mock('axios');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Service Refactored', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('parseJwt with optional chaining fix', () => {
    it('should handle token without exp claim using optional chaining', () => {
      // Create a token without exp claim
      const payload = { userId: '123', role: 'user' };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      const result = parseJwt(token);
      expect(result).toEqual(payload);
    });

    it('should handle null payload gracefully', () => {
      const invalidToken = 'invalid.token.format';
      const result = parseJwt(invalidToken);
      expect(result).toEqual({});
    });

    it('should handle token with exp claim', () => {
      const payload = { userId: '123', role: 'user', exp: 1234567890 };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      const result = parseJwt(token);
      expect(result).toEqual(payload);
    });
  });

  describe('setupTokenRefresh with reduced complexity', () => {
    it('should handle successful token refresh', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      tokenManager.setRefreshToken(mockRefreshToken);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            accessToken: mockNewAccessToken,
            refreshToken: mockNewRefreshToken
          }
        }
      });

      const onRefreshSuccess = jest.fn();
      const controller = setupTokenRefresh({
        refreshEndpoint: '/auth/refresh-token',
        onRefreshSuccess
      });

      // Trigger refresh by advancing timers
      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve(); // Allow async operations to complete

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: mockRefreshToken
      });
    });

    it('should handle refresh failure with nullish coalescing', async () => {
      const mockRefreshToken = 'refresh-token';
      tokenManager.setRefreshToken(mockRefreshToken);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: null // This should use nullish coalescing fallback
        }
      });

      const onRefreshFailure = jest.fn();
      setupTokenRefresh({
        refreshEndpoint: '/auth/refresh-token',
        onRefreshFailure
      });

      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve();

      expect(onRefreshFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token refresh failed' // Should use nullish coalescing fallback
        })
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockRefreshToken = 'refresh-token';
      tokenManager.setRefreshToken(mockRefreshToken);

      const networkError = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      const onRefreshFailure = jest.fn();
      setupTokenRefresh({
        refreshEndpoint: '/auth/refresh-token',
        onRefreshFailure
      });

      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve();

      expect(onRefreshFailure).toHaveBeenCalledWith(networkError);
    });
  });

  describe('authService with nullish coalescing fixes', () => {
    describe('register', () => {
      it('should use nullish coalescing for error messages', async () => {
        mockedApiClient.post.mockResolvedValueOnce({
          success: false,
          message: null // Should use nullish coalescing
        });

        const result = await authService.register({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'USER' as any
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe('Registration failed'); // Nullish coalescing fallback
      });
    });

    describe('login', () => {
      it('should use nullish coalescing for error messages', async () => {
        mockedApiClient.post.mockResolvedValueOnce({
          success: false,
          message: undefined // Should use nullish coalescing
        });

        const result = await authService.login({
          email: 'john@example.com',
          password: 'password123'
        });

        expect(result.success).toBe(false);
        expect(result.message).toBe('Login failed'); // Nullish coalescing fallback
      });
    });

    describe('getCurrentUser', () => {
      it('should use nullish coalescing for error messages', async () => {
        mockedApiClient.get.mockResolvedValueOnce({
          success: false,
          message: null
        });

        await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get current user');
      });
    });

    describe('updateProfile', () => {
      it('should use nullish coalescing for error messages', async () => {
        mockedApiClient.put.mockResolvedValueOnce({
          success: false,
          message: undefined
        });

        await expect(authService.updateProfile({ firstName: 'Jane' }))
          .rejects.toThrow('Failed to update profile');
      });
    });
  });

  describe('Password validation with nullish coalescing', () => {
    // Mock the validation function
    const mockValidatePassword = jest.fn();
    
    beforeEach(() => {
      jest.doMock('@/utils/validation', () => ({
        validatePassword: mockValidatePassword,
        isValidEmail: jest.fn(() => true)
      }));
    });

    it('should use nullish coalescing for password validation messages', async () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        message: null // Should use nullish coalescing
      });

      await expect(authService.resetPassword('token', 'weak'))
        .rejects.toThrow('Invalid password');
    });

    it('should use nullish coalescing for change password validation', async () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        message: undefined // Should use nullish coalescing
      });

      await expect(authService.changePassword('current', 'weak'))
        .rejects.toThrow('Invalid new password');
    });
  });
});
