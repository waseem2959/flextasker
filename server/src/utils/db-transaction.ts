/**
 * Database Transaction Helpers
 * 
 * This module provides utilities for working with database transactions,
 * ensuring data consistency and proper error handling.
 */

import { PrismaClient } from '@prisma/client';

// Prisma error type for type-safe error handling
type PrismaError = Error & {
  code?: string;
  clientVersion?: string;
  meta?: Record<string, unknown>;
};
import { logger } from './logger';
// Transaction utilities don't have direct access to the request context
// as they might be called outside of a request context

// Define transaction isolation level type
export type TransactionIsolationLevel = 
  | 'ReadUncommitted' 
  | 'ReadCommitted' 
  | 'RepeatableRead' 
  | 'Serializable';

// Default isolation level
const DEFAULT_ISOLATION_LEVEL: TransactionIsolationLevel = 'ReadCommitted';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Execute a function within a database transaction
 * This ensures operations are atomic - either all succeed or all fail
 * 
 * @param fn Function containing database operations to execute in transaction
 * @param options Transaction options
 * @returns Result of the transaction function
 */
export async function withTransaction<T>(
  fn: (tx: any) => Promise<T>,
  options: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: TransactionIsolationLevel;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxWait = 2000,
    timeout = 5000,
    isolationLevel = DEFAULT_ISOLATION_LEVEL,
    operationName = 'Database transaction'
  } = options;
  
  // Generate a request ID - this will be used for logging purposes only
  // since we don't have access to the request object here
  const requestId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const startTime = Date.now();
  logger.debug(`Starting database transaction: ${operationName}`, { requestId });
  
  try {
    // Execute the function within a transaction
    const result = await prisma.$transaction(fn, {
      maxWait,
      timeout,
      isolationLevel
    });
    
    const duration = Date.now() - startTime;
    logger.debug(`Transaction completed in ${duration}ms`, { 
      operation: operationName,
      requestId,
      duration 
    });
    
    return result;
  } catch (error) {
    // Log failed transaction
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    logger.error(`Transaction failed after ${duration}ms`, { 
      operation: operationName,
      requestId,
      duration,
      error: errorMessage,
      errorName
    });
    
    // Log the full error object at debug level if it's an Error instance
    if (error instanceof Error) {
      logger.debug('Transaction error details', {
        operation: operationName,
        requestId,
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      logger.debug('Transaction error details (non-Error object)', {
        operation: operationName,
        requestId,
        error
      });
    }
    
    throw error;
  }
}

/**
 * Execute multiple operations in a transaction
 * 
 * @param operations Array of Prisma operations to execute
 * @param options Transaction options
 * @returns Array of results from each operation
 */
export async function executeTransactionBatch<T extends any[]>(
  operations: Promise<any>[],
  options: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: TransactionIsolationLevel;
    operationName?: string;
  } = {}
): Promise<T> {
  const { 
    operationName = 'Batch database operations',
    ...txOptions
  } = options;
  
  return withTransaction(async () => {
    return Promise.all(operations) as Promise<T>;
  }, {
    ...txOptions,
    operationName
  });
}

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient database errors
 * 
 * @param operation Function containing database operation to retry
 * @param options Retry options
 * @returns Result of the database operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    operationName = 'Database operation'
  } = options;
  
  let lastError: Error | undefined;
  
  // Generate a request ID for retry operations
  const requestId = `retry-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        logger.debug(`Attempt ${attempt} of ${maxRetries} for operation: ${operationName}`, {
        operation: operationName,
        attempt,
        requestId,
        maxRetries
      });
      
      const result = await operation();
      
      logger.debug(`Operation succeeded on attempt ${attempt}`, {
        operation: operationName,
        attempt,
        requestId
      });
      
      return result;
    } catch (error) {
      const dbError = error as Error;
      lastError = dbError;
      
      // Check if error is retryable
      if (!isRetryableError(dbError)) {
        logger.error('Non-retryable database error', {
          operation: operationName,
          attempt,
          error: dbError.message,
          errorName: dbError.name,
          requestId,
          maxRetries
        });
        throw dbError;
      }
      
      // Log retry attempt
      logger.warn('Retrying database operation after error', {
        operation: operationName,
        attempt,
        error,
        requestId
      });
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        initialDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5)
      );
      
      // Wait before next attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  logger.error('Database operation failed after retries', {
    operation: operationName,
    attempts: maxRetries,
    error: lastError,
    requestId
  });
  
  throw lastError;
}

/**
 * Check if a database error is retryable
 */
function isRetryableError(error: unknown): boolean {
  // Prisma transaction errors that are typically transient
  const retryableCodes = [
    'P1000', // Authentication failed
    'P1001', // Can't reach database server
    'P1002', // Database server connection timed out
    'P1008', // Operations timed out
    'P1011', // Error opening a TLS connection
    'P1012', // Error in parsing the connection string
    'P1017', // Server has closed the connection
    'P1031', // Query engine exited with code
    'P2002', // Unique constraint failed
    'P2024', // Timed out fetching a new connection from the connection pool
    'P2034', // Transaction failed due to a write conflict or a deadlock
  ];
  
  if (!(error instanceof Error)) {
    return false;
  }
  
  const prismaError = error as PrismaError;
  
  // Check Prisma error codes
  if (prismaError.code && typeof prismaError.code === 'string') {
    return retryableCodes.includes(prismaError.code);
  }
  
  // Check for network errors
  if (error.name === 'NetworkError' || 
      error.name === 'ConnectionError' ||
      (error as any).code === 'ECONNREFUSED' ||
      (error as any).code === 'ETIMEDOUT' ||
      (error as any).code === 'ECONNRESET') {
    return true;
  }
  
  return false;
}
