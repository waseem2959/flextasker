/**
 * Bid Service
 * 
 * This module provides API methods for bid management:
 * - Creating and updating bids
 * - Searching and retrieving bids
 * - Managing bid status (accept/reject/withdraw)
 */

import { apiClient } from '../client';
import { Bid } from '@/types';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';

/**
 * Bid search parameters
 */
export interface BidSearchParams {
  status?: string | string[];
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create bid request
 */
export interface CreateBidRequest {
  taskId: string;
  amount: number;
  message: string;
  estimatedCompletionDays?: number;
  attachments?: string[];
}

/**
 * Update bid request
 */
export interface UpdateBidRequest {
  amount?: number;
  message?: string;
  estimatedCompletionDays?: number;
  attachments?: string[];
}

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
 * Create a new bid for a task
 * 
 * @param bidData - The bid data to submit
 * @returns Promise with the created bid
 */
export function createBid(bidData: CreateBidRequest): Promise<ApiResponse<Bid>> {
  return apiClient.post('/bids', bidData);
}

/**
 * Update an existing bid
 * 
 * @param id - The bid ID
 * @param bidData - The updated bid data
 * @returns Promise with the updated bid
 */
export function updateBid(id: string, bidData: UpdateBidRequest): Promise<ApiResponse<Bid>> {
  return apiClient.put(`/bids/${id}`, bidData);
}

/**
 * Get a specific bid by ID
 * 
 * @param id - The bid ID
 * @returns Promise with the bid details
 */
export function getBidById(id: string): Promise<ApiResponse<Bid>> {
  return apiClient.get(`/bids/${id}`);
}

/**
 * Get all bids for a specific task
 * 
 * @param taskId - The task ID
 * @param params - Search parameters for filtering bids
 * @returns Promise with array of bids and pagination info
 */
export function getBidsByTask(
  taskId: string, 
  params?: BidSearchParams
): Promise<PaginatedApiResponse<Bid>> {
  return apiClient.get(`/tasks/${taskId}/bids`, params) as Promise<PaginatedApiResponse<Bid>>;
}

/**
 * Get bids submitted by the current user
 * 
 * @param params - Search parameters
 * @returns Promise with array of bids and pagination info
 */
export function getMyBids(params?: BidSearchParams): Promise<PaginatedApiResponse<Bid>> {
  return apiClient.get('/bids/my-bids', params) as Promise<PaginatedApiResponse<Bid>>;
}

/**
 * Accept a bid
 * 
 * @param id - The bid ID
 * @returns Promise with the updated bid
 */
export function acceptBid(id: string): Promise<ApiResponse<Bid>> {
  return apiClient.put(`/bids/${id}/accept`);
}

/**
 * Reject a bid
 * 
 * @param id - The bid ID
 * @param reason - Optional rejection reason
 * @returns Promise with the updated bid
 */
export function rejectBid(id: string, reason?: string): Promise<ApiResponse<Bid>> {
  return apiClient.put(`/bids/${id}/reject`, { reason });
}

/**
 * Withdraw a bid
 * 
 * @param id - The bid ID
 * @returns Promise with the updated bid
 */
export function withdrawBid(id: string): Promise<ApiResponse<Bid>> {
  return apiClient.put(`/bids/${id}/withdraw`);
}

/**
 * Get bid statistics for a task
 * 
 * @param taskId - The task ID
 * @returns Promise with bid statistics
 */
export function getBidStatistics(taskId: string): Promise<ApiResponse<TaskBidStatistics>> {
  return apiClient.get(`/tasks/${taskId}/bid-statistics`);
}

// Export all functions as a service object for convenience
export const bidService = {
  createBid,
  updateBid,
  getBidById,
  getBidsByTask,
  getMyBids,
  acceptBid,
  rejectBid,
  withdrawBid,
  getBidStatistics
};

// Default export for convenience
export default bidService;
