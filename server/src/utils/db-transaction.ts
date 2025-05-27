/**
 * Database Transaction Helpers
 * 
 * This module provides utilities for working with database transactions,
 * ensuring data consistency and proper error handling.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';
import { startMeasurement, endMeasurement } from './monitoring';
import { getRequestId } from '../middleware/request-context';

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
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxWait = 2000,
    timeout = 5000,
    isolationLevel = Prisma.TransactionIsolationLevel.ReadCommitted,
    operationName = 'Database transaction'
  } = options;
  
  const requestId = getRequestId();
  const measurementId = startMeasurement('db:transaction', { 
    operation: operationName,
    requestId 
  });
  
  try {
    // Execute the function within a transaction
    const result = await prisma.$transaction(fn, {
      maxWait,
      timeout,
      isolationLevel
    });
    
    endMeasurement(measurementId, { success: true });
    
    return result;
  } catch (error) {
    endMeasurement(measurementId, { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    logger.error('Transaction failed', {
      operation: operationName,
      error,
      requestId
    });
    
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
  operations: Prisma.PrismaPromise<any>[],
  options: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    operationName?: string;
  } = {}
): Promise<T> {
  const { 
    operationName = 'Batch database operations',
    ...txOptions
  } = options;
  
  return withTransaction(async (tx) => {
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
  const requestId = getRequestId();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const measurementId = startMeasurement(`db:operation:attempt${attempt}`, {
        operation: operationName,
        attempt,
        requestId
      });
      
      const result = await operation();
      
      endMeasurement(measurementId, { success: true });
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        logger.error('Non-retryable database error', {
          operation: operationName,
          attempt,
          error,
          requestId
        });
        throw error;
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
function isRetryableError(error: any): boolean {
  // Prisma transaction errors that are typically transient
  const retryableCodes = [
    'P1000', // Authentication failed
    'P1001', // Can't reach database server
    'P1002', // Database server connection timed out
    'P1008', // Operations timed out
    'P1017', // Server closed the connection
    'P2024', // Connection pool timeout
    'P2028', // Transaction API error
    'P2034'  // Transaction failed due to conflict
  ];
  
  // Check Prisma error codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return retryableCodes.includes(error.code);
  }
  
  // Timeout errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }
  
  // Connection errors
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }
  
  return false;
}
