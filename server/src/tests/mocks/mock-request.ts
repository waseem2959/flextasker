/**
 * Mock Request Utilities
 * 
 * This file provides utility functions for creating mock Express request objects
 * for testing controllers and middleware.
 */

import { Request } from 'express';
import { UserRole } from '../../../../shared/types/enums';

/**
 * Creates a mock Express request object with customizable properties
 */
export function createMockRequest(options: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  user?: {
    id: string;
    role: UserRole;
    [key: string]: any;
  };
  method?: string;
  originalUrl?: string;
  ip?: string;
} = {}): Request {
  // Default values
  const {
    params = {},
    query = {},
    body = {},
    headers = {},
    user = null,
    method = 'GET',
    originalUrl = '/api/v1/test',
    ip = '127.0.0.1'
  } = options;

  // Create the mock request object
  const req = {
    params,
    query,
    body,
    headers,
    user,
    method,
    originalUrl,
    ip,
    // Common functions and properties
    get: jest.fn((name: string) => headers[name.toLowerCase()]),
    header: jest.fn((name: string) => headers[name.toLowerCase()]),
    route: {},
    path: originalUrl.split('?')[0],
    // Add req.id for request identification in logs
    id: 'test-request-id',
    // Add req.startTime for performance tracking
    startTime: Date.now(),
    // Additional Express request properties
    app: {
      get: jest.fn()
    },
    res: {},
    next: jest.fn()
  } as unknown as Request;

  return req;
}

/**
 * Creates a mock authenticated request with a user
 */
export function createAuthenticatedRequest(
  userId: string = 'user-1',
  role: UserRole = UserRole.USER,
  options: any = {}
): Request {
  return createMockRequest({
    ...options,
    user: {
      id: userId,
      role,
      ...options.userProps
    },
    headers: {
      authorization: 'Bearer mock-jwt-token',
      ...options.headers
    }
  });
}

/**
 * Creates a mock admin request
 */
export function createAdminRequest(options: any = {}): Request {
  return createAuthenticatedRequest('admin-user', UserRole.ADMIN, options);
}
