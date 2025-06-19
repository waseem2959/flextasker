/**
 * Review Controller
 * 
 * Handles HTTP requests related to reviews, delegating business logic
 * to the review service and formatting responses.
 */

import { Request, Response } from 'express';
import { reviewService } from '../services/review-service';
import { logger } from '../utils/logger';
import { BaseController } from './base-controller';

class ReviewController extends BaseController {
  /**
   * Create a new review
   */
  createReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewData = {
      ...req.body,
      authorId: (req.user as any)!.id
    };

    logger.info('Creating new review', { taskId: reviewData.taskId, subjectId: reviewData.subjectId });
    const review = await reviewService.createReview(reviewData);
    
    return this.sendSuccess(res, review, 'Review created successfully');
  });

  /**
   * Get a review by ID
   */
  getReviewById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;

    logger.info('Retrieving review', { reviewId });
    const review = await reviewService.getReviewById(reviewId);
    
    return this.sendSuccess(res, review, 'Review retrieved successfully');
  });

  /**
   * Get reviews for a specific user
   */
  getReviewsForUser = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || 'newest';

    logger.info('Retrieving reviews for user', { userId, page, limit, sort });
    const reviews = await reviewService.getReviewsForUser(userId, { page, limit } as any);
    
    return this.sendSuccess(res, reviews, 'User reviews retrieved successfully');
  });

  /**
   * Get reviews for a specific task
   */
  getReviewsForTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.taskId;

    logger.info('Retrieving reviews for task', { taskId });
    const reviews = await reviewService.getReviewsForTask(taskId);
    
    return this.sendSuccess(res, reviews, 'Task reviews retrieved successfully');
  });

  /**
   * Update an existing review
   */
  updateReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const userId = (req.user as any)!.id;
    const updateData = req.body;

    logger.info('Updating review', { reviewId, userId });
    const review = await reviewService.updateReview(reviewId, userId, updateData);
    
    return this.sendSuccess(res, review, 'Review updated successfully');
  });

  /**
   * Delete a review
   */
  deleteReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const userId = (req.user as any)!.id;

    logger.info('Deleting review', { reviewId, userId });
    await reviewService.deleteReview(reviewId, userId);
    
    return this.sendSuccess(res, null, 'Review deleted successfully');
  });

  /**
   * Respond to a review
   */
  respondToReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const userId = (req.user as any)!.id;
    const { response } = req.body;

    logger.info('Responding to review', { reviewId, userId });
    const result = await reviewService.respondToReview(reviewId, userId, response);
    
    return this.sendSuccess(res, result, 'Response added to review');
  });

  /**
   * Report a review as inappropriate
   */
  reportReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const userId = (req.user as any)!.id;
    const { reason, details } = req.body;

    logger.info('Reporting review', { reviewId, userId, reason });
    await reviewService.reportReview(reviewId, userId, reason, details);

    return this.sendSuccess(res, null, 'Review reported successfully');
  });

  /**
   * Flag a review (alias for report - frontend compatibility)
   */
  flagReview = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const reviewId = req.params.id;
    const userId = (req.user as any)!.id;
    const { reason } = req.body;

    logger.info('Flagging review', { reviewId, userId, reason });
    // Map frontend reason to backend reason format
    const mappedReason = reason.toLowerCase().includes('inappropriate') ? 'inappropriate' : 'other';
    await reviewService.reportReview(reviewId, userId, mappedReason, reason);

    return this.sendSuccess(res, null, 'Review flagged successfully');
  });

  /**
   * Search reviews with filters
   */
  searchReviews = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = {
      taskId: req.query.taskId as string,
      userId: req.query.userId as string,
      minRating: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
      maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort: req.query.sort as string || 'newest'
    };

    logger.info('Searching reviews', { filters });
    const results = await reviewService.searchReviews(filters);
    
    return this.sendSuccess(res, results, 'Search results retrieved successfully');
  });
}

// Export controller instance
export const reviewController = new ReviewController();
