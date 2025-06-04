/**
 * API Type Definitions
 * 
 * This file defines the TypeScript interfaces for API requests and responses,
 * ensuring type safety and consistency across all API interactions.
 */

import { BidStatus, BudgetType, TaskPriority, TaskStatus } from '../../shared/types/enums';

/**
 * Standard API response structure used across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

/**
 * Comprehensive pagination information with support for different naming conventions
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;        // Total items (primary field name)
  totalItems?: number;  // Alternative field name for compatibility
  totalPages: number;
  hasNext: boolean;     // Primary field names
  hasPrev: boolean;
  hasNextPage?: boolean;    // Alternative field names for compatibility
  hasPreviousPage?: boolean;
  currentPage?: number;     // Alternative field name for compatibility
  itemsPerPage?: number;    // Alternative field name for compatibility
}

/**
 * Standard paginated response structure
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

/**
 * Alternative nested pagination format for backward compatibility
 * @deprecated Use PaginatedApiResponse directly when possible
 */
export interface LegacyPaginatedApiResponse<T = any> extends ApiResponse<{
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}> {}

/**
 * API Request parameters for pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task-related API types
 */

export interface TaskSearchParams extends PaginationParams {
  // Search and filtering
  query?: string;
  search?: string;
  category?: string | string[];
  
  // Status and priority
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  
  // Budget filtering (standardized on minBudget/maxBudget)
  minBudget?: number;
  maxBudget?: number;
  
  // Location
  isRemote?: boolean;
  location?: string;
  
  // Tags and metadata
  tags?: string[];
  
  // User filtering
  clientId?: string;
  taskerId?: string;
  
  // Date filtering
  createdAfter?: Date | string;
  createdBefore?: Date | string;
  
  // Sorting (inherited from PaginationParams but can be overridden)
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  categoryId?: string;
  category?: string;
  priority?: TaskPriority;
  budget: number;
  budgetType: BudgetType;
  
  // Location information (flexible format)
  isRemote?: boolean;
  location?: string | {
    isRemote: boolean;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
  
  // Additional metadata
  tags?: string[];
  requirements?: string[];
  skills?: string[];
  
  // Dates
  deadline?: string;
  startDate?: string;
  dueDate?: Date | string; // Alternative format
  
  // Attachments
  attachments?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  category?: string;
  priority?: TaskPriority;
  budget?: number;
  budgetType?: BudgetType;
  
  // Location information (flexible format)
  isRemote?: boolean;
  location?: string | {
    isRemote: boolean;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    }
  };
  
  // Additional metadata
  tags?: string[];
  requirements?: string[];
  skills?: string[];
  
  // Dates
  deadline?: string;
  startDate?: string;
  dueDate?: Date | string; // Alternative format
  
  // Status
  status?: TaskStatus;
  
  // Attachments
  attachments?: string[];
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

export interface BidSearchParams extends PaginationParams {
  taskId?: string;
  bidderId?: string;
  status?: BidStatus;
  minAmount?: number;
  maxAmount?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateBidRequest {
  taskId: string;
  amount: number;
  description?: string;
  message?: string;
  timeline?: string;
  deliveryTime?: number; // in days
  proposal?: string;
  attachments?: string[];
}

export interface UpdateBidRequest {
  amount?: number;
  description?: string;
  timeline?: string;
  message?: string;
  deliveryTime?: number;
  proposal?: string;
  attachments?: string[];
  status?: BidStatus;
}

/**
 * User-related API types
 */

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginRequest extends LoginCredentials {}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

export interface RegisterRequest extends RegisterData {
  confirmPassword: string;
  acceptTerms: boolean;
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
  skills?: string[];
  location?: string;
  website?: string;
  hourlyRate?: number;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * User search parameters interface for filtering users in API requests
 * Re-exported from shared/types/common/user-types.ts
 */
export type { UserSearchParams } from '../../shared/types/common/user-types';

/**
 * Review-related API types
 */

export interface CreateReviewRequest {
  taskId: string;
  rating: number;
  title?: string;
  comment?: string;
  revieweeId?: string;
  communicationRating?: number;
  qualityRating?: number;
  valueRating?: number;
  timeliness?: number;
  skills?: { skill: string; rating: number }[];
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Error Response from API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
}

/**
 * Notification data
 */
export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

/**
 * Socket event data structures
 */
export interface SocketEventData {
  taskUpdate: {
    taskId: string;
    changes: Record<string, any>;
  };
  bidReceived: {
    taskId: string;
    bidId: string;
    bidderId: string;
  };
  messageReceived: {
    chatId: string;
    messageId: string;
    senderId: string;
  };
  notification: NotificationData;
}

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API Client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCache: boolean;
  enableOffline: boolean;
}

/**
 * Request options for API client
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  offline?: boolean;
}

/**
 * Queue request options for offline support
 */
export interface QueueRequestOptions {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
  maxRetries?: number;
  retryDelay?: number;
}
