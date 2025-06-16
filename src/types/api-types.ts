/**
 * API Type Definitions
 *
 * This file re-exports API types from the shared types directory to avoid duplication.
 * @deprecated Use types from @/shared/types/common/api-types instead
 */

// Re-export from shared types to maintain backward compatibility
export type {
    PaginationMeta as ApiPaginationMeta,
    ApiResponse
} from '../../shared/types/common/api-types';

// Import for local use
import type { ApiResponse as BaseApiResponse } from '../../shared/types/common/api-types';

// Create our own PaginatedApiResponse that extends ApiResponse
export interface PaginatedApiResponse<T = any> extends BaseApiResponse<T[]> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Re-export enums
export { BidStatus, BudgetType, TaskPriority, TaskStatus } from '../../shared/types/common/enums';

// Import enums for use in this file
import { BidStatus, BudgetType, TaskPriority, TaskStatus } from '../../shared/types/common/enums';

// All types are now re-exported from shared types above

// Re-export commonly used request/response types for backward compatibility
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Task-related types - keeping essential ones for backward compatibility
export interface TaskSearchParams extends PaginationParams {
  query?: string;
  category?: string | string[];
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  clientId?: string;
  taskerId?: string;
}

// Essential request types for backward compatibility
export interface CreateTaskRequest {
  title: string;
  description: string;
  category?: string;
  budget: number;
  budgetType: BudgetType;
  location?: string;
  dueDate?: Date | string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: string;
  budget?: number;
  budgetType?: BudgetType;
  location?: string;
  status?: TaskStatus;
}

// Essential auth types for backward compatibility
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

// Re-export user search params from shared types
export type { UserSearchParams } from '../../shared/types/common/user-types';

// Essential bid types
export interface CreateBidRequest {
  taskId: string;
  amount: number;
  description?: string;
  message?: string;
  timeline?: string;
}

export interface UpdateBidRequest {
  amount?: number;
  description?: string;
  message?: string;
  timeline?: string;
  status?: BidStatus;
}

export interface BidSearchParams extends PaginationParams {
  taskId?: string;
  bidderId?: string;
  status?: BidStatus;
  [key: string]: string | number | boolean | undefined;
}

// Essential review types
export interface CreateReviewRequest {
  taskId: string;
  rating: number;
  title?: string;
  comment?: string;
}

// HTTP types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Queue request options for offline support
export interface QueueRequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  retryDelay?: number;
}
