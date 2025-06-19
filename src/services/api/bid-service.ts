/**
 * Bid Service
 * 
 * This service provides API methods for bid management:
 * - Creating and updating bids
 * - Searching and retrieving bids
 * - Managing bid status (accept/reject/withdraw)
 */

import { ApiResponse, Bid, BidSearchParams, CreateBidRequest, UpdateBidRequest } from '@/types';
import { BaseApiService } from './base-api-service';

/**
 * Task bid statistics
 */
export interface TaskBidStatistics {
  taskId: string;
  bidCount: number;
  averageBid: number;
  minBid: number;
  maxBid: number;
  pendingBids: number;
  acceptedBids: number;
  rejectedBids: number;
  withdrawnBids: number;
}

/**
 * Bid Service Class
 * 
 * Extends BaseApiService to provide standardized CRUD operations plus bid-specific functionality.
 */
class BidService extends BaseApiService<Bid, CreateBidRequest, UpdateBidRequest, BidSearchParams> {
  constructor() {
    super('/bids');
  }

  /**
   * Get all bids for a specific task
   */
  async getBidsByTask(taskId: string, params?: BidSearchParams) {
    return this.customGet(`/tasks/${taskId}/bids`, params);
  }

  /**
   * Accept a bid
   */
  async acceptBid(id: string): Promise<ApiResponse<Bid>> {
    return this.customPut(`/${id}/accept`);
  }

  /**
   * Reject a bid
   */
  async rejectBid(id: string, reason?: string): Promise<ApiResponse<Bid>> {
    return this.customPut(`/${id}/reject`, { reason });
  }

  /**
   * Withdraw a bid
   */
  async withdrawBid(id: string): Promise<ApiResponse<Bid>> {
    return this.customPut(`/${id}/withdraw`);
  }

  /**
   * Get bid statistics for a task
   */
  async getBidStatistics(taskId: string): Promise<ApiResponse<TaskBidStatistics>> {
    return this.customGet(`/tasks/${taskId}/bid-statistics`);
  }
}

// Create singleton instance
export const bidService = new BidService();

// Export individual methods for backward compatibility and tree shaking
export const createBid = (bidData: CreateBidRequest) => bidService.create(bidData);
export const updateBid = (id: string, bidData: UpdateBidRequest) => bidService.update(id, bidData);
export const getBidById = (id: string) => bidService.getById(id);
export const getBidsByTask = (taskId: string, params?: BidSearchParams) => bidService.getBidsByTask(taskId, params);
export const getMyBids = (params?: BidSearchParams) => bidService.getMy(params);
export const getUserBids = (userId: string, params?: BidSearchParams) => bidService.getByUserId(userId, params);
export const acceptBid = (id: string) => bidService.acceptBid(id);
export const rejectBid = (id: string, reason?: string) => bidService.rejectBid(id, reason);
export const withdrawBid = (id: string) => bidService.withdrawBid(id);
export const getBidStatistics = (taskId: string) => bidService.getBidStatistics(taskId);
