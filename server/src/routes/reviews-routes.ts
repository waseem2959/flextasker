/**
 * Review Routes
 * 
 * These routes handle all review-related operations including:
 * - Creating and submitting reviews
 * - Retrieving reviews for users and tasks
 * - Managing review responses
 * - Reporting inappropriate reviews
 */

import { reviewController } from '../controllers/review-controller';
import { authenticateToken, optionalAuth } from '../middleware/auth-middleware';
// Legacy validation removed - was non-functional placeholder
import { Router } from 'express';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * Create New Review
 * POST /api/v1/reviews
 */
router.post('/',
  authenticateToken,
  [
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
    
    body('valueRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Value rating must be between 1 and 5')
  ],
  reviewController.createReview
);

/**
 * Get Review by ID
 * GET /api/v1/reviews/:id
 */
router.get('/:id',
  optionalAuth,
  [
    param('id').isUUID().withMessage('Invalid review ID format')
  ],
  reviewController.getReviewById
);

/**
 * Get Reviews for User
 * GET /api/v1/reviews/user/:userId
 */
router.get('/user/:userId',
  optionalAuth,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest']).withMessage('Invalid sort option')
  ],
  reviewController.getReviewsForUser
);

/**
 * Get Reviews for Task
 * GET /api/v1/reviews/task/:taskId
 */
router.get('/task/:taskId',
  optionalAuth,
  [
    param('taskId').isUUID().withMessage('Invalid task ID format')
  ],
  reviewController.getReviewsForTask
);

/**
 * Update Review
 * PUT /api/v1/reviews/:id
 */
router.put('/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid review ID format'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('comment').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
    body('communicationRating').optional().isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    body('qualityRating').optional().isInt({ min: 1, max: 5 }).withMessage('Quality rating must be between 1 and 5'),
    body('valueRating').optional().isInt({ min: 1, max: 5 }).withMessage('Value rating must be between 1 and 5')
  ],
  reviewController.updateReview
);

/**
 * Delete Review
 * DELETE /api/v1/reviews/:id
 */
router.delete('/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid review ID format')
  ],
  reviewController.deleteReview
);

/**
 * Respond to Review
 * POST /api/v1/reviews/:id/response
 */
router.post('/:id/response',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid review ID format'),
    body('response').trim().isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters')
  ],
  reviewController.respondToReview
);

/**
 * Report Review
 * POST /api/v1/reviews/:id/report
 */
router.post('/:id/report',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid review ID format'),
    body('reason').isIn(['inappropriate', 'spam', 'fake', 'other']).withMessage('Invalid report reason'),
    body('details').optional().trim().isLength({ max: 500 }).withMessage('Details cannot exceed 500 characters')
  ],
  reviewController.reportReview
);

/**
 * Flag Review (Alias for Report - for frontend compatibility)
 * POST /api/v1/reviews/:id/flag
 */
router.post('/:id/flag',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid review ID format'),
    body('reason').isString().trim().notEmpty().withMessage('Reason is required')
  ],
  reviewController.flagReview
);

/**
 * Search Reviews
 * GET /api/v1/reviews/search
 */
router.get('/search',
  optionalAuth,
  [
    query('taskId').optional().isUUID().withMessage('Invalid task ID format'),
    query('userId').optional().isUUID().withMessage('Invalid user ID format'),
    query('minRating').optional().isInt({ min: 1, max: 5 }).withMessage('Minimum rating must be between 1 and 5'),
    query('maxRating').optional().isInt({ min: 1, max: 5 }).withMessage('Maximum rating must be between 1 and 5'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest']).withMessage('Invalid sort option')
  ],
  reviewController.searchReviews
);

export default router;
