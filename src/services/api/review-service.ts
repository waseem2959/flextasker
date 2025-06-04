/**
 * Review Service
 * 
 * This service provides functionality for managing task and user reviews
 * including creation, retrieval, and analytics.
 */

import { ApiResponse, PaginatedApiResponse, Review } from '@/types';
import { errorService } from '../error/error-service';
import { apiClient } from './api-client';

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
export interface ReviewSearchParams {
  taskId?: string;
  authorId?: string;
  subjectId?: string;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
 * Fetch reviews with optional filtering
 * 
 * @param params - Search parameters for filtering reviews
 * @returns Promise with paginated reviews
 */
export async function getReviews(params?: ReviewSearchParams): Promise<PaginatedApiResponse<Review>> {
  try {
    return await apiClient.get('/reviews', params as any) as PaginatedApiResponse<Review>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch reviews');
    throw error;
  }
}

/**
 * Get a specific review by ID
 * 
 * @param reviewId - The review ID
 * @returns Promise with the review details
 */
export async function getReviewById(reviewId: string): Promise<ApiResponse<Review>> {
  try {
    return await apiClient.get(`/reviews/${reviewId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch review');
    throw error;
  }
}

/**
 * Create a new review
 * 
 * @param reviewData - The review data
 * @returns Promise with the created review
 */
export async function createReview(reviewData: CreateReviewRequest): Promise<ApiResponse<Review>> {
  try {
    return await apiClient.post('/reviews', reviewData);
  } catch (error) {
    errorService.handleError(error, 'Failed to create review');
    throw error;
  }
}

/**
 * Update an existing review
 * 
 * @param reviewId - The review ID
 * @param reviewData - The updated review data
 * @returns Promise with the updated review
 */
export async function updateReview(
  reviewId: string, 
  reviewData: UpdateReviewRequest
): Promise<ApiResponse<Review>> {
  try {
    return await apiClient.put(`/reviews/${reviewId}`, reviewData);
  } catch (error) {
    errorService.handleError(error, 'Failed to update review');
    throw error;
  }
}

/**
 * Delete a review
 * 
 * @param reviewId - The review ID
 * @returns Promise indicating success or failure
 */
export async function deleteReview(reviewId: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete(`/reviews/${reviewId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to delete review');
    throw error;
  }
}

/**
 * Get reviews for a specific task
 * 
 * @param taskId - The task ID
 * @param params - Additional search parameters
 * @returns Promise with paginated task reviews
 */
export async function getTaskReviews(
  taskId: string, 
  params?: Omit<ReviewSearchParams, 'taskId'>
): Promise<PaginatedApiResponse<Review>> {
  try {
    return await apiClient.get(`/tasks/${taskId}/reviews`, params) as PaginatedApiResponse<Review>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch task reviews');
    throw error;
  }
}

/**
 * Get reviews authored by a specific user
 * 
 * @param userId - The user ID
 * @param params - Additional search parameters
 * @returns Promise with paginated reviews authored by the user
 */
export async function getUserAuthoredReviews(
  userId: string,
  params?: Omit<ReviewSearchParams, 'authorId'>
): Promise<PaginatedApiResponse<Review>> {
  try {
    return await apiClient.get(`/users/${userId}/authored-reviews`, params) as PaginatedApiResponse<Review>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch user authored reviews');
    throw error;
  }
}

/**
 * Get reviews about a specific user
 * 
 * @param userId - The user ID
 * @param params - Additional search parameters
 * @returns Promise with paginated reviews about the user
 */
export async function getUserReceivedReviews(
  userId: string,
  params?: Omit<ReviewSearchParams, 'subjectId'>
): Promise<PaginatedApiResponse<Review>> {
  try {
    return await apiClient.get(`/users/${userId}/received-reviews`, params) as PaginatedApiResponse<Review>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch user received reviews');
    throw error;
  }
}

/**
 * Get rating statistics for a user
 * 
 * @param userId - The user ID
 * @returns Promise with user rating statistics
 */
export async function getUserRatingStats(userId: string): Promise<ApiResponse<UserRatingStats>> {
  try {
    return await apiClient.get(`/users/${userId}/rating-stats`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch user rating statistics');
    throw error;
  }
}

/**
 * Check if current user can review a task
 * 
 * @param taskId - The task ID
 * @returns Promise with boolean indicating if review is allowed
 */
export async function canReviewTask(taskId: string): Promise<ApiResponse<{canReview: boolean; reason?: string}>> {
  try {
    return await apiClient.get(`/reviews/can-review/${taskId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to check review permission');
    throw error;
  }
}

/**
 * Flag a review as inappropriate
 * 
 * @param reviewId - The review ID
 * @param reason - Reason for flagging
 * @returns Promise indicating success or failure
 */
export async function flagReview(reviewId: string, reason: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.post(`/reviews/${reviewId}/flag`, { reason });
  } catch (error) {
    errorService.handleError(error, 'Failed to flag review');
    throw error;
  }
}

// Export service object
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
