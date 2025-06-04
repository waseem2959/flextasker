/**
 * Bid Hooks
 * 
 * These hooks provide a strongly-typed interface for bid operations
 * with proper error handling, type safety, and efficient caching using React Query.
 */

import { bidService } from '@/services/api';
import { BidSearchParams, BidStatus, CreateBidRequest, UpdateBidRequest } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for fetching a specific bid by ID
 */
export function useBid(id: string) {
  return useQuery({
    queryKey: ['bid', id],
    queryFn: () => bidService.getBidById(id),
    enabled: !!id,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching bids for a specific task
 */
export function useTaskBids(taskId: string) {
  return useQuery({
    queryKey: ['taskBids', taskId],
    queryFn: () => bidService.getBidsByTask(taskId),
    enabled: !!taskId,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching bid statistics for a task
 */
export function useTaskBidStatistics(taskId: string) {
  return useQuery({
    queryKey: ['bidStats', taskId],
    queryFn: () => bidService.getBidStatistics(taskId),
    enabled: !!taskId,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching bids submitted by the current user
 */
export function useMyBids(params?: { status?: BidStatus, page?: number, limit?: number }) {
  return useQuery({
    queryKey: ['myBids', params],
    queryFn: () => bidService.getMyBids(params),
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for searching bids with filters
 * Uses getMyBids under the hood since searchBids doesn't exist in the service
 */
export function useSearchBids(params?: BidSearchParams) {
  return useQuery({
    queryKey: ['bids', params],
    queryFn: () => bidService.getMyBids(params || {}),
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new bid
 */
export function useCreateBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBidRequest) => bidService.createBid(data),
    onSuccess: (response) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      
      // If we know the task ID, also invalidate task bids
      if (response.data?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: ['taskBids', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['bidStats', response.data.taskId] 
        });
      }
    }
  });
}

/**
 * Interface for update bid parameters
 */
export interface UpdateBidParams {
  id: string;
  updates: UpdateBidRequest;
}

/**
 * Hook for updating an existing bid
 */
export function useUpdateBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: UpdateBidParams) => bidService.updateBid(id, updates),
    onSuccess: (response, variables) => {
      // Invalidate specific bid
      queryClient.invalidateQueries({ queryKey: ['bid', variables.id] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      
      // If we know the task ID, also invalidate task bids
      if (response.data?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: ['taskBids', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['bidStats', response.data.taskId] 
        });
      }
    }
  });
}

/**
 * Hook for accepting a bid
 */
export function useAcceptBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bidId: string) => bidService.acceptBid(bidId),
    onSuccess: (response, bidId) => {
      // Invalidate specific bid
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      
      // If we know the task ID, also invalidate task bids and task data
      if (response.data?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: ['taskBids', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['bidStats', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['task', response.data.taskId] 
        });
      }
    }
  });
}

/**
 * Hook for rejecting a bid
 */
export function useRejectBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bidId: string) => bidService.rejectBid(bidId),
    onSuccess: (response, bidId) => {
      // Invalidate specific bid
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      
      // If we know the task ID, also invalidate task bids
      if (response.data?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: ['taskBids', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['bidStats', response.data.taskId] 
        });
      }
    }
  });
}

/**
 * Hook for withdrawing a bid
 */
export function useWithdrawBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bidId: string) => bidService.withdrawBid(bidId),
    onSuccess: (response, bidId) => {
      // Invalidate specific bid
      queryClient.invalidateQueries({ queryKey: ['bid', bidId] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      
      // If we know the task ID, also invalidate task bids
      if (response.data?.taskId) {
        queryClient.invalidateQueries({ 
          queryKey: ['taskBids', response.data.taskId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['bidStats', response.data.taskId] 
        });
      }
    }
  });
}
