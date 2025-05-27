/**
 * Centralized API Request Types
 * 
 * This file contains shared type definitions for API requests, 
 * responses, and related entities used throughout the application.
 */

/**
 * Common HTTP methods supported by the API
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Base request configuration shared across the application
 */
export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
  abortSignal?: AbortSignal;
  cache?: RequestCache;
  priority?: number;
  retry?: boolean;
  maxRetries?: number;
  entityType?: string;
  entityId?: string;
}

/**
 * Status for offline/queued requests
 */
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  FAILED = 'failed',
  COMPLETED = 'completed',
  CONFLICT = 'conflict'
}

/**
 * Strategy for handling conflicts when processing offline requests
 */
export enum ConflictStrategy {
  REPLACE = 'replace',    // Replace server data with local changes
  MERGE = 'merge',        // Attempt to merge changes
  SERVER_WINS = 'server-wins'  // Discard local changes if conflict
}

/**
 * A request that has been queued for offline processing
 */
export interface QueuedRequest extends ApiRequestConfig {
  id: string;
  status: RequestStatus;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  conflictStrategy?: ConflictStrategy;
}

/**
 * Data required to queue a new request (without internal tracking fields)
 */
export interface QueueRequestOptions extends Omit<ApiRequestConfig, 'id' | 'status' | 'timestamp' | 'retryCount' | 'lastError'> {
  conflictStrategy?: ConflictStrategy;
}

/**
 * Statistics about the offline request queue
 */
export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  conflict: number;
  total: number;
}

/**
 * Metadata for API performance tracking
 */
export interface RequestMetadata {
  endpoint: string;
  method: HttpMethod;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  success?: boolean;
  fromCache?: boolean;
  responseSize?: number;
  retryCount?: number;
}
