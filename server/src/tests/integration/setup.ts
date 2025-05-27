/**
 * Integration Test Setup
 * 
 * This file contains the setup for integration tests, creating a test server
 * and database connection that can be used across all integration tests.
 */

import { Server } from 'http';
import request from 'supertest';
import { app } from '@/app'; // Import your Express app
import { db } from '@/utils/database';
import { mockUsers, mockTasks, mockBids } from '../mocks/mock-data';

// Global variables for test server and API client
let server: Server;
let api: request.SuperTest<request.Test>;

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Create test server
  server = app.listen(0); // Use random available port
  
  // Create API client
  api = request(app);
  
  // Setup test database - in a real app, this might use a test database
  // For integration tests, we'll mock the database at the Prisma level
  await setupTestDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  // Close server
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
  
  // Cleanup test database
  await cleanupTestDatabase();
});

/**
 * Helper function to setup test database with mock data
 */
async function setupTestDatabase() {
  // For Prisma, we would typically use transactions or a test database
  // Here we're just mocking the Prisma client for integration tests
  
  // Mock the user.findMany method
  jest.spyOn(db.user, 'findMany').mockResolvedValue(mockUsers as any);
  
  // Mock the task.findMany method
  jest.spyOn(db.task, 'findMany').mockResolvedValue(mockTasks as any);
  
  // Mock the bid.findMany method
  jest.spyOn(db.bid, 'findMany').mockResolvedValue(mockBids as any);
  
  // Add additional mocks for specific test cases
  mockFindById();
  mockCreateMethods();
  mockUpdateMethods();
  mockDeleteMethods();
}

/**
 * Helper function to mock findUnique and findFirst methods
 */
function mockFindById() {
  // Mock user.findUnique
  jest.spyOn(db.user, 'findUnique').mockImplementation((args: any) => {
    const user = mockUsers.find(u => u.id === args.where.id);
    return Promise.resolve(user as any);
  });
  
  // Mock task.findUnique
  jest.spyOn(db.task, 'findUnique').mockImplementation((args: any) => {
    const task = mockTasks.find(t => t.id === args.where.id);
    return Promise.resolve(task as any);
  });
  
  // Mock bid.findUnique
  jest.spyOn(db.bid, 'findUnique').mockImplementation((args: any) => {
    const bid = mockBids.find(b => b.id === args.where.id);
    return Promise.resolve(bid as any);
  });
}

/**
 * Helper function to mock create methods
 */
function mockCreateMethods() {
  // Mock user.create
  jest.spyOn(db.user, 'create').mockImplementation((args: any) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...args.data,
      createdAt: new Date()
    };
    return Promise.resolve(newUser as any);
  });
  
  // Mock task.create
  jest.spyOn(db.task, 'create').mockImplementation((args: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...args.data,
      createdAt: new Date()
    };
    return Promise.resolve(newTask as any);
  });
  
  // Mock bid.create
  jest.spyOn(db.bid, 'create').mockImplementation((args: any) => {
    const newBid = {
      id: `bid-${Date.now()}`,
      ...args.data,
      submittedAt: new Date()
    };
    return Promise.resolve(newBid as any);
  });
}

/**
 * Helper function to mock update methods
 */
function mockUpdateMethods() {
  // Mock user.update
  jest.spyOn(db.user, 'update').mockImplementation((args: any) => {
    const user = mockUsers.find(u => u.id === args.where.id);
    if (!user) return Promise.resolve(null);
    
    const updatedUser = { ...user, ...args.data };
    return Promise.resolve(updatedUser as any);
  });
  
  // Mock task.update
  jest.spyOn(db.task, 'update').mockImplementation((args: any) => {
    const task = mockTasks.find(t => t.id === args.where.id);
    if (!task) return Promise.resolve(null);
    
    const updatedTask = { ...task, ...args.data };
    return Promise.resolve(updatedTask as any);
  });
  
  // Mock bid.update
  jest.spyOn(db.bid, 'update').mockImplementation((args: any) => {
    const bid = mockBids.find(b => b.id === args.where.id);
    if (!bid) return Promise.resolve(null);
    
    const updatedBid = { ...bid, ...args.data };
    return Promise.resolve(updatedBid as any);
  });
}

/**
 * Helper function to mock delete methods
 */
function mockDeleteMethods() {
  // Mock user.delete
  jest.spyOn(db.user, 'delete').mockImplementation((args: any) => {
    const user = mockUsers.find(u => u.id === args.where.id);
    if (!user) return Promise.resolve(null);
    
    return Promise.resolve(user as any);
  });
  
  // Mock task.delete
  jest.spyOn(db.task, 'delete').mockImplementation((args: any) => {
    const task = mockTasks.find(t => t.id === args.where.id);
    if (!task) return Promise.resolve(null);
    
    return Promise.resolve(task as any);
  });
  
  // Mock bid.delete
  jest.spyOn(db.bid, 'delete').mockImplementation((args: any) => {
    const bid = mockBids.find(b => b.id === args.where.id);
    if (!bid) return Promise.resolve(null);
    
    return Promise.resolve(bid as any);
  });
}

/**
 * Helper function to cleanup test database
 */
async function cleanupTestDatabase() {
  // Clear all mocks
  jest.restoreAllMocks();
}

// Export test utilities
export { api, server };
