/**
 * Auth Middleware Tests
 * 
 * Tests for authentication middleware including token validation and user authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth-middleware';
import { jwtService } from '../../services/jwt-service';
import { userService } from '../../services/user-service';

// Mock dependencies
jest.mock('../../services/jwt-service');
jest.mock('../../services/user-service');

const mockJwtService = jwtService as jest.Mocked<typeof jwtService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

// Mock request, response, and next function
const mockRequest = (headers: any = {}) => ({
  headers,
  user: null,
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  isActive: true,
  emailVerified: true,
};

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-1');
      expect(req.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authorization token required',
          code: 'AUTHORIZATION_REQUIRED',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      const req = mockRequest({
        authorization: 'InvalidFormat token',
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid authorization format',
          code: 'INVALID_AUTHORIZATION_FORMAT',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const token = 'invalid-jwt-token';

      mockJwtService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      const token = 'expired-jwt-token';

      mockJwtService.verifyAccessToken.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user not found', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(null);

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when user is inactive', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };
      const inactiveUser = { ...mockUser, isActive: false };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(inactiveUser);

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive Bearer token', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const req = mockRequest({
        authorization: `bearer ${token}`, // lowercase 'bearer'
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(req.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await optionalAuthMiddleware(req, res, mockNext);

      expect(req.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await optionalAuthMiddleware(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      const token = 'invalid-jwt-token';

      mockJwtService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await optionalAuthMiddleware(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when user not found', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockResolvedValue(null);

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await optionalAuthMiddleware(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 'user-1', email: 'test@example.com' };

      mockJwtService.verifyAccessToken.mockReturnValue(decodedToken);
      mockUserService.getUserById.mockRejectedValue(new Error('Database connection failed'));

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication service error',
          code: 'AUTHENTICATION_SERVICE_ERROR',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JWT service errors gracefully', async () => {
      const token = 'malformed-jwt-token';

      mockJwtService.verifyAccessToken.mockImplementation(() => {
        const error = new Error('Malformed token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const req = mockRequest({
        authorization: `Bearer ${token}`,
      });
      const res = mockResponse();

      await authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
