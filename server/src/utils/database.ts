/**
 * Database Module
 * 
 * This module provides a centralized database client instance and utilities
 * for working with the database throughout the application.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Create a singleton instance of the Prisma Client
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$on('query' as any, (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Handle database connection errors
prisma.$use(async (params: any, next: (params: any) => Promise<any>) => {
  try {
    return await next(params);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Database operation failed', {
      model: params.model,
      action: params.action,
      error: errorMessage,
      stack: errorStack,
    });
    throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export the database client
export const db = prisma;

// Re-export types for convenience
export * from '@prisma/client';
