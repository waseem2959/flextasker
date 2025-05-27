/**
 * API Type Definitions
 * 
 * This file defines the TypeScript interfaces for API requests and responses,
 * ensuring type safety and consistency across all API interactions.
 */

import { BidStatus, TaskPriority, TaskStatus, BudgetType, UserRole } from './enums';

/**
 * Common API response structure used across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  timestamp: string;
}

/**
 * Pagination response structure for paginated API endpoints
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Alternative pagination format returned by some endpoints
 * @deprecated Use PaginatedApiResponse directly when possible
 */
export interface LegacyPaginatedApiResponse<T = any> extends ApiResponse<{
  items: T[];
  pagination: PaginationInfo;
}> {}

/**
 * Pagination information returned by the API
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Task-related API types
 */

export interface TaskSearchParams {
  category?: string;
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
  deadline?: string; // ISO date string
  startDate?: string; // ISO date string
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
  deadline?: string; // ISO date string
  startDate?: string; // ISO date string
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
 */

export interface BidSearchParams {
  taskId?: string;
  bidderId?: string;
  status?: BidStatus;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface CreateBidRequest {
  taskId: string;
  amount: number;
  description: string;
  timeline: string;
}

export interface UpdateBidRequest {
  amount?: number;
  description?: string;
  timeline?: string;
}

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
  role: string; // Uses UserRole enum
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
 * User search parameters interface for filtering users in API requests
 */
export interface UserSearchParams {
  role?: UserRole | UserRole[];
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  minTrustScore?: number;
  maxTrustScore?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
