/**
 * Bid Service
 * 
 * This service provides business logic for bid-related operations.
 * It uses caching to improve performance for frequently accessed data.
 */

import { PrismaClient } from '@prisma/client';
import { cacheService, CachePrefix } from '../utils/cache';
import { logger } from '../utils/logger';
import { BidStatus, TaskStatus } from '../../../shared/types/enums';
import { ErrorType } from '../../../shared/types/errors';
import { recordAuditEvent, AuditEventType } from '../utils/audit-trail';
import { measureDbQuery, measureCacheOperation } from '../middleware/performance-profiler';
import { validateWithZod, ValidationSchemas } from '../utils/validation-utils';
import { withTransaction } from '../utils/db-transaction';
import { isFeatureEnabled } from '../utils/feature-flags';
import { getPaginatedData } from '../utils/pagination';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  BID_DETAIL: 60 * 5,     // 5 minutes
  TASK_BIDS: 60 * 5,      // 5 minutes
  USER_BIDS: 60 * 5,      // 5 minutes
  BID_STATS: 60 * 30      // 30 minutes
};

// Types for bid operations
export interface BidData {
  taskId: string;
  bidderId: string;
  amount: number;
  description: string;
  timeline: string;
}

export interface BidUpdateData {
  amount?: number;
  description?: string;
  timeline?: string;
  status?: BidStatus;
}

export interface BidStatistics {
  totalBids: number;
  acceptedBids: number;
  rejectedBids: number;
  pendingBids: number;
  averageBidAmount: number;
}

/**
 * Custom error class for bid-related errors
 */
export class BidError extends Error {
  type: ErrorType;
  statusCode: number;

  constructor(message: string, type: ErrorType, statusCode: number) {
    super(message);
    this.name = 'BidError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Bid service for bid-related operations
 */
export class BidService {
  /**
   * Get a bid by ID with caching
   */
  public async getBidById(bidId: string): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.BID}${bidId}`;
      
      // Try to get from cache first with performance measurement
      const cachedBid = await measureCacheOperation('getBid', async () => {
        return await cacheService.get<any>(cacheKey);
      });
      
      if (cachedBid) {
        logger.debug('Cache hit for bid', { bidId });
        return cachedBid;
      }
      
      // Cache miss, fetch from database with performance measurement
      const bid = await measureDbQuery('getBidById', async () => {
        return await prisma.bid.findUnique({
          where: { id: bidId },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                ownerId: true
              }
            },
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                averageRating: true
              }
            }
          }
        });
      });
      
      if (bid) {
        // Cache the result with performance measurement
        await measureCacheOperation('setBid', async () => {
          await cacheService.set(cacheKey, bid, CACHE_TTL.BID_DETAIL);
        });
        
        logger.debug('Cached bid', { bidId });
      }
      
      return bid;
    } catch (error) {
      logger.error('Failed to get bid', { bidId, error });
      throw error;
    }
  }

  /**
   * Get all bids for a task with caching
   */
  public async getBidsForTask(taskId: string): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.TASK}${taskId}:bids`;
      
      // Try to get from cache first
      const cachedBids = await cacheService.get<any[]>(cacheKey);
      if (cachedBids) {
        logger.debug('Cache hit for task bids', { taskId });
        return cachedBids;
      }
      
      // Cache miss, fetch from database
      const bids = await prisma.bid.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              averageRating: true
            }
          }
        }
      });
      
      // Cache the result
      await cacheService.set(cacheKey, bids, CACHE_TTL.TASK_BIDS);
      logger.debug('Cached task bids', { taskId, count: bids.length });
      
      return bids;
    } catch (error) {
      logger.error('Failed to get bids for task', { taskId, error });
      throw error;
    }
  }

  /**
   * Get all bids for a task with pagination
   */
  public async getTaskBidsWithPagination(params: {
    taskId: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }): Promise<any> {
    const { taskId, page, limit, sortBy = 'submittedAt', sortDir = 'desc' } = params;
    
    try {
      // Use centralized pagination utility for consistent handling
      return await measureDbQuery('getTaskBidsPaginated', async () => {
        return await getPaginatedData('bid', {
          page,
          limit,
          where: { taskId },
          orderBy: { [sortBy]: sortDir.toLowerCase() },
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                averageRating: true
              }
            }
          }
        });
      });
    } catch (error) {
      logger.error('Failed to get task bids with pagination', { taskId, error });
      throw new BidError(
        'Failed to get task bids',
        ErrorType.SERVER,
        500
      );
    }
  }

  /**
   * Get all bids by a user with caching
   */
  public async getBidsByUser(userId: string): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:bids`;
      
      // Try to get from cache first
      const cachedBids = await cacheService.get<any[]>(cacheKey);
      if (cachedBids) {
        logger.debug('Cache hit for user bids', { userId });
        return cachedBids;
      }
      
      // Cache miss, fetch from database
      const bids = await prisma.bid.findMany({
        where: { bidderId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              budget: true,
              dueDate: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });
      
      // Cache the result
      await cacheService.set(cacheKey, bids, CACHE_TTL.USER_BIDS);
      logger.debug('Cached user bids', { userId, count: bids.length });
      
      return bids;
    } catch (error) {
      logger.error('Failed to get bids by user', { userId, error });
      throw error;
    }
  }

  /**
   * Create a new bid
   */
  public async createBid(data: {
    taskId: string;
    bidderId: string;
    amount: number;
    description: string;
    timeline: string;
  }): Promise<any> {
    // Validate input data against schema
    const validationResult = validateWithZod(ValidationSchemas.Bid.create, {
      taskId: data.taskId,
      amount: data.amount,
      message: data.description,
      deliveryTime: data.timeline
    });
    
    if (!validationResult.success) {
      throw new BidError(
        'Invalid bid data',
        ErrorType.VALIDATION,
        400
      );
    }
    
    const { taskId, bidderId, amount, description, timeline } = data;
    
    try {
      // Use transaction for atomicity
      return await withTransaction(async (tx) => {
        // Check if task exists and is open for bids
        const task = await measureDbQuery('getTaskForBid', async () => {
          return await tx.task.findUnique({
            where: { id: taskId }
          });
        });
        
        if (!task) {
          throw new BidError(
            'Task not found',
            ErrorType.NOT_FOUND,
            404
          );
        }
        
        if (task.status !== TaskStatus.OPEN) {
          throw new BidError(
            'Task is not open for bids',
            ErrorType.VALIDATION,
            400
          );
        }
        
        if (task.ownerId === bidderId) {
          throw new BidError(
            'You cannot bid on your own task',
            ErrorType.VALIDATION,
            400
          );
        }
        
        // Check if user has already bid on this task
        const existingBid = await measureDbQuery('checkExistingBid', async () => {
          return await tx.bid.findFirst({
            where: {
              taskId,
              bidderId,
              status: {
                in: [BidStatus.PENDING, BidStatus.ACCEPTED]
              }
            }
          });
        });
        
        if (existingBid) {
          throw new BidError(
            'You have already placed a bid on this task',
            ErrorType.CONFLICT,
            409
          );
        }
        
        // Check if bid autoapproval feature is enabled
        const featureEnabled = await isFeatureEnabled('autoApproveBids');
        const shouldAutoApprove = featureEnabled && 
          amount <= (task.budget ?? 0) * 0.9; // Auto-approve if bid is at least 10% below budget
        
        // Create the new bid
        const newBid = await measureDbQuery('createBid', async () => {
          return await tx.bid.create({
            data: {
              taskId,
              bidderId,
              amount,
              description,
              timeline,
              status: shouldAutoApprove ? BidStatus.ACCEPTED : BidStatus.PENDING
            },
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  ownerId: true
                }
              },
              bidder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  averageRating: true
                }
              }
            }
          });
        });
        
        // Record the event in the audit trail
        await recordAuditEvent({
          action: AuditEventType.CREATE,
          entityId: newBid.id,
          entityType: 'bid',
          userId: bidderId,
          metadata: {
            taskId,
            amount,
            status: newBid.status,
            autoApproved: shouldAutoApprove
          }
        });
        
        // Clear related caches
        await measureCacheOperation('clearBidCaches', async () => {
          await cacheService.deletePattern(`${CachePrefix.TASK}${taskId}:bids*`);
          await cacheService.deletePattern(`${CachePrefix.USER}${bidderId}:bids*`);
          await cacheService.deletePattern(`${CachePrefix.BID}stats*`);
        });
        
        return newBid;
      });
    } catch (error) {
      if (error instanceof BidError) {
        throw error;
      }
      
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create bid', { error: err });
      throw new BidError(
        'Failed to create bid',
        ErrorType.SERVER,
        500
      );
    }
  }

  /**
   * Update a bid
   */
  public async updateBid(bidId: string, updates: BidUpdateData, userId: string): Promise<any> {
    try {
      // Get existing bid for validation
      const existingBid = await this.getBidById(bidId);
      
      if (!existingBid) {
        throw new BidError('Bid not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Only the bidder can update their own bid
      if (existingBid.bidderId !== userId) {
        throw new BidError('Not authorized to update this bid', ErrorType.AUTHORIZATION, 403);
      }
      
      // Can only update if bid is still pending
      if (existingBid.status !== BidStatus.PENDING) {
        throw new BidError('Cannot update bid that is not pending', ErrorType.VALIDATION, 400);
      }
      
      // Update bid in database
      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: updates,
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              averageRating: true
            }
          }
        }
      });
      
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bidId}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${existingBid.taskId}:bids`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingBid.bidderId}:bids`);
      
      return updatedBid;
    } catch (error) {
      if (error instanceof BidError) {
        throw error;
      }
      logger.error('Failed to update bid', { bidId, updates, error });
      throw error;
    }
  }

  /**
   * Accept a bid and assign the task
   */
  public async acceptBid(bidId: string, userId: string): Promise<any> {
    try {
      // Get existing bid for validation
      const existingBid = await this.getBidById(bidId);
      
      if (!existingBid) {
        throw new BidError('Bid not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Only the task owner can accept a bid
      if (existingBid.task.ownerId !== userId) {
        throw new BidError('Not authorized to accept this bid', ErrorType.AUTHORIZATION, 403);
      }
      
      // Task must be open
      if (existingBid.task.status !== TaskStatus.OPEN) {
        throw new BidError('Task is not open for bidding', ErrorType.VALIDATION, 400);
      }
      
      // Begin transaction to update bid and task
      const [updatedBid, updatedTask] = await prisma.$transaction([
        // Update bid status
        prisma.bid.update({
          where: { id: bidId },
          data: { status: BidStatus.ACCEPTED },
          include: {
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                averageRating: true
              }
            }
          }
        }),
        
        // Update task status and assignee
        prisma.task.update({
          where: { id: existingBid.taskId },
          data: {
            status: TaskStatus.IN_PROGRESS, // Using the correct enum value
            assigneeId: existingBid.bidderId
          }
        }),
        
        // Reject all other bids for this task
        prisma.bid.updateMany({
          where: {
            taskId: existingBid.taskId,
            id: { not: bidId },
            status: BidStatus.PENDING
          },
          data: {
            status: BidStatus.REJECTED
          }
        })
      ]);
      
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bidId}`);
      await cacheService.delete(`${CachePrefix.TASK}${existingBid.taskId}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${existingBid.taskId}:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingBid.bidderId}:*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingBid.task.ownerId}:*`);
      await cacheService.deletePattern(`${CachePrefix.LIST}tasks:*`);
      
      return { bid: updatedBid, task: updatedTask };
    } catch (error) {
      if (error instanceof BidError) {
        throw error;
      }
      logger.error('Failed to accept bid', { bidId, userId, error });
      throw error;
    }
  }

  /**
   * Withdraw a bid
   */
  public async withdrawBid(bidId: string, userId: string): Promise<any> {
    try {
      // Get existing bid for validation
      const existingBid = await this.getBidById(bidId);
      
      if (!existingBid) {
        throw new BidError('Bid not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Only the bidder can withdraw their own bid
      if (existingBid.bidderId !== userId) {
        throw new BidError('Not authorized to withdraw this bid', ErrorType.AUTHORIZATION, 403);
      }
      
      // Can only withdraw if bid is still pending
      if (existingBid.status !== BidStatus.PENDING) {
        throw new BidError('Cannot withdraw bid that is not pending', ErrorType.VALIDATION, 400);
      }
      
      // Update bid in database
      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.WITHDRAWN },
        include: {
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });
      
      // Invalidate related caches
      await cacheService.delete(`${CachePrefix.BID}${bidId}`);
      await cacheService.deletePattern(`${CachePrefix.TASK}${existingBid.taskId}:bids`);
      await cacheService.deletePattern(`${CachePrefix.USER}${existingBid.bidderId}:bids`);
      
      return updatedBid;
    } catch (error) {
      if (error instanceof BidError) {
        throw error;
      }
      logger.error('Failed to withdraw bid', { bidId, userId, error });
      throw error;
    }
  }

  /**
   * Get bid statistics for a user (success rate, average bid amount, etc.)
   */
  public async getUserBidStats(userId: string): Promise<BidStatistics> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:bid-stats`;
      
      // Try to get from cache first
      const cachedStats = await cacheService.get<BidStatistics>(cacheKey);
      if (cachedStats) {
        logger.debug('Cache hit for user bid stats', { userId });
        return cachedStats;
      }
      
      // Get all bids by this user
      const bids = await prisma.bid.findMany({
        where: { bidderId: userId }
      });
      
      if (bids.length === 0) {
        return {
          totalBids: 0,
          acceptedBids: 0,
          pendingBids: 0,
          rejectedBids: 0,
          averageBidAmount: 0
        };
      }
      
      // Calculate statistics
      const totalBids = bids.length;
      const acceptedBids = bids.filter((bid: any) => bid.status === BidStatus.ACCEPTED).length;
      const pendingBids = bids.filter((bid: any) => bid.status === BidStatus.PENDING).length;
      const rejectedBids = bids.filter((bid: any) => bid.status === BidStatus.REJECTED).length;
      
      // Calculate total number of completed bids (excluding pending bids)
      
      // Calculate average bid amount
      const totalAmount = bids.reduce((sum: number, bid: any) => sum + bid.amount, 0);
      const averageBidAmount = totalBids > 0 ? totalAmount / totalBids : 0;
      
      const stats = {
        totalBids,
        acceptedBids,
        pendingBids,
        rejectedBids,
        averageBidAmount
      };
      
      // Cache the result
      await cacheService.set(cacheKey, stats, CACHE_TTL.BID_STATS);
      logger.debug('Cached user bid stats', { userId });
      
      return stats;
    } catch (error) {
      logger.error('Failed to get user bid stats', { userId, error });
      throw error;
    }
  }
}

// Export singleton instance
export const bidService = new BidService();
