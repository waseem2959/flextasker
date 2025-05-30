/**
 * Bid Service
 * 
 * This module provides a comprehensive implementation of all bid-related functionality.
 */

import { prisma } from '../utils/database-utils';
import { BidStatus, TaskStatus } from '../../../shared/types/enums';
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
    // Validate task exists and is open for bidding
    const task = await prisma.task.findUnique({
      where: { id: bidData.taskId },
      select: { id: true, status: true, userId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.status !== TaskStatus.OPEN) {
      throw new ValidationError('Task is not open for bidding');
    }

    if (task.userId === bidData.userId) {
      throw new ValidationError('You cannot bid on your own task');
    }

    // Check if user already has a bid for this task
    const existingBid = await prisma.bid.findFirst({
      where: {
        taskId: bidData.taskId,
        userId: bidData.userId,
        status: {
          notIn: [BidStatus.WITHDRAWN, BidStatus.REJECTED]
        }
      }
    });

    if (existingBid) {
      throw new ValidationError('You already have an active bid for this task');
    }

    // Create the bid
    const bid = await prisma.bid.create({
      data: {
        taskId: bidData.taskId,
        userId: bidData.userId,
        amount: bidData.amount,
        message: bidData.message,
        status: BidStatus.PENDING,
        estimatedCompletionTime: bidData.estimatedCompletionTime
      }
    });

    logger.info('Bid created', { bidId: bid.id, taskId: bid.taskId, userId: bid.userId });
    return bid;
  }

  /**
   * Get a bid by its ID
   */
  async getBidById(bidId: string): Promise<any> {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
            userId: true
          }
        }
      }
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    return bid;
  }

  /**
   * Get all bids for a specific task
   */
  async getBidsForTask(taskId: string): Promise<any[]> {
    const bids = await prisma.bid.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            averageRating: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bids;
  }

  /**
   * Get all bids made by a specific user
   */
  async getBidsForUser(userId: string): Promise<any[]> {
    const bids = await prisma.bid.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            userId: true,
            description: true,
            budget: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bids;
  }

  /**
   * Update a bid
   */
  async updateBid(bidId: string, updateData: any): Promise<any> {
    // Get the current bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { task: true }
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    // Check if bid can be updated
    if (bid.status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be updated');
    }

    // Update the bid
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: {
        amount: updateData.amount ?? bid.amount,
        message: updateData.message ?? bid.message,
        estimatedCompletionTime: updateData.estimatedCompletionTime ?? bid.estimatedCompletionTime
      }
    });

    logger.info('Bid updated', { bidId });
    return updatedBid;
  }

  /**
   * Accept a bid for a task
   */
  async acceptBid(bidId: string, taskId: string, userId: string): Promise<any> {
    // Get the task and verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, status: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can accept bids');
    }

    if (task.status !== TaskStatus.OPEN) {
      throw new ValidationError('Task is not open for bidding');
    }

    // Get the bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, taskId: true, status: true, userId: true }
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if (bid.taskId !== taskId) {
      throw new ValidationError('Bid is not for this task');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be accepted');
    }

    // Start a transaction to update bid and task
    const result = await prisma.$transaction([
      // Update the accepted bid
      prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED }
      }),
      
      // Update all other bids to rejected
      prisma.bid.updateMany({
        where: {
          taskId,
          id: { not: bidId },
          status: BidStatus.PENDING
        },
        data: { status: BidStatus.REJECTED }
      }),
      
      // Update the task status and assign to the bidder
      prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.IN_PROGRESS,
          assignedUserId: bid.userId
        }
      })
    ]);

    logger.info('Bid accepted', { bidId, taskId, userId: bid.userId });
    return result[0]; // Return the updated bid
  }

  /**
   * Reject a bid for a task
   */
  async rejectBid(bidId: string, taskId: string, userId: string): Promise<any> {
    // Get the task and verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new AuthorizationError('Only the task owner can reject bids');
    }

    // Get the bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, taskId: true, status: true }
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if (bid.taskId !== taskId) {
      throw new ValidationError('Bid is not for this task');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be rejected');
    }

    // Update the bid
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.REJECTED }
    });

    logger.info('Bid rejected', { bidId, taskId });
    return updatedBid;
  }

  /**
   * Withdraw a bid
   */
  async withdrawBid(bidId: string, userId: string): Promise<any> {
    // Get the bid
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true, userId: true, status: true }
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if (bid.userId !== userId) {
      throw new AuthorizationError('Only the bid owner can withdraw the bid');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ValidationError('Only pending bids can be withdrawn');
    }

    // Update the bid
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN }
    });

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
    
    // Execute the query with pagination
    const bids = await prisma.bid.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
      skip: (page - 1) * limit,
      take: limit
    });
    
    return bids;
  }
}

// Export singleton instance for use throughout the application
export const bidService = new BidService();
