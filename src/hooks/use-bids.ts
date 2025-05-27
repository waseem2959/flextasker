/**
 * Enhanced Bid Hooks
 * 
 * These hooks provide a strongly-typed interface for bid operations
 * with proper error handling, type safety, and efficient caching using React Query.
 * 
 * Includes both original naming convention and enhanced naming convention
 * to support gradual migration of components.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidService } from '@/services/api';
import { BidStatus } from '@/types/enums';
import { BidSearchParams, CreateBidRequest, UpdateBidRequest } from '@/types/api';

/**
 * Hook for fetching a specific bid by ID
 * 
 * @param id - The bid ID
 * @returns Query result with bid data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useBid('bid-123');
 * ```
 */
export function useBid(id: string) {
  return useQuery({
    queryKey: ['bids', 'detail', id],
    queryFn: () => bidService.getBidById(id),
    enabled: !!id // Only run query if ID is provided
  });
}

/**
 * Hook for fetching bids for a specific task
 * 
 * @param taskId - The task ID
 * @returns Query result with bids data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useTaskBids('task-123');
 * ```
 */
export function useTaskBids(taskId: string) {
  return useQuery({
    queryKey: ['bids', 'byTask', taskId],
    queryFn: () => bidService.searchBids({ taskId }),
    enabled: !!taskId // Only run query if taskId is provided
  });
}

/**
 * Hook for fetching bid statistics for a task
 * 
 * @param taskId - The task ID
 * @returns Query result with bid statistics, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useTaskBidStatistics('task-123');
 * ```
 */
export function useTaskBidStatistics(taskId: string) {
  return useQuery({
    queryKey: ['bids', 'byTask', taskId, 'statistics'],
    queryFn: () => bidService.getTaskBidStatistics(taskId),
    enabled: !!taskId // Only run query if taskId is provided
  });
}

/**
 * Hook for fetching bids submitted by the current user
 * 
 * @param params - Optional filter parameters
 * @returns Query result with bids data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useMyBids({ status: BidStatus.PENDING });
 * ```
 */
export function useMyBids(params?: { status?: BidStatus, page?: number, limit?: number }) {
  return useQuery({
    queryKey: ['bids', 'my', params],
    queryFn: () => bidService.getMyBids(params),
  });
}

/**
 * Hook for searching bids with filters
 * 
 * @param params - Search parameters
 * @returns Query result with bids data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useSearchBids({ minAmount: 1000 });
 * ```
 */
export function useSearchBids(params?: BidSearchParams) {
  return useQuery({
    queryKey: ['bids', 'list', params || {}],
    queryFn: () => bidService.searchBids(params),
    enabled: !!params // Only run query if params are provided
  });
}

/**
 * Hook for creating a new bid
 * 
 * @returns Mutation result with bid data and status
 * 
 * @example
 * ```tsx
 * const createBid = useCreateBid();
 * 
 * const handleSubmit = async (bidData) => {
 *   await createBid.mutateAsync(bidData);
 * };
 * ```
 */
export function useCreateBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bidData: CreateBidRequest) => bidService.createBid(bidData),
    onSuccess: (response) => {
      // Get the task ID from the response
      const taskId = response.data?.taskId;
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'my'] });
      
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['bids', 'byTask', taskId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] });
      }
    },
  });
}

/**
 * Hook for updating an existing bid
 * 
 * @returns Mutation result with bid data and status
 * 
 * @example
 * ```tsx
 * const updateBid = useUpdateBid();
 * 
 * const handleUpdate = async (id, updates) => {
 *   await updateBid.mutateAsync({ id, updates });
 * };
 * ```
 */
export function useUpdateBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateBidRequest }) => 
      bidService.updateBid(id, updates),
    onSuccess: (response, { id }) => {
      // Get the task ID from the response
      const taskId = response.data?.taskId;
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'my'] });
      
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['bids', 'byTask', taskId] });
      }
    },
  });
}

/**
 * Hook for accepting a bid
 * 
 * @returns Mutation result with updated bid data
 * 
 * @example
 * ```tsx
 * const acceptBid = useAcceptBid();
 * 
 * const handleAccept = async (id) => {
 *   await acceptBid.mutateAsync(id);
 * };
 * ```
 */
export function useAcceptBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => bidService.acceptBid(id),
    onSuccess: (response, id) => {
      // Get the task ID from the response
      const taskId = response.data?.bid?.taskId;
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'list'] });
      
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: ['bids', 'byTask', taskId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] });
      }
    },
  });
}

/**
 * Hook for rejecting a bid
 * 
 * @returns Mutation result with status
 * 
 * @example
 * ```tsx
 * const rejectBid = useRejectBid();
 * 
 * const handleReject = async (id) => {
 *   await rejectBid.mutateAsync(id);
 * };
 * ```
 */
export function useRejectBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => bidService.rejectBid(id),
    onSuccess: (_, id) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'list'] });
    },
  });
}

/**
 * Hook for withdrawing a bid
 * 
 * @returns Mutation result with status
 * 
 * @example
 * ```tsx
 * const withdrawBid = useWithdrawBid();
 * 
 * const handleWithdraw = async (id) => {
 *   await withdrawBid.mutateAsync(id);
 * };
 * ```
 */
export function useWithdrawBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => bidService.withdrawBid(id),
    onSuccess: (_, id) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bids', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'my'] });
    },
  });
}

/**
 * Enhanced hook aliases for gradual migration
 * 
 * These aliases allow components to use the enhanced naming convention
 * while still using the original implementations.
 */

// Enhanced bid hooks with the same functionality but new names
export const useEnhancedBid = useBid;
export const useEnhancedTaskBids = useTaskBids;
export const useEnhancedTaskBidStatistics = useTaskBidStatistics;
export const useEnhancedMyBids = useMyBids;
export const useEnhancedSearchBids = useSearchBids;
export const useCreateEnhancedBid = useCreateBid;
export const useUpdateEnhancedBid = useUpdateBid;
export const useAcceptEnhancedBid = useAcceptBid;
export const useRejectEnhancedBid = useRejectBid;
export const useWithdrawEnhancedBid = useWithdrawBid;

/**
 * Interface for update bid parameters with strong typing
 * Used by the enhanced hook naming convention
 */
export interface UpdateEnhancedBidParams {
  id: string;
  updates: UpdateBidRequest;
}
