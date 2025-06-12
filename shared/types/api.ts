/**
 * Shared API Type Definitions
 * 
 * This file defines common interfaces for API requests and responses
 * that are shared between frontend and backend. This ensures consistency
 * and type safety across the application.
 */

import { BudgetType, TaskPriority, TaskStatus } from './enums';

/**
 * Re-export canonical API response types from the main types file
 * This ensures consistency between frontend and backend
 */
export type { ApiResponse, PaginatedApiResponse, PaginationInfo } from '../../src/types/api-types';

// Removed deprecated ApiSuccessResponse - use ApiResponse from api-types.ts instead

/**
 * Task-related API types
 */

export interface TaskSearchParams {
  categoryId?: string;
  status?: TaskStatus;
  search?: string;
  priority?: TaskPriority;
  minBudget?: number;
  maxBudget?: number;
  isRemote?: boolean;
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  categoryId: string;
  priority: TaskPriority;
  budget: number;
  budgetType: BudgetType;
  isRemote: boolean;
  location?: string;
  tags?: string[];
  requirements?: string[];
  deadline?: string;
  startDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: TaskPriority;
  budget?: number;
  budgetType?: BudgetType;
  isRemote?: boolean;
  location?: string;
  tags?: string[];
  requirements?: string[];
  deadline?: string;
  startDate?: string;
}

export interface CompleteTaskRequest {
  reviewTitle?: string;
  reviewComment?: string;
  rating?: number;
}

export interface CancelTaskRequest {
  reason: string;
}

/**
 * Bid-related API types
 * Re-exported from canonical location for consistency
 */

export type { BidSearchParams, CreateBidRequest, UpdateBidRequest } from '../../src/types/api-types';

/**
 * User-related API types
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  avatar?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

/**
 * Review-related API types
 */

export interface CreateReviewRequest {
  taskId: string;
  rating: number;
  title: string;
  comment: string;
  communicationRating?: number;
  qualityRating?: number;
  valueRating?: number;
  timeliness?: number;
}
