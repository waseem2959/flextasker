/**
 * Centralized Prisma Error Handler
 * 
 * Consolidates duplicate Prisma error handling logic across the application.
 * This reduces code duplication and ensures consistent error handling.
 */

// Note: This file is for frontend use, but Prisma is typically backend-only
// For now, we'll create a simplified version that can work with both
import { AppError, ConflictError, NotFoundError } from '@/types/errors';

// Define a simplified Prisma error interface for frontend compatibility
interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
    modelName?: string;
    field_name?: string;
    relation_name?: string;
    table?: string;
    column?: string;
  };
}

/**
 * Map Prisma error codes to appropriate application errors
 */
export function handlePrismaError(error: PrismaError, context?: string): never {
  const contextMessage = context ? ` (${context})` : '';
  
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const fields = error.meta?.target as string[] || [];
      throw new ConflictError(
        `A record with this information already exists${contextMessage}`,
        { 
          businessRule: 'UNIQUE_CONSTRAINT',
          metadata: { fields }
        }
      );
      
    case 'P2025': // Record not found
      throw new NotFoundError(
        `The requested resource does not exist${contextMessage}`
      );
      
    case 'P2003': // Foreign key constraint failed
      throw new ConflictError(
        `Cannot perform operation due to related data${contextMessage}`,
        { 
          businessRule: 'FOREIGN_KEY_CONSTRAINT',
          metadata: { field: error.meta?.field_name }
        }
      );
      
    case 'P2014': // Required relation missing
      throw new ConflictError(
        `Required related record is missing${contextMessage}`,
        { 
          businessRule: 'REQUIRED_RELATION',
          metadata: { relation: error.meta?.relation_name }
        }
      );
      
    case 'P2021': // Table does not exist
    case 'P2022': // Column does not exist
    default:
      // For other Prisma errors, create a generic app error
      throw new AppError(
        `Database operation failed${contextMessage}`
      );
  }
}

/**
 * Wrapper function to handle any Prisma operation with consistent error handling
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isPrismaError(error)) {
      handlePrismaError(error, context);
    }
    throw error;
  }
}

/**
 * Type-safe Prisma error checker
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Extract meaningful error message from Prisma error
 */
export function getPrismaErrorMessage(error: PrismaError): string {
  switch (error.code) {
    case 'P2002':
      const fields = error.meta?.target as string[] || [];
      return `Duplicate entry for ${fields.join(', ')}`;
    case 'P2025':
      return 'Record not found';
    case 'P2003':
      return 'Related record constraint violation';
    case 'P2014':
      return 'Required relation missing';
    default:
      return 'Database operation failed';
  }
}
