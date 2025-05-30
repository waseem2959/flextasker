/**
 * FlexTasker Type System with TypeScript Improvements
 * 
 * This file serves as the central export point for all type definitions,
 * providing a clean and organized type system throughout the application.
 * 
 * IMPORTANT: To avoid duplication, all core models are defined in consolidated-models.ts
 * and re-exported here. When making changes to models, always modify the consolidated
 * file rather than duplicating definitions.
 */

// Re-export all shared types from the shared directory
export * from '../../shared/types/enums';

// Re-export error types
export * from './errors';

// Re-export button-specific types
export * from './button';

// Import types with explicit names to avoid ambiguity errors

// From API modules
import * as ApiTypes from './api';
import * as ApiRequestTypes from './api-requests';

// From consolidated models
import * as ConsolidatedModels from './consolidated-models';

// Use consolidated models for task types
const TaskTypes = ConsolidatedModels;

// From messaging module
import * as MessagingTypes from './messaging';

// Re-export with namespaces to prevent naming conflicts
export { 
  ApiTypes,
  ApiRequestTypes,
  TaskTypes,
  ConsolidatedModels,
  MessagingTypes
};

// Export primary types directly (these are the canonical definitions)
// Using 'export type' syntax for proper isolation with isolatedModules
export { UserImpl } from './consolidated-models';
export type { 
  User,
  Task,
  Bid,
  Review,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  AuthContextType
} from './consolidated-models';

// Re-export types using the 'export type' syntax for better type isolation

// Import UserRole enum for type aliasing
import { UserRole, TaskStatus, TaskPriority, BudgetType, BidStatus } from '../../shared/types/enums';

// Type aliases for backward compatibility
export type UserRoleType = UserRole;
export type TaskStatusType = TaskStatus;
export type TaskPriorityType = TaskPriority;
export type BudgetTypeType = BudgetType;
export type BidStatusType = BidStatus;

// API Response types for consistent data handling (kept for backward compatibility)
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: import('./api').PaginationInfo;
  timestamp: string;
}