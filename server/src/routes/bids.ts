import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { BidService } from '@/services/bid';
import { sendSuccess, sendError } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { AppError } from '@/utils/errors';

// Define BidStatus enum locally since we can't import from @/types/enums
enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

// Define interfaces for request/response types to enhance type safety
interface CreateBidRequest {
  taskId: string;
  amount: number;
  description: string;
  timeline: string;
}

interface UpdateBidRequest {
  amount?: number;
  description?: string;
  timeline?: string;
}

interface SearchBidsRequest {
  taskId?: string;
  bidderId?: string;
  status?: BidStatus;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// Removed unused interfaces: GetTaskBidStatisticsRequest and GetMyBidsRequest

/**
 * Bid routes - these are like different windows at an employment agency
 * where job seekers can submit applications, employers can review proposals,
 * and both parties can manage their bidding relationships.
 */

const router = Router();
const bidService = new BidService();

/**
 * Helper function to validate and convert bid status from request parameters
 * This replaces unsafe 'as any' casting with proper type validation
 * 
 * @param status - The status value to validate
 * @returns The validated status as a BidStatus enum or undefined if invalid
 * @throws AppError if the status is not valid and shouldThrow is true
 */
function validateBidStatus(status: unknown, shouldThrow = false): BidStatus | undefined {
  if (typeof status === 'string' && Object.values(BidStatus).includes(status as BidStatus)) {
    return status as BidStatus;
  }
  
  if (shouldThrow) {
    throw new AppError(`Invalid bid status: ${status}. Must be one of: ${Object.values(BidStatus).join(', ')}`, 400);
  }
  
  return undefined;
}

/**
 * Create New Bid
 * POST /api/v1/bids
 * 
 * This is like submitting a job application - taskers provide their proposal
 * including the price they'll work for, their approach, and timeline.
 */
router.post('/',
  authenticateToken,
  validate([
    body('taskId')
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Bid amount must be greater than 0'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('timeline')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Timeline must be between 5 and 200 characters'),
  ]),
  async (req: Request<{}, {}, CreateBidRequest>, res: Response, next: NextFunction) => {
    try {
      const { taskId, amount, description, timeline } = req.body;
      
      // Better approach: Explicitly pass only the needed fields rather than the entire req.body
      const bid = await bidService.createBid(req.user!.id, {
        taskId,
        amount,
        description,
        timeline
      });
      
      sendSuccess(res, bid, 'Bid submitted successfully', 201);
    } catch (error) {
      // Log error for monitoring but don't expose sensitive details to client
      console.error('Error creating bid:', error);
      next(error);
    }
  }
);

/**
 * Get Bid by ID
 * GET /api/v1/bids/:id
 * 
 * This is like reviewing a specific job application with all its details,
 * including the applicant's qualifications and proposal specifics.
 */
router.get('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Bid ID is required'),
  ]),
  async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
      const bid = await bidService.getBidById(req.params.id, req.user!.id);
      
      if (!bid) {
        return sendError(res, 'Bid not found', 404);
      }
      
      sendSuccess(res, bid, 'Bid retrieved successfully');
    } catch (error) {
      console.error('Error retrieving bid:', error);
      next(error);
    }
  }
);

/**
 * Update Bid
 * PUT /api/v1/bids/:id
 * 
 * This allows bidders to revise their proposals, like updating a job
 * application before the deadline with better terms or more details.
 */
router.put('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Bid ID is required'),
    
    body('amount')
      .optional()
      .isFloat({ min: 1 })
      .withMessage('Bid amount must be greater than 0'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('timeline')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Timeline must be between 5 and 200 characters'),
  ]),
  async (req: Request<{ id: string }, any, UpdateBidRequest, never>, res: Response, next: NextFunction) => {
    try {
      // Explicit destructuring to ensure only valid fields are passed
      const { amount, description, timeline } = req.body;
      
      const bid = await bidService.updateBid(req.params.id, req.user!.id, {
        amount,
        description,
        timeline
      });
      
      if (!bid) {
        return sendError(res, 'Bid not found or you do not have permission to update it', 404);
      }
      
      sendSuccess(res, bid, 'Bid updated successfully');
    } catch (error) {
      console.error('Error updating bid:', error);
      next(error);
    }
  }
);

/**
 * Accept Bid
 * POST /api/v1/bids/:id/accept
 * 
 * This is like hiring someone for a job - it accepts their proposal,
 * starts the work relationship, and rejects other applicants.
 */
router.post('/:id/accept',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Bid ID is required'),
  ]),
  async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
      const result = await bidService.acceptBid(req.params.id, req.user!.id);
      
      if (!result) {
        return sendError(res, 'Bid not found or you do not have permission to accept it', 404);
      }
      
      sendSuccess(res, result, 'Bid accepted successfully');
    } catch (error) {
      console.error('Error accepting bid:', error);
      next(error);
    }
  }
);

/**
 * Reject Bid
 * POST /api/v1/bids/:id/reject
 * 
 * This is like declining a job application - it lets the applicant know
 * their proposal wasn't selected for this opportunity.
 */
router.post('/:id/reject',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Bid ID is required'),
  ]),
  async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    try {
      // Store the result in a variable
      await bidService.rejectBid(req.params.id, req.user!.id);
      
      // Don't check void return value - if there was an error, it would have thrown
      
      sendSuccess(res, null, 'Bid rejected successfully');
    } catch (error) {
      console.error('Error rejecting bid:', error);
      next(error);
    }
  }
);

/**
 * Withdraw Bid
 * POST /api/v1/bids/:id/withdraw
 * 
 * This is like retracting a job application - bidders can withdraw their
 * proposals if they're no longer available or interested.
 */
router.post('/:id/withdraw',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Bid ID is required'),
  ]),
  async (req: Request<any, any, any, SearchBidsRequest>, res: Response, next: NextFunction) => {
    try {
      await bidService.withdrawBid(req.params.id, req.user!.id);
      
      sendSuccess(res, null, 'Bid withdrawn successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Search Bids
 * GET /api/v1/bids/search
 * 
 * This is like browsing through job applications or proposal submissions
 * with various filters to find specific bids or analyze bidding patterns.
 */
router.get('/search',
  authenticateToken,
  validate([
    query('taskId')
      .optional()
      .notEmpty()
      .withMessage('Task ID cannot be empty'),
    
    query('bidderId')
      .optional()
      .notEmpty()
      .withMessage('Bidder ID cannot be empty'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
      .withMessage('Status must be PENDING, ACCEPTED, REJECTED, or WITHDRAWN'),
    
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a positive number'),
    
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a positive number'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request<any, any, any, SearchBidsRequest>, res: Response, next: NextFunction) => {
    try {
      // Use proper type validation instead of unsafe 'as any' casting
      // This ensures that only valid enum values make it to your business logic
      const validatedStatus = validateBidStatus(req.query.status);
      
      const searchParams: SearchBidsRequest = {
        taskId: req.query.taskId,
        bidderId: req.query.bidderId,
        status: validatedStatus,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10
      };

      const result = await bidService.searchBids(searchParams, req.user!.id);
      
      sendSuccess(res, result, 'Bid search completed');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Task Bid Statistics
 * GET /api/v1/bids/task/:taskId/stats
 * 
 * This is like getting a summary report of all applications received
 * for a job posting, helping employers understand market response.
 */
router.get('/task/:taskId/stats',
  authenticateToken,
  validate([
    param('taskId')
      .notEmpty()
      .withMessage('Task ID is required'),
  ]),
  async (req: Request<any, any, any, SearchBidsRequest>, res: Response, next: NextFunction) => {
    try {
      const stats = await bidService.getTaskBidStatistics(req.params.taskId, req.user!.id);
      
      sendSuccess(res, stats, 'Bid statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get My Bids
 * GET /api/v1/bids/my
 * 
 * This is like viewing your job application history - shows all the
 * proposals you've submitted and their current status.
 */
router.get('/my',
  authenticateToken,
  validate([
    query('status')
      .optional()
      .isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
      .withMessage('Status must be PENDING, ACCEPTED, REJECTED, or WITHDRAWN'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request<any, any, any, SearchBidsRequest>, res: Response, next: NextFunction) => {
    try {
      // Use proper type validation for the status filter
      const validatedStatus = validateBidStatus(req.query.status);
      
      const filters = {
        bidderId: req.user!.id,
        status: validatedStatus, // Now properly typed instead of using 'as any'
      };

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await bidService.searchBids(filters, req.user!.id, page, limit);
      
      sendSuccess(res, result, 'Your bids retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;