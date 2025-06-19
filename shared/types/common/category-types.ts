/**
 * Category Type Definitions
 * Shared category types used across the application
 */

/**
 * Base category interface
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category with task count
 */
export interface CategoryWithCount extends Category {
  taskCount: number;
  openTaskCount: number;
}

/**
 * Category creation request
 */
export interface CategoryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * Category update request
 */
export interface CategoryUpdateRequest extends Partial<CategoryCreateRequest> {
  isActive?: boolean;
}

/**
 * Category response
 */
export interface CategoryListResponse {
  categories: Category[];
  total: number;
}