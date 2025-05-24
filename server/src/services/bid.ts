import { db } from '@/utils/database';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';

/**
 * Bid service - this is like the auction house of our platform where taskers
 * make proposals for work and task owners can evaluate and choose the best offers.
 * 
 * Think of this as managing a sophisticated bidding process that ensures fair
 * competition, prevents abuse, and handles all the business logic around
 * proposal evaluation and acceptance.
 */

export interface CreateBidData {
  taskId: string;
  amount: number;
  description: string;
  timeline: string;
}

export interface UpdateBidData {
  amount?: number;
  description?: string;
  timeline?: string;
}

export interface BidSearchFilters {
  taskId?: string;
  bidderId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  minAmount?: number;
  maxAmount?: number;
  submittedAfter?: Date;
  submittedBefore?: Date;
}

// Define proper types for database entities
interface TaskWithOwner {
  id: string;
  title: string;
  budget: number;
  budgetType: string;
  status: string;
  ownerId: string;
  assigneeId: string | null;
  deadline: Date | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    trustScore: number;
  };
}

interface BidderUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  assignedTasks: { id: string }[];
  reviewsReceived: { rating: number }[];
}

interface BidWithRelations {
  id: string;
  taskId: string;
  bidderId: string;
  amount: number;
  description: string;
  timeline: string;
  status: string;
  submittedAt: Date;
  respondedAt: Date | null;
  task: TaskWithOwner;
  bidder: BidderUser;
}

export interface BidSearchResult {
  bids: Array<{
    id: string;
    amount: number;
    description: string;
    timeline: string;
    status: string;
    submittedAt: Date;
    respondedAt?: Date;
    task: {
      id: string;
      title: string;
      budget: number;
      budgetType: string;
      status: string;
      owner: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
        trustScore: number;
      };
    };
    bidder: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      trustScore: number;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }>;
  pagination: PaginationInfo;
}

export class BidService {

  /**
   * Create a new bid - like submitting a proposal for a job
   * 
   * This process involves validating the bid amount, checking that the task
   * is still open for bidding, ensuring the bidder isn't the task owner,
   * and preventing duplicate bids from the same user.
   */
  async createBid(bidderId: string, bidData: CreateBidData): Promise<BidWithRelations> {
    try {
      // First, get the task and validate it's available for bidding
      const task = await db.task.findUnique({
        where: { id: bidData.taskId },
        select: {
          id: true,
          title: true,
          budget: true,
          budgetType: true,
          status: true,
          ownerId: true,
          deadline: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Validate task is open for bidding
      if (task.status !== 'OPEN') {
        throw new ConflictError('This task is no longer accepting bids');
      }

      // Check if deadline has passed
      if (task.deadline && task.deadline < new Date()) {
        throw new ConflictError('The bidding deadline for this task has passed');
      }

      // Prevent task owner from bidding on their own task
      if (task.ownerId === bidderId) {
        throw new ConflictError('You cannot bid on your own task');
      }

      // Check if user has already bid on this task
      const existingBid = await db.bid.findUnique({
        where: {
          taskId_bidderId: {
            taskId: bidData.taskId,
            bidderId: bidderId,
          },
        },
      });

      if (existingBid) {
        throw new ConflictError('You have already submitted a bid for this task');
      }

      // Validate bid amount
      if (bidData.amount <= 0) {
        throw new ValidationError('Bid amount must be greater than zero');
      }

      // For fixed-price tasks, warn if bid is significantly higher than budget
      if (task.budgetType === 'FIXED' && bidData.amount > task.budget * 1.5) {
        logger.warn('Bid amount significantly exceeds task budget:', {
          taskId: task.id,
          taskBudget: task.budget,
          bidAmount: bidData.amount,
          bidderId,
        });
      }

      // Create the bid
      const newBid = await db.bid.create({
        data: {
          taskId: bidData.taskId,
          bidderId: bidderId,
          amount: bidData.amount,
          description: bidData.description,
          timeline: bidData.timeline,
          status: 'PENDING',
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              budget: true,
              budgetType: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  trustScore: true,
                },
              },
            },
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
              phoneVerified: true,
            },
          },
        },
      });

      // Send notification to task owner about new bid
      // This would be handled by a notification service

      logger.info('New bid created:', {
        bidId: newBid.id,
        taskId: task.id,
        bidderId,
        amount: bidData.amount,
      });

      return newBid as BidWithRelations;

    } catch (error) {
      logger.error('Failed to create bid:', error);
      throw error;
    }
  }

  /**
   * Get bid by ID with full details
   * 
   * This method retrieves comprehensive bid information including task details,
   * bidder information, and current status. Access is restricted based on
   * the relationship between the requesting user and the bid.
   */
  async getBidById(bidId: string, currentUserId: string): Promise<BidWithRelations> {
    try {
      const bid = await db.bid.findUnique({
        where: { id: bidId },
        include: {
          task: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  trustScore: true,
                  emailVerified: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
              trustScore: true,
              emailVerified: true,
              phoneVerified: true,
              // Include portfolio/stats for evaluation
              assignedTasks: {
                where: { status: 'COMPLETED' },
                select: { id: true },
              },
              reviewsReceived: {
                select: { rating: true },
              },
            },
          },
        },
      });

      if (!bid) {
        throw new NotFoundError('Bid not found');
      }

      // Check if user has permission to view this bid
      const isTaskOwner = bid.task.ownerId === currentUserId;
      const isBidder = bid.bidderId === currentUserId;

      if (!isTaskOwner && !isBidder) {
        throw new AuthorizationError('You do not have permission to view this bid');
      }

      // Calculate bidder statistics
      const ratings = bid.bidder.reviewsReceived.map((r: { rating: number }) => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      const completedTasksCount = bid.bidder.assignedTasks.length;

      // Add calculated fields to bidder info
      const enrichedBid = {
        ...bid,
        bidder: {
          ...bid.bidder,
          averageRating: Math.round(averageRating * 10) / 10,
          totalCompletedTasks: completedTasksCount,
          totalReviews: ratings.length,
        },
        permissions: {
          canUpdate: isBidder && bid.status === 'PENDING',
          canWithdraw: isBidder && bid.status === 'PENDING',
          canAccept: isTaskOwner && bid.status === 'PENDING' && bid.task.status === 'OPEN',
          canReject: isTaskOwner && bid.status === 'PENDING',
        },
      };

      logger.info('Bid retrieved:', {
        bidId,
        viewedBy: currentUserId,
        isTaskOwner,
        isBidder,
      });

      return enrichedBid as BidWithRelations;

    } catch (error) {
      logger.error('Failed to get bid:', error);
      throw error;
    }
  }

  /**
   * Update an existing bid - like revising a proposal
   * 
   * Bidders can modify their proposals as long as the bid is still pending
   * and the task is still open for bidding.
   */
  async updateBid(bidId: string, bidderId: string, updateData: UpdateBidData): Promise<BidWithRelations> {
    try {
      // Get the existing bid and validate permissions
      const existingBid = await db.bid.findUnique({
        where: { id: bidId },
        include: {
          task: {
            select: {
              id: true,
              status: true,
              deadline: true,
            },
          },
        },
      });

      if (!existingBid) {
        throw new NotFoundError('Bid not found');
      }

      if (existingBid.bidderId !== bidderId) {
        throw new AuthorizationError('You can only update your own bids');
      }

      if (existingBid.status !== 'PENDING') {
        throw new ConflictError('Only pending bids can be updated');
      }

      if (existingBid.task.status !== 'OPEN') {
        throw new ConflictError('Cannot update bid - task is no longer open');
      }

      // Check if deadline has passed
      if (existingBid.task.deadline && existingBid.task.deadline < new Date()) {
        throw new ConflictError('Cannot update bid - deadline has passed');
      }

      // Validate new amount if provided
      if (updateData.amount !== undefined && updateData.amount <= 0) {
        throw new ValidationError('Bid amount must be greater than zero');
      }

      // Update the bid
      const updatedBid = await db.bid.update({
        where: { id: bidId },
        data: updateData,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              budget: true,
              budgetType: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  trustScore: true,
                },
              },
            },
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
              phoneVerified: true,
            },
          },
        },
      });

      logger.info('Bid updated:', {
        bidId,
        bidderId,
        updatedFields: Object.keys(updateData),
      });

      return updatedBid as BidWithRelations;

    } catch (error) {
      logger.error('Failed to update bid:', error);
      throw error;
    }
  }

  /**
   * Accept a bid - like hiring someone for a job
   * 
   * This is a critical operation that:
   * 1. Changes the bid status to ACCEPTED
   * 2. Changes the task status to IN_PROGRESS
   * 3. Assigns the bidder as the task assignee
   * 4. Rejects all other pending bids for the task
   * 5. Triggers payment processing (if applicable)
   */
  async acceptBid(bidId: string, taskOwnerId: string): Promise<BidWithRelations> {
    try {
      // Start a transaction since we need to update multiple records atomically
      const result = await db.$transaction(async (prisma: typeof db) => {
        // Get the bid with task information
        const bid = await prisma.bid.findUnique({
          where: { id: bidId },
          include: {
            task: {
              select: {
                id: true,
                ownerId: true,
                status: true,
                title: true,
              },
            },
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        if (!bid) {
          throw new NotFoundError('Bid not found');
        }

        // Validate permissions and status
        if (bid.task.ownerId !== taskOwnerId) {
          throw new AuthorizationError('You can only accept bids on your own tasks');
        }

        if (bid.status !== 'PENDING') {
          throw new ConflictError('Only pending bids can be accepted');
        }

        if (bid.task.status !== 'OPEN') {
          throw new ConflictError('Task is no longer open for bidding');
        }

        // Accept the bid
        const acceptedBid = await prisma.bid.update({
          where: { id: bidId },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date(),
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                budget: true,
                budgetType: true,
              },
            },
            bidder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                trustScore: true,
              },
            },
          },
        });

        // Update the task status and assign the bidder
        await prisma.task.update({
          where: { id: bid.task.id },
          data: {
            status: 'IN_PROGRESS',
            assigneeId: bid.bidderId,
            startDate: new Date(),
          },
        });

        // Reject all other pending bids for this task
        await prisma.bid.updateMany({
          where: {
            taskId: bid.task.id,
            id: { not: bidId },
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            respondedAt: new Date(),
          },
        });

        return acceptedBid;
      });

      // Send notifications to bidder and rejected bidders
      // Initialize payment escrow if required

      logger.info('Bid accepted:', {
        bidId,
        taskId: result.task.id,
        taskOwnerId,
        assignedTo: result.bidderId,
      });

      return result as BidWithRelations;

    } catch (error) {
      logger.error('Failed to accept bid:', error);
      throw error;
    }
  }

  /**
   * Reject a bid - like declining a job application
   * 
   * Task owners can reject bids they don't want to accept. This notifies
   * the bidder and allows them to potentially submit a revised proposal.
   */
  async rejectBid(bidId: string, taskOwnerId: string): Promise<void> {
    try {
      // Get the bid and validate permissions
      const bid = await db.bid.findUnique({
        where: { id: bidId },
        include: {
          task: {
            select: {
              id: true,
              ownerId: true,
              status: true,
            },
          },
        },
      });

      if (!bid) {
        throw new NotFoundError('Bid not found');
      }

      if (bid.task.ownerId !== taskOwnerId) {
        throw new AuthorizationError('You can only reject bids on your own tasks');
      }

      if (bid.status !== 'PENDING') {
        throw new ConflictError('Only pending bids can be rejected');
      }

      // Reject the bid
      await db.bid.update({
        where: { id: bidId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      });

      logger.info('Bid rejected:', {
        bidId,
        taskId: bid.task.id,
        rejectedBy: taskOwnerId,
      });

    } catch (error) {
      logger.error('Failed to reject bid:', error);
      throw error;
    }
  }

  /**
   * Withdraw a bid - like retracting a job application
   * 
   * Bidders can withdraw their proposals if they're no longer interested
   * or available for the work. This can only be done for pending bids.
   */
  async withdrawBid(bidId: string, bidderId: string): Promise<void> {
    try {
      // Get the bid and validate permissions
      const bid = await db.bid.findUnique({
        where: { id: bidId },
        select: {
          id: true,
          bidderId: true,
          status: true,
        },
      });

      if (!bid) {
        throw new NotFoundError('Bid not found');
      }

      if (bid.bidderId !== bidderId) {
        throw new AuthorizationError('You can only withdraw your own bids');
      }

      if (bid.status !== 'PENDING') {
        throw new ConflictError('Only pending bids can be withdrawn');
      }

      // Withdraw the bid
      await db.bid.update({
        where: { id: bidId },
        data: {
          status: 'WITHDRAWN',
          respondedAt: new Date(),
        },
      });

      logger.info('Bid withdrawn:', {
        bidId,
        bidderId,
      });

    } catch (error) {
      logger.error('Failed to withdraw bid:', error);
      throw error;
    }
  }

  /**
   * Search bids with filters - like browsing proposals or applications
   * 
   * This allows both task owners and taskers to view bids with various
   * filters and sorting options.
   */
  async searchBids(
    filters: BidSearchFilters,
    currentUserId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<BidSearchResult> {
    try {
      // Build the where clause based on filters
      const whereClause: Record<string, unknown> = {};

      // Restrict to bids the user can see (their own bids or bids on their tasks)
      whereClause.OR = [
        { bidderId: currentUserId },
        { task: { ownerId: currentUserId } },
      ];

      if (filters.taskId) {
        whereClause.taskId = filters.taskId;
      }

      if (filters.bidderId) {
        whereClause.bidderId = filters.bidderId;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Amount filters
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        whereClause.amount = {};
        if (filters.minAmount !== undefined) {
          (whereClause.amount as Record<string, number>).gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          (whereClause.amount as Record<string, number>).lte = filters.maxAmount;
        }
      }

      // Date filters
      if (filters.submittedAfter || filters.submittedBefore) {
        whereClause.submittedAt = {};
        if (filters.submittedAfter) {
          (whereClause.submittedAt as Record<string, Date>).gte = filters.submittedAfter;
        }
        if (filters.submittedBefore) {
          (whereClause.submittedAt as Record<string, Date>).lte = filters.submittedBefore;
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalBids = await db.bid.count({ where: whereClause });

      // Get bids with their related data
      const bids = await db.bid.findMany({
        where: whereClause,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              budget: true,
              budgetType: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  trustScore: true,
                },
              },
            },
          },
          bidder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
              phoneVerified: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { submittedAt: 'desc' },
        ],
      });

      const pagination = createPagination(page, limit, totalBids);

      logger.info('Bid search completed:', {
        filters,
        currentUserId,
        page,
        limit,
        totalResults: totalBids,
      });

      return {
        bids,
        pagination,
      };

    } catch (error) {
      logger.error('Bid search failed:', error);
      throw error;
    }
  }

  /**
   * Get bid statistics for a task - like analyzing proposals received
   * 
   * This provides summary statistics about bids on a specific task,
   * helping task owners evaluate the market response to their posting.
   */
  async getTaskBidStatistics(taskId: string, taskOwnerId: string): Promise<Record<string, unknown>> {
    try {
      // Verify the user owns the task
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: { ownerId: true },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      if (task.ownerId !== taskOwnerId) {
        throw new AuthorizationError('You can only view statistics for your own tasks');
      }

      // Get bid statistics
      const bids = await db.bid.findMany({
        where: { taskId },
        select: {
          amount: true,
          status: true,
          submittedAt: true,
        },
      });

      if (bids.length === 0) {
        return {
          totalBids: 0,
          averageAmount: 0,
          lowestAmount: 0,
          highestAmount: 0,
          bidsByStatus: {},
          bidsOverTime: [],
        };
      }

      const amounts = bids.map((bid: { amount: number }) => Number(bid.amount));
      const averageAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length;
      const lowestAmount = Math.min(...amounts);
      const highestAmount = Math.max(...amounts);

      // Count bids by status
      const bidsByStatus = bids.reduce((acc: Record<string, number>, bid: { status: string }) => {
        acc[bid.status] = (acc[bid.status] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group bids by day for trending analysis
      const bidsOverTime = bids.reduce((acc: Record<string, number>, bid: { submittedAt: Date }) => {
        const date = bid.submittedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalBids: bids.length,
        averageAmount: Math.round(averageAmount * 100) / 100,
        lowestAmount,
        highestAmount,
        bidsByStatus,
        bidsOverTime: Object.entries(bidsOverTime).map(([date, count]) => ({
          date,
          count,
        })),
      };

    } catch (error) {
      logger.error('Failed to get bid statistics:', error);
      throw error;
    }
  }
}