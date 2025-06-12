/**
 * Auth Controller Tests
 * 
 * Tests for authentication controller including login, register, and token management.
 */

import { Request, Response } from 'express';
import { authController } from '../../controllers/auth-controller';
import { authService } from '../../services/auth-service';
import { UserRole } from '../../../../shared/types/enums';

// Mock the auth service
jest.mock('../../services/auth-service');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request object
const mockRequest = (body: any = {}, params: any = {}, query: any = {}) => {
  return {
    body,
    params,
    query,
    user: null,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  } as Request;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      const mockUser = {
        id: 'user-1',
        ...userData,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const req = mockRequest(userData);
      const res = mockResponse();

      await authController.register(req, res);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
          }),
          tokens: mockTokens,
        },
      });
    });

    it('should handle registration validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('Validation failed: Invalid email format')
      );

      const req = mockRequest(invalidData);
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed: Invalid email format',
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.register.mockRejectedValue(
        new Error('User with this email already exists')
      );

      const req = mockRequest(userData);
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'CONFLICT_ERROR',
        },
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const req = mockRequest(loginData);
      const res = mockResponse();

      await authController.login(req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });
    });

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      mockAuthService.login.mockRejectedValue(
        new Error('Invalid email or password')
      );

      const req = mockRequest(loginData);
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid email or password',
          code: 'AUTHENTICATION_ERROR',
        },
      });
    });

    it('should handle account not verified', async () => {
      const loginData = {
        email: 'unverified@example.com',
        password: 'Password123!',
      };

      mockAuthService.login.mockRejectedValue(
        new Error('Please verify your email before logging in')
      );

      const req = mockRequest(loginData);
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED',
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenData = {
        refreshToken: 'valid-refresh-token',
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const req = mockRequest(refreshTokenData);
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenData.refreshToken
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens: mockTokens },
      });
    });

    it('should handle invalid refresh token', async () => {
      const refreshTokenData = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Invalid or expired refresh token')
      );

      const req = mockRequest(refreshTokenData);
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const req = mockRequest();
      req.user = { id: 'user-1', email: 'test@example.com' };
      const res = mockResponse();

      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle logout without authentication', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      const emailData = { email: 'test@example.com' };

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const req = mockRequest(emailData);
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(emailData.email);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset email sent successfully',
      });
    });

    it('should handle non-existent email', async () => {
      const emailData = { email: 'nonexistent@example.com' };

      mockAuthService.forgotPassword.mockRejectedValue(
        new Error('User not found')
      );

      const req = mockRequest(emailData);
      const res = mockResponse();

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const req = mockRequest(resetData);
      const res = mockResponse();

      await authController.resetPassword(req, res);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetData.token,
        resetData.newPassword
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successfully',
      });
    });

    it('should handle invalid reset token', async () => {
      const resetData = {
        token: 'invalid-reset-token',
        newPassword: 'NewPassword123!',
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new Error('Invalid or expired reset token')
      );

      const req = mockRequest(resetData);
      const res = mockResponse();

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN',
        },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const req = mockRequest({}, { token: 'valid-verification-token' });
      const res = mockResponse();

      mockAuthService.verifyEmail.mockResolvedValue(undefined);

      await authController.verifyEmail(req, res);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-verification-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully',
      });
    });

    it('should handle invalid verification token', async () => {
      const req = mockRequest({}, { token: 'invalid-token' });
      const res = mockResponse();

      mockAuthService.verifyEmail.mockRejectedValue(
        new Error('Invalid or expired verification token')
      );

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid or expired verification token',
          code: 'INVALID_VERIFICATION_TOKEN',
        },
      });
    });
  });
});
