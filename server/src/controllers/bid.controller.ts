/**
 * Bid Controller
 * 
 * Handles all HTTP requests related to bids, following the Single Responsibility Principle.
 * This controller is responsible for:
 * - Processing incoming bid requests
 * - Delegating business logic to the bid service
 * - Formatting and returning appropriate responses
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { BidService } from '@/services/bid';
import { logger } from '@/utils/logger';

export class BidController extends BaseController {
  private bidService: BidService;

  constructor() {
    super();
    this.bidService = new BidService();
  }

  /**
   * Create a new bid on a task
   */
  createBid = this.asyncHandler(async (req: Request, res: Response) => {
    const bidderId = req.user.id;
    const bidData = {
      ...req.body,
      bidderId
    };
    
    logger.info('Creating new bid', { taskId: bidData.taskId, userId: bidderId });
    const bid = await this.bidService.createBid(bidData);
    
    return this.sendSuccess(res, bid, 'Bid submitted successfully', 201);
  });

  /**
   * Get a bid by ID
   */
  getBidById = this.asyncHandler(async (req: Request, res: Response) => {
    const bidId = req.params.id;
    const userId = req.user?.id;
    
    logger.info('Fetching bid by ID', { bidId, userId });
    const bid = await this.bidService.getBidById(bidId, userId);
    
    return this.sendSuccess(res, bid, 'Bid retrieved successfully');
  });

  /**
   * Update an existing bid
   */
  updateBid = this.asyncHandler(async (req: Request, res: Response) => {
    const bidId = req.params.id;
    const bidderId = req.user.id;
    const updateData = req.body;
    
    logger.info('Updating bid', { bidId, userId: bidderId });
    const updatedBid = await this.bidService.updateBid(bidId, bidderId, updateData);
    
    return this.sendSuccess(res, updatedBid, 'Bid updated successfully');
  });

  /**
   * Get all bids for a task
   */
  getBidsByTask = this.asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.taskId;
    const userId = req.user?.id;
    
    logger.info('Fetching bids by task', { taskId, userId });
    const bids = await this.bidService.getBidsByTask(taskId, userId);
    
    return this.sendSuccess(res, bids, 'Bids retrieved successfully');
  });

  /**
   * Get all bids by a user
   */
  getBidsByUser = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId || req.user.id;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info('Fetching bids by user', { userId, status });
    const result = await this.bidService.getBidsByUser(userId, status, page, limit);
    
    return this.sendSuccess(res, result, 'Bids retrieved successfully');
  });

  /**
   * Accept a bid
   */
  acceptBid = this.asyncHandler(async (req: Request, res: Response) => {
    const bidId = req.params.id;
    const taskOwnerId = req.user.id;
    
    logger.info('Accepting bid', { bidId, userId: taskOwnerId });
    const result = await this.bidService.acceptBid(bidId, taskOwnerId);
    
    return this.sendSuccess(res, result, 'Bid accepted successfully');
  });

  /**
   * Reject a bid
   */
  rejectBid = this.asyncHandler(async (req: Request, res: Response) => {
    const bidId = req.params.id;
    const taskOwnerId = req.user.id;
    
    logger.info('Rejecting bid', { bidId, userId: taskOwnerId });
    const result = await this.bidService.rejectBid(bidId, taskOwnerId);
    
    return this.sendSuccess(res, result, 'Bid rejected successfully');
  });

  /**
   * Withdraw a bid
   */
  withdrawBid = this.asyncHandler(async (req: Request, res: Response) => {
    const bidId = req.params.id;
    const bidderId = req.user.id;
    
    logger.info('Withdrawing bid', { bidId, userId: bidderId });
    const result = await this.bidService.withdrawBid(bidId, bidderId);
    
    return this.sendSuccess(res, result, 'Bid withdrawn successfully');
  });
}
