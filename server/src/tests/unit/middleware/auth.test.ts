/**
 * Auth Middleware Unit Tests
 * 
 * Tests the authentication and authorization middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authenticateToken, authorizeRoles, authorizeOwner } from '@/middleware/auth';
import { createMockRequest } from '@/tests/mocks/mock-request';
import { createMockResponse } from '@/tests/mocks/mock-response';
import { UserRole } from '../../../../shared/types/enums';
import { AuthenticationError, AuthorizationError } from '@/utils/enhanced-errors';

describe('Auth Middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should call next with AuthenticationError if no token is provided', () => {
      // Arrange - request with no authorization header
      
      // Act
      authenticateToken(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required'
        })
      );
    });

    it('should attach user to request and call next if token is valid', () => {
      // Arrange - request with valid token
      req.headers.authorization = 'Bearer valid-token';
      
      // Act
      authenticateToken(req, res, next);
      
      // Assert
      expect(req.user).toBeDefined();
      expect(req.user.id).toBeDefined();
      expect(req.user.role).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('authorizeRoles', () => {
    beforeEach(() => {
      // Setup authenticated user for each test
      req.user = {
        id: 'user-1',
        role: UserRole.USER
      };
    });

    it('should call next with AuthenticationError if user is not authenticated', () => {
      // Arrange - no user on request
      delete req.user;
      const middleware = authorizeRoles([UserRole.USER]);
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should call next with AuthorizationError if user does not have required role', () => {
      // Arrange - user with wrong role
      req.user.role = UserRole.USER;
      const middleware = authorizeRoles([UserRole.ADMIN]);
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should call next without error if user has required role', () => {
      // Arrange - user with correct role
      req.user.role = UserRole.ADMIN;
      const middleware = authorizeRoles([UserRole.ADMIN]);
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next without error if user has one of multiple required roles', () => {
      // Arrange - user with one of the required roles
      req.user.role = UserRole.TASKER;
      const middleware = authorizeRoles([UserRole.USER, UserRole.TASKER]);
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('authorizeOwner', () => {
    beforeEach(() => {
      // Setup authenticated user for each test
      req.user = {
        id: 'user-1',
        role: UserRole.USER
      };
      req.params = {
        userId: 'user-1'
      };
    });

    it('should call next with AuthenticationError if user is not authenticated', () => {
      // Arrange - no user on request
      delete req.user;
      const middleware = authorizeOwner();
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should call next with AuthorizationError if user is not the owner', () => {
      // Arrange - user is not the owner
      req.params.userId = 'other-user';
      const middleware = authorizeOwner();
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should call next without error if user is the owner', () => {
      // Arrange - user is the owner
      const middleware = authorizeOwner();
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next without error if user is admin regardless of ownership', () => {
      // Arrange - user is admin but not the owner
      req.user.role = UserRole.ADMIN;
      req.params.userId = 'other-user';
      const middleware = authorizeOwner();
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it('should use custom parameter name if provided', () => {
      // Arrange - using custom parameter name
      req.params = { taskOwnerId: 'user-1' };
      const middleware = authorizeOwner('taskOwnerId');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
    });
  });
});
