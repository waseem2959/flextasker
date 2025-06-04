/**
 * Review Service
 * Handles all review-related operations including creating, reading, updating,
 * and deleting reviews, as well as retrieving review statistics.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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

      // Check if task exists
      const task = await prisma.task.findUnique({
        where: { id: reviewData.taskId }
      });

      if (!task) {
        throw new ReviewError('Task not found', 'TASK_NOT_FOUND');
      }

      // Check if reviewer and reviewee exist
      const [reviewer, reviewee] = await Promise.all([
        prisma.user.findUnique({ where: { id: reviewData.reviewerId } }),
        prisma.user.findUnique({ where: { id: reviewData.revieweeId } })
      ]);

      if (!reviewer) {
        throw new ReviewError('Reviewer not found', 'REVIEWER_NOT_FOUND');
      }

      if (!reviewee) {
        throw new ReviewError('Reviewee not found', 'REVIEWEE_NOT_FOUND');
      }

      // Check if review already exists for this task and reviewer
      const existingReview = await prisma.review.findFirst({
        where: {
          taskId: reviewData.taskId,
          reviewerId: reviewData.reviewerId,
          revieweeId: reviewData.revieweeId
        }
      });

      if (existingReview) {
        throw new ReviewError('Review already exists for this task and reviewer', 'REVIEW_EXISTS');
      }

      // Create the review
      const newReview = await prisma.review.create({
        data: {
          taskId: reviewData.taskId,
          reviewerId: reviewData.reviewerId,
          revieweeId: reviewData.revieweeId,
          rating: reviewData.rating,
          communicationRating: reviewData.communicationRating,
          qualityRating: reviewData.qualityRating,
          title: reviewData.title,
          comment: reviewData.comment
        },
        include: {
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
      });

      logger.info('Review created successfully', {
        reviewId: newReview.id,
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
    try {
      if (!reviewId) {
        throw new ReviewError('Review ID is required', 'MISSING_REVIEW_ID');
      }

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
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
      });

      if (!review) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      return review;
    } catch (error) {
      logger.error('Error getting review by ID', { error, reviewId });
      throw error;
    }
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

      const reviews = await prisma.review.findMany({
        where: whereClause,
        include: {
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
        skip,
        take: limit
      });

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

      const reviews = await prisma.review.findMany({
        where: { taskId },
        include: {
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
      });

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
      const existingReview = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!existingReview) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      if (existingReview.reviewerId !== userId) {
        throw new ReviewError('Only the reviewer can update this review', 'UNAUTHORIZED');
      }

      // Validate rating if provided
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new ReviewError('Rating must be between 1 and 5', 'INVALID_RATING');
      }

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: updateData,
        include: {
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
      });

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
      const existingReview = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!existingReview) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      if (existingReview.reviewerId !== userId) {
        throw new ReviewError('Only the reviewer can delete this review', 'UNAUTHORIZED');
      }

      await prisma.review.delete({
        where: { id: reviewId }
      });

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

      const result = await prisma.review.aggregate({
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

      const reviews = await prisma.review.findMany({
        where: whereClause,
        include: {
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
        skip,
        take: limit
      });

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
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

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
        originalRating: review.rating,
        originalComment: review.comment
      });

      // If action is 'remove', delete the review
      if (action === 'remove') {
        await prisma.review.delete({
          where: { id: reviewId }
        });
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
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new ReviewError('Review not found', 'REVIEW_NOT_FOUND');
      }

      // Check if user is the reviewee (the one being reviewed)
      if (review.revieweeId !== userId) {
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
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

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
        reportedReviewerId: review.reviewerId,
        reportedRevieweeId: review.revieweeId
      });

    } catch (error) {
      logger.error('Error reporting review', { error, reviewId, userId });
      throw error;
    }
  }
}

// Export singleton instance
export const reviewService = ReviewService.getInstance();
