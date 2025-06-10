/**
 * Bid Service
 *
 * This module provides a comprehensive implementation of all bid-related functionality.
 */

import { BidStatus, TaskStatus } from '../../../shared/types/enums';
import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';

/**
 * Error class for bid-specific errors
 */
export class BidError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BidError';
  }
}

/**
 * Bid Service class that provides all bid-related functionality
 */
export class BidService {
  /**
   * Create a new bid for a task
   */
  async createBid(bidData: any): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Validate task exists and is open for bidding
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      bidData.taskId,
      'Task',
      { id: true, status: true, ownerId: true }
    );

    if ((task as any).status !== TaskStatus.OPEN) {
      throw new ValidationError('Task is not open for bidding');
    }

    if ((task as any).ownerId === bidData.userId) {
      throw new ValidationError('You cannot bid on your own task');
    }

    // Check if user already has a bid for this task
    const existingBidExists = await DatabaseQueryBuilder.exists(
      models.bid,
      {
        taskId: bidData.taskId,
        bidderId: bidData.userId,
        status: {
          notIn: [BidStatus.WITHDRAWN, BidStatus.REJECTED]
        }
      },
      'Bid'
    );

    if (existingBidExists) {
      throw new ValidationError('You already have an active bid for this task');
    }

    // Create the bid
    const bid = await DatabaseQueryBuilder.create(
      models.bid,
      {
        amount: bidData.amount,
        message: bidData.message,
        status: BidStatus.PENDING,
        estimatedCompletionTime: bidData.estimatedCompletionTime,
        description: bidData.message ?? '',
        timeline: bidData.estimatedCompletionTime,
        taskId: bidData.taskId,
        bidderId: bidData.userId
      },
      'Bid',
      {
        id: true,
        amount: true,
        message: true,
        status: true,
        estimatedCompletionTime: true,
        taskId: true,
        bidderId: true,
        submittedAt: true
      }
    );

    logger.info('Bid created', { bidId: (bid as any).id, taskId: (bid as any).taskId, userId: (bid as any).bidderId });
    return bid;
  }

  /**
   * Get a bid by its ID
   */
  async getBidById(bidId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    return await DatabaseQueryBuilder.findById(
      models.bid,
      bidId,
      'Bid',
      {
        id: true,
        amount: true,
        message: true,
        status: true,
        estimatedCompletionTime: true,
        submittedAt: true,
        bidder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            averageRating: true,
            profileImage: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            ownerId: true
          }
        }
      }
    );
  }

  /**
   * Get all bids for a specific task
   */
  async getBidsForTask(taskId: string): Promise<any[]> {
    // DatabaseQueryBuilder is now imported at the top

    const { items } = await DatabaseQueryBuilder.findMany(
      models.bid,
      {
        where: { taskId },
        select: {
          id: true,
          amount: true,
          message: true,
          status: true,
          estimatedCompletionTime: true,
          submittedAt: true,
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              averageRating: true,
              profileImage: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      },
      'Bid'
    );

    return items;
  }

  /**
   * Get all bids made by a specific user
   */
  async getBidsForUser(userId: string): Promise<any[]> {
    // DatabaseQueryBuilder is now imported at the top

    const { items: bids } = await DatabaseQueryBuilder.findMany(
      models.bid,
      {
        where: { bidderId: userId },
        select: {
          id: true,
          amount: true,
          message: true,
          status: true,
          submittedAt: true,
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              ownerId: true,
              description: true,
              budget: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      },
      'Bid'
    );

    return bids;
  }

  /**
   * Update a bid
   */
  async updateBid(bidId: string, updateData: any): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Get the current bid
    const bid = await DatabaseQueryBuilder.findById(
      models.bid,
      bidId,
      'Bid',
      {
        id: true,
        amount: true,
        message: true,
        estimatedCompletionTime: true,
        status: true
      }
    );

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    // Check if bid can be updated
    if ((bid as any).status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be updated');
    }

    // Update the bid
    const updatedBid = await DatabaseQueryBuilder.update(
      models.bid,
      bidId,
      {
        amount: updateData.amount ?? (bid as any).amount,
        message: updateData.message ?? (bid as any).message,
        estimatedCompletionTime: updateData.estimatedCompletionTime ?? (bid as any).estimatedCompletionTime
      },
      'Bid'
    );

    logger.info('Bid updated', { bidId });
    return updatedBid;
  }

  /**
   * Accept a bid for a task
   */
  async acceptBid(bidId: string, taskId: string, userId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Get the task and verify ownership
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true, status: true }
    );

    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can accept bids');
    }

    if ((task as any).status !== TaskStatus.OPEN) {
      throw new ValidationError('Task is not open for bidding');
    }

    // Get the bid
    const bid = await DatabaseQueryBuilder.findById(
      models.bid,
      bidId,
      'Bid',
      { id: true, taskId: true, status: true, bidderId: true }
    );

    if ((bid as any).taskId !== taskId) {
      throw new ValidationError('Bid is not for this task');
    }

    if ((bid as any).status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be accepted');
    }

    // Update the accepted bid
    const updatedBid = await DatabaseQueryBuilder.update(
      models.bid,
      bidId,
      { status: BidStatus.ACCEPTED },
      'Bid'
    );

    // Update all other bids to rejected
    await DatabaseQueryBuilder.updateMany(
      models.bid,
      {
        taskId,
        id: { not: bidId },
        status: BidStatus.PENDING
      },
      { status: BidStatus.REJECTED },
      'Bid'
    );

    // Update the task status and assign to the bidder
    await DatabaseQueryBuilder.update(
      models.task,
      taskId,
      {
        status: TaskStatus.IN_PROGRESS,
        assigneeId: (bid as any).bidderId
      },
      'Task'
    );

    logger.info('Bid accepted', { bidId, taskId, userId: (bid as any).bidderId });
    return updatedBid;
  }

  /**
   * Reject a bid for a task
   */
  async rejectBid(bidId: string, taskId: string, userId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Get the task and verify ownership
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true, ownerId: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if ((task as any).ownerId !== userId) {
      throw new AuthorizationError('Only the task owner can reject bids');
    }

    // Get the bid
    const bid = await DatabaseQueryBuilder.findById(
      models.bid,
      bidId,
      'Bid',
      { id: true, taskId: true, status: true }
    );

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if ((bid as any).taskId !== taskId) {
      throw new ValidationError('Bid is not for this task');
    }

    if ((bid as any).status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be rejected');
    }

    // Update the bid
    const updatedBid = await DatabaseQueryBuilder.update(
      models.bid,
      bidId,
      { status: BidStatus.REJECTED },
      'Bid'
    );

    logger.info('Bid rejected', { bidId, taskId });
    return updatedBid;
  }

  /**
   * Withdraw a bid
   */
  async withdrawBid(bidId: string, userId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Get the bid
    const bid = await DatabaseQueryBuilder.findById(
      models.bid,
      bidId,
      'Bid',
      { id: true, bidderId: true, status: true }
    );

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if ((bid as any).bidderId !== userId) {
      throw new AuthorizationError('Only the bid owner can withdraw the bid');
    }

    if ((bid as any).status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be withdrawn');
    }

    // Update the bid
    const updatedBid = await DatabaseQueryBuilder.update(
      models.bid,
      bidId,
      { status: BidStatus.WITHDRAWN },
      'Bid'
    );

    logger.info('Bid withdrawn', { bidId, userId });
    return updatedBid;
  }

  /**
   * Search for bids based on criteria
   */
  async searchBids(criteria: any): Promise<any[]> {
    const { taskId, userId, status, page = 1, limit = 10 } = criteria;

    // Build the where clause based on provided criteria
    const where: any = {};

    if (taskId) where.taskId = taskId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // DatabaseQueryBuilder is now imported at the top

    // Execute the query with pagination
    const { items: bids } = await DatabaseQueryBuilder.findMany(
      models.bid,
      {
        where,
        select: {
          id: true,
          taskId: true,
          userId: true,
          amount: true,
          message: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              averageRating: true,
              profileImage: true
            }
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              description: true,
              budget: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        pagination: { page, skip: (page - 1) * limit, limit }
      },
      'Bid'
    );

    return bids;
  }

  /**
   * Get bid statistics for a task
   */
  async getBidStatistics(taskId: string): Promise<any> {
    // DatabaseQueryBuilder is now imported at the top

    // Verify task exists
    const task = await DatabaseQueryBuilder.findById(
      models.task,
      taskId,
      'Task',
      { id: true }
    );

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Get all bids for the task
    const { items: bids } = await DatabaseQueryBuilder.findMany(
      models.bid,
      {
        where: { taskId },
        select: {
          amount: true,
          status: true
        }
      },
      'Bid'
    );

    if (bids.length === 0) {
      return {
        taskId,
        bidCount: 0,
        averageBid: 0,
        minBid: 0,
        maxBid: 0,
        pendingBids: 0,
        acceptedBids: 0,
        rejectedBids: 0,
        withdrawnBids: 0
      };
    }

    // Calculate statistics
    const amounts = bids.map(bid => (bid as any).amount);
    const averageBid = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const minBid = Math.min(...amounts);
    const maxBid = Math.max(...amounts);

    // Count by status
    const statusCounts = bids.reduce((counts: Record<string, number>, bid) => {
      counts[(bid as any).status] = (counts[(bid as any).status] ?? 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      taskId,
      bidCount: bids.length,
      averageBid: Math.round(averageBid * 100) / 100, // Round to 2 decimal places
      minBid,
      maxBid,
      pendingBids: (statusCounts as Record<string, number>)[BidStatus.PENDING] ?? 0,
      acceptedBids: (statusCounts as Record<string, number>)[BidStatus.ACCEPTED] ?? 0,
      rejectedBids: (statusCounts as Record<string, number>)[BidStatus.REJECTED] ?? 0,
      withdrawnBids: (statusCounts as Record<string, number>)[BidStatus.WITHDRAWN] ?? 0
    };
  }
}

// Export singleton instance for use throughout the application
export const bidService = new BidService();
