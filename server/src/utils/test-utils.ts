/**
 * Testing Utilities
 * 
 * This module provides utilities for writing integration and unit tests,
 * including test database setup, request helpers, and mocking utilities.
 */

import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { BudgetType, TaskPriority, TaskStatus, UserRole } from '../../../shared/types/enums';
import { config } from './config';
import { logger } from './logger';

// Initialize test database client
const prisma = new PrismaClient();

/**
 * Test database utilities
 */
export const testDb = {
  /**
   * Connect to test database
   */
  async connect() {
    try {
      await prisma.$connect();
      logger.info('Connected to test database');
    } catch (error) {
      logger.error('Failed to connect to test database', { error });
      throw error;
    }
  },
  
  /**
   * Disconnect from test database
   */
  async disconnect() {
    await prisma.$disconnect();
    logger.info('Disconnected from test database');
  },
  
  /**
   * Clean up test database (truncate all tables)
   */
  async cleanup() {
    // Delete all data from tables
    // Order matters for foreign key constraints
    const tables = [
      'Message',
      'Conversation',
      'Review',
      'Bid',
      'Notification',
      'Task',
      'User'
    ];
    
    try {
      // Use transactions to ensure atomicity
      await prisma.$transaction(
        tables.map(table => 
          prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
        )
      );
      
      logger.info('Test database cleaned up');
    } catch (error) {
      logger.error('Failed to clean up test database', { error });
      throw error;
    }
  },
  
  /**
   * Get database client
   */
  getClient() {
    return prisma;
  }
};

/**
 * Generate a test JWT token for a user
 */
export function generateTestToken(userData: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}) {
  return (jwt as any).sign(userData, config.JWT_SECRET, {
    expiresIn: '1h'
  });
}

/**
 * Get auth token for a user (alias for generateTestToken)
 */
export function getAuthToken(userData: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: any;
}) {
  return generateTestToken(userData);
}

/**
 * Create a test Express app for testing
 */
export function createTestApp(): Application {
  // This would normally import and configure the Express app
  // For now, return a mock app
  const express = require('express');
  const app = express();

  // Basic middleware
  app.use(express.json());

  // Mock routes for testing
  app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok' });
  });

  return app;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(userData: {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  password?: string;
}) {
  const { email, firstName, lastName, role = UserRole.USER, password = 'TestPassword123!' } = userData;
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    return await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: password, // We store directly as passwordHash for tests
        role: role || 'USER', // Default to USER role
        emailVerified: true
      }
    });
  } catch (error) {
    logger.error('Failed to create test user', { email, error });
    throw error;
  }
}

/**
 * Create a test task in the database
 */
export async function createTestTask(taskData: {
  title: string;
  description: string;
  budget: number;
  ownerId: string;
  categoryId: string;
  status?: string;
}) {
  try {
    return await prisma.task.create({
      data: {
        ...taskData,
        status: taskData.status ?? TaskStatus.OPEN,
        priority: TaskPriority.MEDIUM, // Default priority
        budgetType: BudgetType.FIXED // Default budget type
      }
    });
  } catch (error) {
    logger.error('Failed to create test task', { taskData, error });
    throw error;
  }
}

/**
 * Test request helper with authentication
 */
export function authenticatedRequest(app: Application, token?: string) {
  return {
    get(url: string) {
      const req = request(app).get(url);
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      return req;
    },
    post(url: string) {
      const req = request(app).post(url);
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      return req;
    },
    put(url: string) {
      const req = request(app).put(url);
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      return req;
    },
    patch(url: string) {
      const req = request(app).patch(url);
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      return req;
    },
    delete(url: string) {
      const req = request(app).delete(url);
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      return req;
    }
  };
}

/**
 * Mock WebSocket client for testing real-time features
 */
export class MockSocketClient {
  private events: Record<string, ((...args: any[]) => void)[]> = {};
  private connected = false;
  
  /**
   * Mock connection
   */
  connect() {
    this.connected = true;
    this.trigger('connect');
    return this;
  }
  
  /**
   * Mock disconnection
   */
  disconnect() {
    this.connected = false;
    this.trigger('disconnect');
    return this;
  }
  
  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }
  
  /**
   * Register event handler
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }
  
  /**
   * Emit event
   */
  emit(event: string, ...args: any[]) {
    if (!this.connected) {
      throw new Error('Cannot emit events when disconnected');
    }
    
    logger.debug('MockSocketClient emitting event', { event, args });
    return this;
  }
  
  /**
   * Trigger event handlers
   */
  trigger(event: string, ...args: any[]) {
    if (this.events[event]) {
      for (const callback of this.events[event]) {
        callback(...args);
      }
    }
    return this;
  }
}

/**
 * Wait for a specified time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
