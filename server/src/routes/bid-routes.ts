/**
 * Bid Routes
 * 
 * These routes handle all bid-related operations including:
 * - Creating and submitting bids
 * - Updating bid details
 * - Accepting and rejecting bids
 * - Searching and filtering bids
 * - Retrieving bid statistics
 */

import { bidController } from '@/controllers/bid-controller';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { BidStatus, UserRole } from '../../../shared/types/enums';
import { authenticateToken, requireRoles } from '../middleware/auth-middleware';
import { validate } from '../middleware/validation-middleware';

const router = Router();

/**
 * Create New Bid
 * POST /api/v1/bids
 */
router.post('/',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  validate([
    body('taskId').isUUID().withMessage('Valid task ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Bid amount must be greater than 0'),
    body('description').isString().trim().isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('timeline').isString().trim().isLength({ min: 5, max: 200 })
      .withMessage('Timeline must be between 5 and 200 characters')
  ]),
  bidController.createBid
);

/**
 * Get Bid by ID
 * GET /api/v1/bids/:id
 */
router.get('/:id',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid bid ID format')
  ]),
  bidController.getBidById
);

/**
 * Update Bid
 * PATCH /api/v1/bids/:id
 * 
 * Note: Updating bids is not directly supported in the current implementation.
 * Bids should be immutable to maintain integrity. Consider withdrawing and creating a new bid instead.
 */
router.patch('/:id',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  validate([
    param('id').isUUID().withMessage('Valid bid ID is required')
  ]),
  (_req: Request, res: Response, _next: NextFunction) => {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Bids are immutable. Please withdraw and create a new bid instead.'
    });
  }
);

/**
 * Delete/Withdraw Bid
 * DELETE /api/v1/bids/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  validate([
    param('id').isUUID().withMessage('Invalid bid ID format')
  ]),
  bidController.withdrawBid
);

/**
 * Accept Bid
 * POST /api/v1/bids/:id/accept
 */
router.post('/:id/accept',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validate([
    param('id').isUUID().withMessage('Invalid bid ID format')
  ]),
  bidController.acceptBid
);

/**
 * Reject Bid
 * POST /api/v1/bids/:id/reject
 */
router.post('/:id/reject',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validate([
    param('id').isUUID().withMessage('Invalid bid ID format'),
    body('reason').optional().isString().trim().isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ]),
  bidController.rejectBid
);

/**
 * Get Bids for Task
 * GET /api/v1/bids/task/:taskId
 */
router.get('/task/:taskId',
  authenticateToken,
  validate([
    param('taskId').isUUID().withMessage('Invalid task ID format'),
    query('status').optional().isIn(Object.values(BidStatus))
      .withMessage('Invalid bid status'),
    query('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  bidController.getBidsForTask
);

/**
 * Get My Bids
 * GET /api/v1/bids/my-bids
 */
router.get('/my-bids',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  bidController.getBidsForUser
);

/**
 * Get Bids I've Received
 * GET /api/v1/bids/received
 * 
 * Note: This endpoint is not directly implemented. Use task-specific bid endpoints instead.
 */
router.get('/received',
  authenticateToken,
  requireRoles([UserRole.USER]),
  (_req: Request, res: Response, _next: NextFunction) => {
    res.status(501).json({
      success: false,
      error: 'Not implemented. Please use /tasks/:taskId/bids to get bids for a specific task.'
    });
  }
);

/**
 * Get Bid Statistics for Task
 * GET /api/v1/bids/statistics/task/:taskId
 */
router.get('/statistics/task/:taskId',
  authenticateToken,
  validate([
    param('taskId').isUUID().withMessage('Valid task ID is required')
  ]),
  bidController.getBidStatistics
);

/**
 * Search Bids (Admin only)
 * GET /api/v1/bids/search
 */
router.get('/search',
  authenticateToken,
  requireRoles([UserRole.ADMIN]),
  validate([
    query('taskId').optional().isUUID().withMessage('Invalid task ID format'),
    query('userId').optional().isUUID().withMessage('Invalid user ID format'),
    query('status').optional().isIn(Object.values(BidStatus))
      .withMessage('Invalid bid status'),
    query('minAmount').optional().isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    query('maxAmount').optional().isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number'),
    query('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  bidController.searchBids
);

export default router;
