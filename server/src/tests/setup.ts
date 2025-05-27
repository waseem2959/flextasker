/**
 * Test Setup Configuration
 * 
 * This file contains setup and configuration for the test environment.
 * It runs before any tests and configures the testing environment.
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock logger to prevent noise during tests
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Create a mock Prisma client
export const prismaMock = mockDeep<PrismaClient>();

// Mock the database util to return our mocked client
jest.mock('@/utils/database', () => ({
  db: prismaMock
}));

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Global test environment setup
global.beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.PORT = '3001';
});

// Global test environment teardown
global.afterAll(() => {
  // Clean up any resources
});
