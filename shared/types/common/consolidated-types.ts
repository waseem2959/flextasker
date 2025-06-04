/**
 * Consolidated Types
 * 
 * This file provides a single source of truth for common types used across
 * the frontend and backend of the application. It consolidates previously
 * scattered type definitions to prevent drift and inconsistency.
 */

// Import only specific types we know exist to avoid type errors
// We're not re-exporting from the other files to avoid naming conflicts
// Instead, we're defining the core shared types here to ensure consistency

// Import any types we need to reference

// Export namespaces to the existing modules for backward compatibility
import * as ApiTypes from './api-types';
import * as Enums from './enums';
import * as ErrorTypes from './error-types';
import * as TaskTypes from './task-types';
import * as UserTypes from './user-types';

export { ApiTypes, Enums, ErrorTypes, TaskTypes, UserTypes };

// Re-export the ValidationError type with a new name to avoid conflicts
  export type { ValidationError as ApiValidationErrorType } from './error-types';

/**
 * API Response Envelope
 * 
 * Standard structure for all API responses to ensure consistent
 * error handling and data extraction.
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    totalCount?: number;
  };
}

/**
 * Pagination Parameters
 * 
 * Standard parameters for paginated API requests.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Filter Parameters
 * 
 * Generic type for filter parameters used in API requests.
 */
export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string | string[];
  [key: string]: any;
}

/**
 * Query Parameters
 * 
 * Combined type for pagination and filtering.
 */
export type QueryParams = PaginationParams & FilterParams;

/**
 * Base Entity
 * 
 * Common fields that all entities should have.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entity with Soft Delete
 * 
 * For entities that support soft deletion.
 */
export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: string | null;
  isDeleted: boolean;
}

/**
 * Audit Fields
 * 
 * Common audit fields for tracking who created/updated entities.
 */
export interface AuditFields {
  createdBy: string;
  updatedBy: string;
}

/**
 * Entity with Audit
 * 
 * For entities that track audit information.
 */
export interface AuditedEntity extends BaseEntity, AuditFields {}

/**
 * ID Reference
 * 
 * For lightweight references to other entities.
 */
export interface IdReference {
  id: string;
  name?: string;
}

/**
 * File Upload
 * 
 * Standard file upload information.
 */
export interface FileUpload {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

/**
 * Geolocation
 * 
 * Standard format for geographical coordinates.
 */
export interface Geolocation {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Currency Amount
 * 
 * Standard format for monetary values.
 */
export interface CurrencyAmount {
  amount: number;
  currency: string;
}

/**
 * Time Period
 * 
 * Standard format for time periods.
 */
export interface TimePeriod {
  startDate: string;
  endDate: string;
}

/**
 * Contact Information
 * 
 * Standard format for contact details.
 */
export interface ContactInformation {
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

/**
 * API Error Response
 * 
 * Standard error response structure.
 */
export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

/**
 * API Validation Error
 * 
 * Specific error format for validation errors.
 */
export interface ApiValidationError extends ApiErrorResponse {
  validationErrors: Record<string, string[]>;
}

/**
 * Authentication Token Response
 * 
 * Standard response format for authentication tokens.
 */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}
