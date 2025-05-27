/**
 * Enhanced Bid API Service
 * 
 * This service handles all API requests related to bids, including
 * creating, updating, accepting, and rejecting bids. It uses the centralized
 * API client for making HTTP requests. Implements TypeScript improvements for
 * better type safety and error handling.
 */

import { apiClient } from './base-client';
import { Bid } from '@/types';
import {
  ApiResponse,
  PaginatedApiResponse,
  BidSearchParams,
  CreateBidRequest,
  UpdateBidRequest
} from '@/types/api';

// Note: BidSearchParams, CreateBidRequest, and UpdateBidRequest types
// are now imported from the centralized @/types/api module

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
 * Enhanced Bid API Service Class
 * Provides methods for interacting with bid-related endpoints
 * with improved TypeScript patterns and error handling
 */
class BidService {
  private readonly baseUrl = '/api/v1/bids';

  /**
   * Create a new bid for a task
   * 
   * @param bidData - The bid data to submit
   * @returns Promise with the created bid
   */
  async createBid(bidData: CreateBidRequest): Promise<ApiResponse<Bid>> {
    const response = await apiClient.post(this.baseUrl, bidData);
    return response.data;
  }

  /**
   * Get a specific bid by ID
   * 
   * @param id - The bid ID
   * @returns Promise with the bid details
   */
  async getBidById(id: string): Promise<ApiResponse<Bid>> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Update an existing bid
   * 
   * @param id - The bid ID to update
   * @param bidData - The data to update
   * @returns Promise with the updated bid
   */
  async updateBid(id: string, bidData: UpdateBidRequest): Promise<ApiResponse<Bid>> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, bidData);
    return response.data;
  }

  /**
   * Accept a bid for a task
   * 
   * @param id - The bid ID to accept
   * @returns Promise with the accepted bid and task update info
   */
  async acceptBid(id: string): Promise<ApiResponse<{bid: Bid, task: any}>> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/accept`);
    return response.data;
  }

  /**
   * Reject a bid for a task
   * 
   * @param id - The bid ID to reject
   * @returns Promise with success message
   */
  async rejectBid(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/reject`);
    return response.data;
  }

  /**
   * Withdraw a bid
   * 
   * @param id - The bid ID to withdraw
   * @returns Promise with success message
   */
  async withdrawBid(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/withdraw`);
    return response.data;
  }

  /**
   * Search for bids with optional filtering
   * Returns paginated results with enhanced type safety
   * 
   * @param params - The search parameters
   * @returns Promise with the paginated matching bids
   */
  async searchBids(params?: BidSearchParams): Promise<PaginatedApiResponse<Bid>> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Get bid statistics for a task
   * 
   * @param taskId - The task ID to get statistics for
   * @returns Promise with the bid statistics
   */
  async getTaskBidStatistics(taskId: string): Promise<ApiResponse<TaskBidStatistics>> {
    const response = await apiClient.get(`${this.baseUrl}/tasks/${taskId}/statistics`);
    return response.data;
  }
  
  /**
   * Get summary bid statistics for a task
   * Simplified version with only count and averages
   * 
   * @param taskId - Task ID
   * @returns Promise with bid statistics
   */
  async getTaskBidSummary(taskId: string): Promise<ApiResponse<{
    count: number;
    lowestBid?: number;
    highestBid?: number;
    averageBid?: number;
  }>> {
    const response = await apiClient.get(`${this.baseUrl}/tasks/${taskId}/summary`);
    return response.data;
  }

  /**
   * Get bids submitted by the current user
   * 
   * @param params - Optional filtering parameters
   * @returns Promise with bids and pagination info
   */
  async getMyBids(params?: BidSearchParams): Promise<PaginatedApiResponse<Bid>> {
    const response = await apiClient.get(`${this.baseUrl}/my`, { params });
    return response.data;
  }
}

// Export a singleton instance
export const bidService = new BidService();
