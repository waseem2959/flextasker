/**
 * Review Service
 * 
 * This service provides business logic for review-related operations.
 * It uses caching to improve performance for frequently accessed data.
 */

import { PrismaClient } from '@prisma/client';
import { cacheService, CachePrefix } from '../utils/cache';
import { logger } from '../utils/logger';
import { ErrorType } from '../../../shared/types/errors';
import { TaskStatus } from '../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  REVIEW_DETAIL: 60 * 10,      // 10 minutes
  TASK_REVIEWS: 60 * 15,       // 15 minutes
  USER_REVIEWS: 60 * 15,       // 15 minutes
};

/**
 * Custom error class for review-related errors
 */
export class ReviewError extends Error {
  type: ErrorType;
  statusCode: number;

  constructor(message: string, type: ErrorType, statusCode: number) {
    super(message);
    this.name = 'ReviewError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Review service for review-related operations
 */
export class ReviewService {
  /**
   * Get a review by ID with caching
   */
  public async getReviewById(reviewId: string): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.REVIEW}${reviewId}`;
      
      // Try to get from cache first
      const cachedReview = await cacheService.get<any>(cacheKey);
      if (cachedReview) {
        logger.debug('Cache hit for review', { reviewId });
        return cachedReview;
      }
      
      // Cache miss, fetch from database
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true
            }
          }
        }
      });
      
      if (review) {
        // Cache the result
        await cacheService.set(cacheKey, review, CACHE_TTL.REVIEW_DETAIL);
        logger.debug('Cached review', { reviewId });
      }
      
      return review;
    } catch (error) {
      logger.error('Failed to get review', { reviewId, error });
      throw error;
    }
  }

  /**
   * Get reviews for a task with caching
   */
  public async getTaskReviews(taskId: string): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.TASK}${taskId}:reviews`;
      
      // Try to get from cache first
      const cachedReviews = await cacheService.get<any[]>(cacheKey);
      if (cachedReviews) {
        logger.debug('Cache hit for task reviews', { taskId });
        return cachedReviews;
      }
      
      // Cache miss, fetch from database
      const reviews = await prisma.review.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });
      
      // Cache the result
      await cacheService.set(cacheKey, reviews, CACHE_TTL.TASK_REVIEWS);
      logger.debug('Cached task reviews', { taskId, count: reviews.length });
      
      return reviews;
    } catch (error) {
      logger.error('Failed to get task reviews', { taskId, error });
      throw error;
    }
  }

  /**
   * Get reviews for a user with caching and pagination
   */
  public async getUserReviews(userId: string, page = 1, limit = 10): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:reviews:${page}:${limit}`;
      
      // Try to get from cache first
      const cachedResult = await cacheService.get<any>(cacheKey);
      if (cachedResult) {
        logger.debug('Cache hit for user reviews', { userId });
        return cachedResult;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute queries in parallel
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            task: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        prisma.review.count({ where: { userId } })
      ]);
      
      // Calculate average rating
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
      
      const result = {
        reviews,
        averageRating,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL.USER_REVIEWS);
      logger.debug('Cached user reviews', { userId, count: reviews.length });
      
      return result;
    } catch (error) {
      logger.error('Failed to get user reviews', { userId, error });
      throw error;
    }
  }

  /**
   * Create a review for a completed task
   */
  public async createReview(reviewData: any): Promise<any> {
    try {
      const { taskId, reviewerId, userId, rating, comment } = reviewData;
      
      // Validate task exists and is completed
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { 
          id: true, 
          status: true, 
          ownerId: true, 
          assigneeId: true 
        }
      });
      
      if (!task) {
        throw new ReviewError('Task not found', ErrorType.NOT_FOUND, 404);
      }
      
      if (task.status !== TaskStatus.COMPLETED) {
        throw new ReviewError('Can only review completed tasks', ErrorType.VALIDATION, 400);
      }
      
      // Verify reviewer is either the task owner or assignee
      if (reviewerId !== task.ownerId && reviewerId !== task.assigneeId) {
        throw new ReviewError('Only task owner or assignee can leave a review', ErrorType.AUTHORIZATION, 403);
      }
      
      // Verify the person being reviewed is the counterparty
      if ((reviewerId === task.ownerId && userId !== task.assigneeId) || 
          (reviewerId === task.assigneeId && userId !== task.ownerId)) {
        throw new ReviewError('Invalid user for review', ErrorType.VALIDATION, 400);
      }
      
      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          taskId,
          reviewerId,
          userId
        }
      });
      
      if (existingReview) {
        throw new ReviewError('You have already reviewed this user for this task', ErrorType.CONFLICT, 409);
      }
      
      // Start transaction
      const [review, updatedUser] = await prisma.$transaction(async (prisma) => {
        // Create review
        const newReview = await prisma.review.create({
          data: {
            taskId,
            reviewerId,
            userId,
            rating,
            comment
          },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });
        
        // Update user's average rating
        const allUserReviews = await prisma.review.findMany({
          where: { userId }
        });
        
        const averageRating = allUserReviews.reduce((sum, review) => sum + review.rating, 0) / allUserReviews.length;
        
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { averageRating },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            averageRating: true
          }
        });
        
        return [newReview, updatedUser];
      });
      
      // Invalidate related caches
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}*`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${taskId}*`);
      
      return { review, updatedUser };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      logger.error('Failed to create review', { reviewData, error });
      throw error;
    }
  }

  /**
   * Update a review
   */
  public async updateReview(reviewId: string, updates: any, reviewerId: string): Promise<any> {
    try {
      // Get existing review for validation
      const existingReview = await this.getReviewById(reviewId);
      
      if (!existingReview) {
        throw new ReviewError('Review not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Only the reviewer can update their own review
      if (existingReview.reviewerId !== reviewerId) {
        throw new ReviewError('Not authorized to update this review', ErrorType.AUTHORIZATION, 403);
      }
      
      // Start transaction
      const [updatedReview, updatedUser] = await prisma.$transaction(async (prisma) => {
        // Update review
        const newReview = await prisma.review.update({
          where: { id: reviewId },
          data: {
            rating: updates.rating,
            comment: updates.comment
          },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });
        
        // Update user's average rating if the rating changed
        if (updates.rating !== undefined && updates.rating !== existingReview.rating) {
          const allUserReviews = await prisma.review.findMany({
            where: { userId: existingReview.userId }
          });
          
          const averageRating = allUserReviews.reduce((sum, review) => sum + review.rating, 0) / allUserReviews.length;
          
          const updatedUser = await prisma.user.update({
            where: { id: existingReview.userId },
            data: { averageRating },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              averageRating: true
            }
          });
          
          return [newReview, updatedUser];
        }
        
        return [newReview, null];
      });
      
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.REVIEW}${reviewId}`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingReview.userId}*`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${existingReview.taskId}*`);
      
      return { 
        review: updatedReview,
        updatedUser: updatedUser || undefined
      };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      logger.error('Failed to update review', { reviewId, updates, error });
      throw error;
    }
  }

  /**
   * Delete a review (admin only)
   */
  public async deleteReview(reviewId: string): Promise<void> {
    try {
      // Get existing review to invalidate cache later
      const existingReview = await this.getReviewById(reviewId);
      
      if (!existingReview) {
        throw new ReviewError('Review not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Start transaction
      await prisma.$transaction(async (prisma) => {
        // Delete the review
        await prisma.review.delete({
          where: { id: reviewId }
        });
        
        // Update user's average rating
        const allUserReviews = await prisma.review.findMany({
          where: { userId: existingReview.userId }
        });
        
        const averageRating = allUserReviews.length > 0
          ? allUserReviews.reduce((sum, review) => sum + review.rating, 0) / allUserReviews.length
          : 0;
        
        await prisma.user.update({
          where: { id: existingReview.userId },
          data: { averageRating }
        });
      });
      
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.REVIEW}${reviewId}`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingReview.userId}*`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${existingReview.taskId}*`);
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }
      logger.error('Failed to delete review', { reviewId, error });
      throw error;
    }
  }
}

// Export singleton instance
export const reviewService = new ReviewService();

export default reviewService;
