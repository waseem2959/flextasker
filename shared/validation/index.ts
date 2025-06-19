/**
 * Validation Index
 * Central export point for all validation schemas and functions
 */

// Export task validation
export * from './task-validation';

// Re-export zod for convenience
export { z } from 'zod';