/**
 * Review Service
 * 
 * This service provides functionality for managing task and user reviews
 * including creation, retrieval, and analytics.
 */

import errorService from '@/services/error-service';
import { ApiResponse, PaginatedApiResponse, Review } from '@/types';
import { BaseApiService, BaseSearchParams } from './base-api-service';

/**
 * Review creation request interface
 */
export interface CreateReviewRequest {
  taskId: string;
  subjectId: string;
  rating: number;
  title: string;
  comment: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  isPublic?: boolean;
}

/**
 * Review update request interface
 */
export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  isPublic?: boolean;
}

/**
 * Review search parameters
 */
export interface ReviewSearchParams extends BaseSearchParams {
  taskId?: string;
  authorId?: string;
  subjectId?: string;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
}

/**
 * User rating statistics
 */
export interface UserRatingStats {
  userId: string;
  averageRating: number;
  totalReviews: number;
  communicationAverage?: number;
  qualityAverage?: number;
  timelinessAverage?: number;
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

/**
 * Review Service Class
 * 
 * Extends BaseApiService to provide standardized CRUD operations plus review-specific functionality.
 */
class ReviewService extends BaseApiService<Review, CreateReviewRequest, UpdateReviewRequest, ReviewSearchParams> {
  constructor() {
    super('/reviews');
  }

  /**
   * Get reviews for a specific task
   */
  async getTaskReviews(taskId: string, params?: Omit<ReviewSearchParams, 'taskId'>): Promise<PaginatedApiResponse<Review>> {
    try {
      return await this.customGet(`/tasks/${taskId}/reviews`, params) as PaginatedApiResponse<Review>;
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch task reviews');
      throw error;
    }
  }

  /**
   * Get reviews authored by a specific user
   */
  async getUserAuthoredReviews(userId: string, params?: Omit<ReviewSearchParams, 'authorId'>): Promise<PaginatedApiResponse<Review>> {
    try {
      return await this.customGet(`/users/${userId}/authored-reviews`, params) as PaginatedApiResponse<Review>;
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch user authored reviews');
      throw error;
    }
  }

  /**
   * Get reviews about a specific user
   */
  async getUserReceivedReviews(userId: string, params?: Omit<ReviewSearchParams, 'subjectId'>): Promise<PaginatedApiResponse<Review>> {
    try {
      return await this.customGet(`/users/${userId}/received-reviews`, params) as PaginatedApiResponse<Review>;
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch user received reviews');
      throw error;
    }
  }

  /**
   * Get rating statistics for a user
   */
  async getUserRatingStats(userId: string): Promise<ApiResponse<UserRatingStats>> {
    try {
      return await this.customGet(`/users/${userId}/rating-stats`);
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch user rating statistics');
      throw error;
    }
  }

  /**
   * Check if current user can review a task
   */
  async canReviewTask(taskId: string): Promise<ApiResponse<{canReview: boolean; reason?: string}>> {
    try {
      return await this.customGet(`/can-review/${taskId}`);
    } catch (error) {
      errorService.handleError(error, 'Failed to check review permission');
      throw error;
    }
  }

  /**
   * Flag a review as inappropriate
   */
  async flagReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
    try {
      return await this.customPost(`/${reviewId}/flag`, { reason });
    } catch (error) {
      errorService.handleError(error, 'Failed to flag review');
      throw error;
    }
  }

  /**
   * Override getAll to include error handling
   */
  async getAll(params?: ReviewSearchParams): Promise<PaginatedApiResponse<Review>> {
    try {
      return await super.getAll(params);
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch reviews');
      throw error;
    }
  }

  /**
   * Override getById to include error handling
   */
  async getById(id: string): Promise<ApiResponse<Review>> {
    try {
      return await super.getById(id);
    } catch (error) {
      errorService.handleError(error, 'Failed to fetch review');
      throw error;
    }
  }

  /**
   * Override create to include error handling
   */
  async create(data: CreateReviewRequest): Promise<ApiResponse<Review>> {
    try {
      return await super.create(data);
    } catch (error) {
      errorService.handleError(error, 'Failed to create review');
      throw error;
    }
  }

  /**
   * Override update to include error handling
   */
  async update(id: string, data: UpdateReviewRequest): Promise<ApiResponse<Review>> {
    try {
      return await super.update(id, data);
    } catch (error) {
      errorService.handleError(error, 'Failed to update review');
      throw error;
    }
  }

  /**
   * Override delete to include error handling
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      return await super.delete(id);
    } catch (error) {
      errorService.handleError(error, 'Failed to delete review');
      throw error;
    }
  }
}

// Create singleton instance
const reviewServiceInstance = new ReviewService();

// Export individual methods for backward compatibility and tree shaking
export const getReviews = (params?: ReviewSearchParams) => reviewServiceInstance.getAll(params);
export const getReviewById = (reviewId: string) => reviewServiceInstance.getById(reviewId);
export const createReview = (reviewData: CreateReviewRequest) => reviewServiceInstance.create(reviewData);
export const updateReview = (reviewId: string, reviewData: UpdateReviewRequest) => reviewServiceInstance.update(reviewId, reviewData);
export const deleteReview = (reviewId: string) => reviewServiceInstance.delete(reviewId);
export const getTaskReviews = (taskId: string, params?: Omit<ReviewSearchParams, 'taskId'>) => reviewServiceInstance.getTaskReviews(taskId, params);
export const getUserAuthoredReviews = (userId: string, params?: Omit<ReviewSearchParams, 'authorId'>) => reviewServiceInstance.getUserAuthoredReviews(userId, params);
export const getUserReceivedReviews = (userId: string, params?: Omit<ReviewSearchParams, 'subjectId'>) => reviewServiceInstance.getUserReceivedReviews(userId, params);
export const getUserRatingStats = (userId: string) => reviewServiceInstance.getUserRatingStats(userId);
export const canReviewTask = (taskId: string) => reviewServiceInstance.canReviewTask(taskId);
export const flagReview = (reviewId: string, reason: string) => reviewServiceInstance.flagReview(reviewId, reason);

// Export service object for backward compatibility
export const reviewService = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getTaskReviews,
  getUserAuthoredReviews,
  getUserReceivedReviews,
  getUserRatingStats,
  canReviewTask,
  flagReview
};

export default reviewService;
