/**
 * Review Service
 * Handles all review-related operations including creating, reading, updating,
 * and deleting reviews, as well as retrieving review statistics.
 */
import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { logger } from '../utils/logger';

/**
 * ReviewError class for handling review-specific errors
 */
export class ReviewError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ReviewError';
  }
}

/**
 * Interface for creating a new review
 */
interface CreateReviewData {
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  communicationRating?: number;
  qualityRating?: number;
  title?: string;
  comment?: string;
}

/**
 * Interface for updating a review
 */
interface UpdateReviewData {
  rating?: number;
  communicationRating?: number;
  qualityRating?: number;
  title?: string;
  comment?: string;
}

/**
 * Interface for review filters
 */
interface ReviewFilters {
  taskId?: string;
  reviewerId?: string;
  revieweeId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  page?: number;
  limit?: number;
}

export class ReviewService {
  private static instance: ReviewService;

  /**
   * Get the singleton instance of ReviewService
   */
  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Create a new review
   */
  async createReview(reviewData: CreateReviewData): Promise<any> {
    try {
      // Validate required fields
      if (!reviewData.taskId || !reviewData.reviewerId || !reviewData.revieweeId) {
        throw new ReviewError('Missing required fields: taskId, reviewerId, revieweeId', 'MISSING_FIELDS');
      }

      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new ReviewError('Rating must be between 1 and 5', 'INVALID_RATING');
      }

      // DatabaseQueryBuilder is now imported at the top

      // Check if task exists
      await DatabaseQueryBuilder.findById(models.task, reviewData.taskId, 'Task', { id: true });

      // Check if reviewer and reviewee exist
      await Promise.all([
        DatabaseQueryBuilder.findById(models.user, reviewData.reviewerId, 'User', { id: true }),
        DatabaseQueryBuilder.findById(models.user, reviewData.revieweeId, 'User', { id: true })
      ]);

      // Check if review already exists for this task and reviewer
      const existingReviewExists = await DatabaseQueryBuilder.exists(
        models.review,
        {
          taskId: reviewData.taskId,
          reviewerId: reviewData.reviewerId,
          revieweeId: reviewData.revieweeId
        },
        'Review'
      );

      if (existingReviewExists) {
        throw new ReviewError('Review already exists for this task and reviewer', 'REVIEW_EXISTS');
      }

      // Create the review
      const newReview = await DatabaseQueryBuilder.create(
        models.review,
        {
          taskId: reviewData.taskId,
          reviewerId: reviewData.reviewerId,
          revieweeId: reviewData.revieweeId,
          rating: reviewData.rating,
          communicationRating: reviewData.communicationRating,
          qualityRating: reviewData.qualityRating,
          title: reviewData.title,
          comment: reviewData.comment
        },
        'Review',
        {
          id: true,
          taskId: true,
          reviewerId: true,
          revieweeId: true,
          rating: true,
          communicationRating: true,
          qualityRating: true,
          title: true,
          comment: true,
          createdAt: true,
          task: {
            select: { id: true, title: true }
          },
          reviewer: {
            select: { id: true, firstName: true, lastName: true }
          },
          reviewee: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      );

      logger.info('Review created successfully', {
        reviewId: (newReview as any).id,
        taskId: reviewData.taskId,
        reviewerId: reviewData.reviewerId,
        revieweeId: reviewData.revieweeId
      });

      return newReview;
    } catch (error) {
      logger.error('Error creating review', { error, reviewData });
      throw error;
    }
  }

  /**
   * Get a review by ID
   */
  async getReviewById(reviewId: string): Promise<any> {
    if (!reviewId) {
      throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
    }

    // DatabaseQueryBuilder is now imported at the top

    return DatabaseQueryBuilder.findById(
      models.review,
      reviewId,
      'Review',
      {
        id: true,
        taskId: true,
        reviewerId: true,
        revieweeId: true,
        rating: true,
        communicationRating: true,
        qualityRating: true,
        title: true,
        comment: true,
        createdAt: true,
        task: {
          select: { id: true, title: true }
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true }
        },
        reviewee: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    );
  }

  /**
   * Get all reviews for a specific user (as reviewee)
   */
  async getReviewsForUser(userId: string, options: { page?: number; limit?: number; type?: 'received' | 'given' } = {}): Promise<any[]> {
    try {
      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      const { page = 1, limit = 10, type = 'received' } = options;
      const skip = (page - 1) * limit;

      const whereClause = type === 'received'
        ? { revieweeId: userId }
        : { reviewerId: userId };

      const { items: reviews } = await DatabaseQueryBuilder.findMany(
        models.review,
        {
          where: whereClause,
          select: {
            id: true,
            taskId: true,
            reviewerId: true,
            revieweeId: true,
            rating: true,
            communicationRating: true,
            qualityRating: true,
            title: true,
            comment: true,
            createdAt: true,
            task: {
              select: { id: true, title: true }
            },
            reviewer: {
              select: { id: true, firstName: true, lastName: true }
            },
            reviewee: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip, limit }
        },
        'Review'
      );

      return reviews;
    } catch (error) {
      logger.error('Error getting reviews for user', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get all reviews for a specific task
   */
  async getReviewsForTask(taskId: string): Promise<any[]> {
    try {
      if (!taskId) {
        throw new ReviewError('Task ID is required', 'MISSING_TASK_ID');
      }

      // DatabaseQueryBuilder is now imported at the top

      const { items: reviews } = await DatabaseQueryBuilder.findMany(
        models.review,
        {
          where: { taskId },
          select: {
            id: true,
            taskId: true,
            reviewerId: true,
            revieweeId: true,
            rating: true,
            communicationRating: true,
            qualityRating: true,
            title: true,
            comment: true,
            createdAt: true,
            task: {
              select: { id: true, title: true }
            },
            reviewer: {
              select: { id: true, firstName: true, lastName: true }
            },
            reviewee: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        'Review'
      );

      return reviews;
    } catch (error) {
      logger.error('Error getting reviews for task', { error, taskId });
      throw error;
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId: string, updateData: UpdateReviewData, userId: string): Promise<any> {
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      // Check if review exists and user is the reviewer
      const existingReview = await DatabaseQueryBuilder.findById(
        models.review,
        reviewId,
        'Review',
        {
          id: true,
          reviewerId: true
        }
      );

      if (!existingReview) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      if ((existingReview as any).reviewerId !== userId) {
        throw new ReviewError('Only the reviewer can update this review', 'UNAUTHORIZED');
      }

      // Validate rating if provided
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new ReviewError('Rating must be between 1 and 5', 'INVALID_RATING');
      }

      const updatedReview = await DatabaseQueryBuilder.update(
        models.review,
        reviewId,
        updateData,
        'Review'
      );

      logger.info('Review updated successfully', { reviewId, userId });
      return updatedReview;
    } catch (error) {
      logger.error('Error updating review', { error, reviewId, userId });
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<{ success: boolean }> {
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      // Check if review exists and user is the reviewer
      const existingReview = await DatabaseQueryBuilder.findById(
        models.review,
        reviewId,
        'Review',
        {
          id: true,
          reviewerId: true
        }
      );

      if (!existingReview) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      if ((existingReview as any).reviewerId !== userId) {
        throw new ReviewError('Only the reviewer can delete this review', 'UNAUTHORIZED');
      }

      await DatabaseQueryBuilder.delete(
        models.review,
        reviewId,
        'Review'
      );

      logger.info('Review deleted successfully', { reviewId, userId });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting review', { error, reviewId, userId });
      throw error;
    }
  }

  /**
   * Get the average rating for a user
   */
  async getAverageRatingForUser(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      const result = await models.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      if (!result._count.rating || result._count.rating === 0) {
        return 0; // No reviews yet
      }

      return Number((result._avg.rating ?? 0).toFixed(2));
    } catch (error) {
      logger.error('Error calculating average rating for user', { error, userId });
      throw error;
    }
  }

  /**
   * Search reviews based on criteria
   */
  async searchReviews(criteria: ReviewFilters): Promise<any[]> {
    try {
      const { page = 1, limit = 10, ...searchCriteria } = criteria;
      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (searchCriteria.taskId) {
        whereClause.taskId = searchCriteria.taskId;
      }

      if (searchCriteria.reviewerId) {
        whereClause.reviewerId = searchCriteria.reviewerId;
      }

      if (searchCriteria.revieweeId) {
        whereClause.revieweeId = searchCriteria.revieweeId;
      }

      if (searchCriteria.rating) {
        whereClause.rating = searchCriteria.rating;
      }

      if (searchCriteria.minRating || searchCriteria.maxRating) {
        whereClause.rating = {};
        if (searchCriteria.minRating) {
          whereClause.rating.gte = searchCriteria.minRating;
        }
        if (searchCriteria.maxRating) {
          whereClause.rating.lte = searchCriteria.maxRating;
        }
      }

      const { items: reviews } = await DatabaseQueryBuilder.findMany(
        models.review,
        {
          where: whereClause,
          select: {
            id: true,
            taskId: true,
            reviewerId: true,
            revieweeId: true,
            rating: true,
            communicationRating: true,
            qualityRating: true,
            title: true,
            comment: true,
            createdAt: true,
            task: {
              select: { id: true, title: true }
            },
            reviewer: {
              select: { id: true, firstName: true, lastName: true }
            },
            reviewee: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip, limit }
        },
        'Review'
      );

      return reviews;
    } catch (error) {
      logger.error('Error searching reviews', { error, criteria });
      throw error;
    }
  }

  /**
   * Get reviews with filters and pagination
   */
  async getReviews(filters: ReviewFilters = {}): Promise<any[]> {
    try {
      return await this.searchReviews(filters);
    } catch (error) {
      logger.error('Error getting reviews', { error, filters });
      throw error;
    }
  }

  /**
   * Moderate a review (admin function)
   */
  async moderateReview(reviewId: string, action: string, reason?: string, adminId?: string): Promise<void> {
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      if (!action) {
        throw new ReviewError('Action is required', 'MISSING_ACTION');
      }

      if (!['approve', 'reject', 'flag', 'remove'].includes(action)) {
        throw new ReviewError('Invalid moderation action', 'INVALID_ACTION');
      }

      // Check if review exists
      const review = await DatabaseQueryBuilder.findById(
        models.review,
        reviewId,
        'Review',
        {
          id: true,
          reviewerId: true,
          revieweeId: true,
          comment: true
        }
      );

      if (!review) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      // For now, we'll just log the moderation action
      // In a full implementation, you might want to add a moderation table
      // or add moderation fields to the review model
      logger.info('Review moderation action performed', {
        reviewId,
        action,
        reason,
        adminId,
        originalRating: (review as any).rating,
        originalComment: (review as any).comment
      });

      // If action is 'remove', delete the review
      if (action === 'remove') {
        await DatabaseQueryBuilder.delete(
          models.review,
          reviewId,
          'Review'
        );
        logger.info('Review removed by admin', { reviewId, adminId });
      }

    } catch (error) {
      logger.error('Error moderating review', { error, reviewId, action });
      throw error;
    }
  }

  /**
   * Respond to a review (Note: This would typically require a separate ReviewResponse model)
   */
  async respondToReview(reviewId: string, userId: string, response: string): Promise<any> {
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      if (!response || response.trim().length === 0) {
        throw new ReviewError('Response cannot be empty', 'EMPTY_RESPONSE');
      }

      // Check if review exists
      const review = await DatabaseQueryBuilder.findById(
        models.review,
        reviewId,
        'Review',
        {
          id: true,
          reviewerId: true,
          revieweeId: true
        }
      );

      if (!review) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      // Check if user is the reviewee (the one being reviewed)
      if ((review as any).revieweeId !== userId) {
        throw new ReviewError('Only the reviewee can respond to this review', 'UNAUTHORIZED');
      }

      // For now, we'll return a mock response object
      // In a full implementation, you would create a ReviewResponse model
      const reviewResponse = {
        id: `response-${Date.now()}`,
        reviewId,
        userId,
        response: response.trim(),
        createdAt: new Date().toISOString()
      };

      logger.info('Response to review created', { reviewId, userId, responseLength: response.length });
      return reviewResponse;
    } catch (error) {
      logger.error('Error responding to review', { error, reviewId, userId });
      throw error;
    }
  }

  /**
   * Report a review (Note: This would typically require a separate ReviewReport model)
   */
  async reportReview(reviewId: string, userId: string, reason: string, details?: string): Promise<void> {
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      if (!userId) {
        throw new ReviewError('User ID is required', 'MISSING_USER_ID');
      }

      if (!reason) {
        throw new ReviewError('Reason is required', 'MISSING_REASON');
      }

      if (!['spam', 'inappropriate', 'fake', 'harassment', 'other'].includes(reason)) {
        throw new ReviewError('Invalid report reason', 'INVALID_REASON');
      }

      // Check if review exists
      const review = await DatabaseQueryBuilder.findById(
        models.review,
        reviewId,
        'Review',
        {
          id: true,
          reviewerId: true,
          revieweeId: true
        }
      );

      if (!review) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      // For now, we'll just log the report
      // In a full implementation, you would create a ReviewReport model
      logger.info('Review reported', {
        reviewId,
        userId,
        reason,
        details,
        reportedReviewerId: (review as any).reviewerId,
        reportedRevieweeId: (review as any).revieweeId
      });

    } catch (error) {
      logger.error('Error reporting review', { error, reviewId, userId });
      throw error;
    }
  }
}

// Export singleton instance
export const reviewService = ReviewService.getInstance();
