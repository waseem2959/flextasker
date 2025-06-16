/**
 * Base API Service
 * 
 * Generic API service class that eliminates duplicate patterns across all API services.
 * Provides standardized CRUD operations, search functionality, and error handling.
 */

import { ApiResponse, PaginatedApiResponse } from '@/types';
import { apiClient } from './api-client';

/**
 * Generic search parameters interface
 */
export interface BaseSearchParams extends Record<string, string | number | boolean | undefined> {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic API service base class
 */
export abstract class BaseApiService<T, CreateRequest, UpdateRequest, SearchParams extends BaseSearchParams = BaseSearchParams> {
  protected readonly baseEndpoint: string;

  constructor(baseEndpoint: string) {
    this.baseEndpoint = baseEndpoint;
  }

  /**
   * Get all items with optional filtering
   */
  async getAll(params?: SearchParams): Promise<PaginatedApiResponse<T>> {
    return apiClient.get(this.baseEndpoint, params) as Promise<PaginatedApiResponse<T>>;
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return apiClient.get(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Create new item
   */
  async create(data: CreateRequest): Promise<ApiResponse<T>> {
    return apiClient.post(this.baseEndpoint, data);
  }

  /**
   * Update existing item
   */
  async update(id: string, data: UpdateRequest): Promise<ApiResponse<T>> {
    return apiClient.put(`${this.baseEndpoint}/${id}`, data);
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseEndpoint}/${id}`);
  }

  /**
   * Search items (alias for getAll with search params)
   */
  async search(params?: SearchParams): Promise<PaginatedApiResponse<T>> {
    return this.getAll(params);
  }

  /**
   * Get items by user ID
   */
  async getByUserId(userId: string, params?: SearchParams): Promise<PaginatedApiResponse<T>> {
    return apiClient.get(`/users/${userId}${this.baseEndpoint}`, params) as Promise<PaginatedApiResponse<T>>;
  }

  /**
   * Get current user's items
   */
  async getMy(params?: SearchParams): Promise<PaginatedApiResponse<T>> {
    return apiClient.get(`${this.baseEndpoint}/my-${this.getResourceName()}`, params) as Promise<PaginatedApiResponse<T>>;
  }

  /**
   * Batch operations
   */
  async createBatch(items: CreateRequest[]): Promise<ApiResponse<T[]>> {
    return apiClient.post(`${this.baseEndpoint}/batch`, { items });
  }

  async updateBatch(updates: Array<{ id: string; data: UpdateRequest }>): Promise<ApiResponse<T[]>> {
    return apiClient.put(`${this.baseEndpoint}/batch`, { updates });
  }

  async deleteBatch(ids: string[]): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseEndpoint}/batch/delete`, { ids });
  }

  /**
   * Get resource name from endpoint (e.g., '/tasks' -> 'tasks')
   */
  protected getResourceName(): string {
    return this.baseEndpoint.replace('/', '');
  }

  /**
   * Custom endpoint operations
   */
  protected async customGet<R = T>(endpoint: string, params?: any): Promise<ApiResponse<R>> {
    return apiClient.get(`${this.baseEndpoint}${endpoint}`, params);
  }

  protected async customPost<R = T>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
    return apiClient.post(`${this.baseEndpoint}${endpoint}`, data);
  }

  protected async customPut<R = T>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
    return apiClient.put(`${this.baseEndpoint}${endpoint}`, data);
  }

  protected async customDelete<R = void>(endpoint: string, data?: any): Promise<ApiResponse<R>> {
    return apiClient.delete(`${this.baseEndpoint}${endpoint}`, data);
  }
}

/**
 * Factory function to create API service instances
 */
export function createApiService<T, CreateRequest, UpdateRequest, SearchParams extends BaseSearchParams = BaseSearchParams>(
  baseEndpoint: string
) {
  return new (class extends BaseApiService<T, CreateRequest, UpdateRequest, SearchParams> {
    constructor() {
      super(baseEndpoint);
    }
  })();
}

/**
 * Utility type for API service methods
 */
export type ApiServiceMethods<T, CreateRequest, UpdateRequest, SearchParams extends BaseSearchParams = BaseSearchParams> = {
  getAll: (params?: SearchParams) => Promise<PaginatedApiResponse<T>>;
  getById: (id: string) => Promise<ApiResponse<T>>;
  create: (data: CreateRequest) => Promise<ApiResponse<T>>;
  update: (id: string, data: UpdateRequest) => Promise<ApiResponse<T>>;
  delete: (id: string) => Promise<ApiResponse<void>>;
  search: (params?: SearchParams) => Promise<PaginatedApiResponse<T>>;
  getByUserId: (userId: string, params?: SearchParams) => Promise<PaginatedApiResponse<T>>;
  getMy: (params?: SearchParams) => Promise<PaginatedApiResponse<T>>;
  createBatch: (items: CreateRequest[]) => Promise<ApiResponse<T[]>>;
  updateBatch: (updates: Array<{ id: string; data: UpdateRequest }>) => Promise<ApiResponse<T[]>>;
  deleteBatch: (ids: string[]) => Promise<ApiResponse<void>>;
};

export default BaseApiService;
