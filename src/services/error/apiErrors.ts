/**
 * API Error Handling (Bridge File)
 * 
 * IMPORTANT: This file provides backward compatibility with the legacy error handling implementation.
 * New code should use the error handler implementation from:
 * - @/services/error/errorHandler.ts
 * 
 * This bridge ensures existing code continues to function while we transition to the improved structure.
 */

// Log deprecation warning in development
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'DEPRECATION NOTICE: Using services/error/apiErrors.ts is deprecated. ' +
    'Please use services/error/errorHandler.ts or import from services/error directly.'
  );
}

// Re-export everything from the main error handler implementation
export * from './errorHandler';
