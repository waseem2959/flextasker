/**
 * Bid Controller
 * 
 * Handles all HTTP requests related to bids, following the Single Responsibility Principle.
 * This controller is responsible for:
 * - Processing incoming bid requests
 * - Delegating business logic to the bid service
 * - Formatting and returning appropriate responses
 */

import { BidService } from '../services/bid-service';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { BaseController } from './base-controller';

export class BidController extends BaseController {
  private readonly bidService: BidService;

  constructor() {
    super();
    this.bidService = new BidService();
  }

  /**
   * Create a new bid on a task
   */
  createBid = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const bidData = {
      ...req.body,
      userId
    };
    
    logger.info('Creating new bid', { taskId: bidData.taskId, userId });
    const bid = await this.bidService.createBid(bidData);
    
    this.sendSuccess(res, bid, 'Bid submitted successfully', 201);
  });

  /**
   * Get a bid by ID
   */
  getBidById = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bidId = req.params.id;
    
    logger.info('Fetching bid by ID', { bidId });
    const bid = await this.bidService.getBidById(bidId);
    
    this.sendSuccess(res, bid, 'Bid retrieved successfully');
  });

  /**
   * Get all bids for a task
   */
  getBidsForTask = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.taskId;
    
    logger.info('Fetching bids for task', { taskId });
    const bids = await this.bidService.getBidsForTask(taskId);
    
    this.sendSuccess(res, bids, 'Task bids retrieved successfully');
  });

  /**
   * Get all bids for a user
   */
  getBidsForUser = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    logger.info('Fetching bids for user', { userId });
    const bids = await this.bidService.getBidsForUser(userId);
    
    this.sendSuccess(res, bids, 'User bids retrieved successfully');
  });

  /**
   * Accept a bid
   */
  acceptBid = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bidId = req.params.id;
    const taskId = req.body.taskId;
    const userId = req.user!.id;
    
    logger.info('Accepting bid', { bidId, taskId, userId });
    const bid = await this.bidService.acceptBid(bidId, taskId, userId);
    
    this.sendSuccess(res, bid, 'Bid accepted successfully');
  });

  /**
   * Reject a bid
   */
  rejectBid = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bidId = req.params.id;
    const taskId = req.body.taskId;
    const userId = req.user!.id;
    
    logger.info('Rejecting bid', { bidId, taskId, userId });
    const bid = await this.bidService.rejectBid(bidId, taskId, userId);
    
    this.sendSuccess(res, bid, 'Bid rejected successfully');
  });

  /**
   * Withdraw a bid
   */
  withdrawBid = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const bidId = req.params.id;
    const userId = req.user!.id;
    
    logger.info('Withdrawing bid', { bidId, userId });
    const bid = await this.bidService.withdrawBid(bidId, userId);
    
    this.sendSuccess(res, bid, 'Bid withdrawn successfully');
  });

  /**
   * Search bids based on criteria
   */
  searchBids = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const criteria = req.query;

    logger.info('Searching bids', { criteria });
    const bids = await this.bidService.searchBids(criteria);

    this.sendSuccess(res, bids, 'Bids retrieved successfully');
  });

  /**
   * Get bid statistics for a task
   */
  getBidStatistics = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params.taskId;

    logger.info('Fetching bid statistics for task', { taskId });
    const statistics = await this.bidService.getBidStatistics(taskId);

    this.sendSuccess(res, statistics, 'Bid statistics retrieved successfully');
  });
}

// Export controller instance
export const bidController = new BidController();
