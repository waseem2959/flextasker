/**
 * Shared API Type Definitions (Enhanced)
 * 
 * This file extends the original api-types.ts with additional types
 * needed for the enhanced API client implementation.
 */

import { ErrorType, HttpStatusCode } from './enums';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

/**
 * API error interface
 */
export interface ApiError {
  type: ErrorType;
  code: string;
  message: string;
  status: HttpStatusCode;
  details?: Record<string, any>;
  path?: string;
  timestamp?: string;
}

/**
 * Validation error detail interface
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

/**
 * Validation error interface
 */
export interface ValidationError extends ApiError {
  type: ErrorType.VALIDATION;
  details: {
    errors: ValidationErrorDetail[];
  };
}

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * API filter parameters interface
 */
export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

/**
 * API search parameters interface
 */
export interface SearchParams {
  query?: string;
  filters?: FilterParams;
  pagination?: PaginationParams;
}

/**
 * API authentication headers
 */
export interface AuthHeaders {
  Authorization: string;
}

/**
 * API file upload response
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

/**
 * API batch operation response
 */
export interface BatchOperationResponse<T = any> {
  success: boolean;
  results: {
    id: string;
    success: boolean;
    data?: T;
    error?: ApiError;
  }[];
  meta: {
    total: number;
    successful: number;
    failed: number;
    timestamp: string;
  };
}

/**
 * API health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
      message?: string;
    };
  };
}

/**
 * WebSocket event interface
 */
export interface WebSocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  senderId?: string;
  targetId?: string;
  meta?: Record<string, any>;
}

/**
 * Rate limiting response headers
 */
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

/**
 * Enhanced API client configuration interface
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  
  // Added for enhanced client:
  authToken?: string;
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryStatusCodes: number[];
  };
}

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

/**
 * API Error Response Type for use in error handling
 */
export type ApiErrorResponse = Omit<ApiResponse<never>, 'data'> & { error: ApiError };
