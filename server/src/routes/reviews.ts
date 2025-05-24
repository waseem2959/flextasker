import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param } from 'express-validator';
import { ReviewService } from '@/services/review';
import { validate } from '@/middleware/validation';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { sendSuccess } from '@/utils/response';

/**
 * Review routes - these are like different windows at a feedback center
 * where users can leave reviews, read testimonials, and manage their
 * reputation on the platform.
 */

const router = Router();
const reviewService = new ReviewService();

/**
 * Create New Review
 * POST /api/v1/reviews
 * 
 * This is like writing a performance evaluation - users can leave detailed
 * feedback about their experience working with someone on a completed task.
 */
router.post('/',
  authenticateToken,
  validate([
    body('taskId')
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('subjectId')
      .notEmpty()
      .withMessage('Subject ID is required'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('comment')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters'),
    
    body('communicationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Communication rating must be between 1 and 5'),
    
    body('qualityRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Quality rating must be between 1 and 5'),
    
    body('timelinessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Timeliness rating must be between 1 and 5'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.createReview(req.user!.id, req.body);
      
      sendSuccess(res, review, 'Review created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Review by ID
 * GET /api/v1/reviews/:id
 * 
 * This is like reading a detailed testimonial with all the context
 * about the work performed and the reviewer's experience.
 */
router.get('/:id',
  optionalAuth,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Review ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.getReviewById(req.params.id, req.user?.id);
      
      sendSuccess(res, review, 'Review retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update Review
 * PUT /api/v1/reviews/:id
 * 
 * This allows reviewers to edit their feedback within a limited time window,
 * like correcting or adding details to a performance evaluation.
 */
router.put('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Review ID is required'),
    
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters'),
    
    body('communicationRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Communication rating must be between 1 and 5'),
    
    body('qualityRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Quality rating must be between 1 and 5'),
    
    body('timelinessRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Timeliness rating must be between 1 and 5'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewService.updateReview(req.params.id, req.user!.id, req.body);
      
      sendSuccess(res, review, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Search Reviews
 * GET /api/v1/reviews/search
 * 
 * This is like browsing testimonials with filters - users can see reviews
 * for specific people, tasks, or rating ranges to assess reputation.
 */
router.get('/search',
  optionalAuth,
  validate([
    query('taskId')
      .optional()
      .notEmpty()
      .withMessage('Task ID cannot be empty'),
    
    query('authorId')
      .optional()
      .notEmpty()
      .withMessage('Author ID cannot be empty'),
    
    query('subjectId')
      .optional()
      .notEmpty()
      .withMessage('Subject ID cannot be empty'),
    
    query('minRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Minimum rating must be between 1 and 5'),
    
    query('maxRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Maximum rating must be between 1 and 5'),
    
    query('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        taskId: req.query.taskId as string,
        authorId: req.query.authorId as string,
        subjectId: req.query.subjectId as string,
        minRating: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
        maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined,
        isVerified: req.query.isVerified === 'true',
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewService.searchReviews(filters, page, limit);
      
      sendSuccess(res, result, 'Review search completed');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get User Review Statistics
 * GET /api/v1/reviews/user/:userId/stats
 * 
 * This is like generating a reputation report showing someone's overall
 * rating, review trends, and detailed feedback statistics.
 */
router.get('/user/:userId/stats',
  optionalAuth,
  validate([
    param('userId')
      .notEmpty()
      .withMessage('User ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await reviewService.getUserReviewStats(req.params.userId);
      
      sendSuccess(res, stats, 'User review statistics retrieved');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Vote Review as Helpful
 * POST /api/v1/reviews/:id/helpful
 * 
 * This is like giving a thumbs up to useful feedback - it helps surface
 * the most valuable reviews for other users to read.
 */
router.post('/:id/helpful',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Review ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reviewService.voteReviewHelpful(req.params.id, req.user!.id);
      
      sendSuccess(res, null, 'Review voted as helpful');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete Review
 * DELETE /api/v1/reviews/:id
 * 
 * This allows authors to remove their reviews within a limited time window,
 * like retracting feedback if circumstances change or mistakes were made.
 */
router.delete('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Review ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reviewService.deleteReview(req.params.id, req.user!.id);
      
      sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;