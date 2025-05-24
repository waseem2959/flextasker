import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Database connection utility for FlexTasker platform
 * 
 * This utility implements an environment-aware connection pattern:
 * - Development: Reuses a single global connection to prevent connection exhaustion
 * - Production: Creates fresh connections for better reliability and resource management
 * 
 * The pattern prevents the common issue of exhausting database connections during
 * development hot reloads while ensuring production reliability.
 */

// Global declaration for development connection reuse
// Using 'let' instead of 'var' for better scoping and modern JavaScript practices
declare global {
  // In global scope, we need to use 'var' for declaration merging to work properly
  // This is one of the few legitimate uses of 'var' in modern TypeScript
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Factory function that returns appropriate PrismaClient instance based on environment
 * 
 * This function encapsulates the logic for choosing between singleton and fresh instances.
 * Think of it like a smart water cooler that knows whether to refill itself or get replaced.
 */
export const getPrismaClient = (): PrismaClient => {
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new instance each time for better resource management
    // We log fewer queries in production to reduce noise and improve performance
    return new PrismaClient({
      log: ['error', 'warn'],
      // Add connection pool settings for production optimization
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  } else {
    // In development, reuse the global instance to prevent connection exhaustion
    // This is especially important during hot reloads in development servers
    
    // Using nullish coalescing assignment for cleaner, more modern code
    // This operator only assigns if the left side is null or undefined
    global.__prisma ??= new PrismaClient({
      log: ['query', 'error', 'warn'], // More verbose logging for development debugging
      // Enable connection pool debugging in development
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    return global.__prisma;
  }
};

/**
 * Main database client instance
 * 
 * This is the primary export that your services will use throughout FlexTasker.
 * It automatically uses the appropriate connection strategy based on your environment.
 */
export const db = getPrismaClient();

/**
 * Establishes database connection and verifies connectivity
 * 
 * This function serves as a health check and initialization routine.
 * It's like testing the water pressure before opening a restaurant.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // Use a simple query to test connectivity
    // This is more reliable than just checking if the client exists
    await db.$queryRaw`SELECT 1 as health_check`;
    
    logger.info('Database connection established successfully', {
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    });
    
    // In development, we might want to run additional setup
    if (process.env.NODE_ENV === 'development') {
      logger.info('Development environment detected - enhanced logging enabled');
      
      // You could add additional development-specific initialization here
      // For example: checking for pending migrations, seeding test data, etc.
    }
    
  } catch (error) {
    // Enhanced error logging with more context for debugging
    logger.error('Failed to connect to database:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV ?? 'development',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString(),
    });
    
    // Re-throw the error so the application can handle it appropriately
    throw error;
  }
};

/**
 * Gracefully closes database connection
 * 
 * This function ensures proper cleanup when your application shuts down.
 * It's like properly turning off all the lights and locking the door when closing a store.
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await db.$disconnect();
    
    logger.info('Database connection closed gracefully', {
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    });
    
    // In development, also clear the global instance to prevent stale connections
    if (process.env.NODE_ENV !== 'production' && global.__prisma) {
      global.__prisma = undefined;
    }
    
  } catch (error) {
    // Log the error but don't throw it - we're shutting down anyway
    logger.error('Error disconnecting from database:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Utility function for checking database health
 * 
 * This can be used by health check endpoints to verify database connectivity.
 * It's like having a quick way to check if the kitchen equipment is working.
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    logger.warn('Database health check failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return false;
  }
};

/**
 * Utility function for getting connection info (useful for debugging)
 * 
 * This provides insight into how your database connections are being managed.
 */
export const getDatabaseInfo = () => ({
  environment: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  hasGlobalInstance: !!global.__prisma,
  databaseUrlConfigured: !!process.env.DATABASE_URL,
});