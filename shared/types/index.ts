/**
 * Unified Types Export
 * 
 * Single source of truth for all shared types between frontend and backend.
 * This file consolidates all type definitions to prevent duplication and
 * ensure consistency across the codebase.
 */

// Export error types and enums (single source of truth)
export * from './errors';
export * from './common/enums';

// Export API types
export * from './common/api-types';

// Export domain-specific types
export * from './common/user-types';
export * from './common/category-types';

// Export unified task types (consolidates common/task-types)
export * from './task/unified-task-types';

// Export configuration types
export * from '../config/task-config';

// Re-export key types for convenience
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  ValidationErrorDetail,
  ValidationError
} from './common/api-types';

// Enums are already exported as values via `export * from './common/enums'` and `export * from './errors'`
// No need to re-export as types since they need to be used as values