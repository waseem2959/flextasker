import { db } from "@/utils/database";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/utils/errors";
import { logger } from "@/utils/logger";
import { createPagination, PaginationInfo } from "@/utils/response";

/**
 * Review service - this is like the reputation management department that
 * handles all feedback between users. It ensures that reviews are authentic,
 * fair, and help build trust in the platform ecosystem.
 *
 * This service has been architected with clear separation of concerns:
 * - Validation methods handle business rules
 * - Query builders construct database queries
 * - Core methods orchestrate the main business logic
 * - Utility methods handle calculations and formatting
 */

// ====================================
// CORE TYPE DEFINITIONS
// ====================================

export interface CreateReviewData {
  taskId: string;
  subjectId: string; // The person being reviewed
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
}

export interface ReviewSearchFilters {
  taskId?: string;
  authorId?: string;
  subjectId?: string;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  isVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Specific type definitions for database interactions
// These eliminate 'any' types and provide better type safety
interface TaskForReviewValidation {
  id: string;
  title: string;
  status: string;
  ownerId: string;
  assigneeId: string | null;
  completionDate: Date | null;
}

interface ReviewWithRelations {
  id: string;
  rating: number;
  title: string;
  comment: string;
  communicationRating: number | null;
  qualityRating: number | null;
  timelinessRating: number | null;
  helpfulVotes: number;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: Date;
  authorId: string;
  subjectId: string;
  taskId: string;
  task: {
    id: string;
    title: string;
    status?: string;
    budget?: number;
    completionDate?: Date | null;
  };
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    trustScore: number;
    emailVerified?: boolean;
  };
  subject: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    trustScore: number;
    emailVerified?: boolean;
  };
}

interface ReviewStatisticsData {
  rating: number;
  communicationRating: number | null;
  qualityRating: number | null;
  timelinessRating: number | null;
  createdAt: Date;
}

interface UserReviewStats {
  received: {
    total: number;
    averageRating: number;
    averageCommunication: number;
    averageQuality: number;
    averageTimeliness: number;
    ratingDistribution: Record<number, number>;
    recentTrend: "improving" | "declining" | "neutral";
  };
  given: {
    total: number;
    averageRating: number;
  };
}

// Type for Prisma where clause to avoid 'any' types
interface ReviewWhereClause {
  isPublic?: boolean;
  taskId?: string;
  authorId?: string;
  subjectId?: string;
  rating?: {
    gte?: number;
    lte?: number;
  };
  isVerified?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface ReviewSearchResult {
  reviews: ReviewWithRelations[];
  pagination: PaginationInfo;
}

export class ReviewService {
  // ====================================
  // VALIDATION METHODS
  // These methods handle business rule validation and are pure functions
  // ====================================

  /**
   * Validates that a user can leave a review for a specific task
   * This centralizes all review eligibility logic in one place
   */
  private validateReviewEligibility(
    task: TaskForReviewValidation,
    authorId: string,
    subjectId: string
  ): string {
    // Business rule: Only completed tasks can be reviewed
    if (task.status !== "COMPLETED") {
      throw new ConflictError("Reviews can only be left for completed tasks");
    }

    // Business rule: Only task participants can leave reviews
    const isTaskOwner = task.ownerId === authorId;
    const isTaskAssignee = task.assigneeId === authorId;

    if (!isTaskOwner && !isTaskAssignee) {
      throw new AuthorizationError(
        "You can only review tasks you were involved in"
      );
    }

    // Business rule: Review subject must be the other party in the transaction
    let expectedSubjectId: string;
    if (isTaskOwner) {
      if (!task.assigneeId) {
        throw new ValidationError("Task has no assigned worker to review");
      }
      expectedSubjectId = task.assigneeId;
    } else {
      expectedSubjectId = task.ownerId;
    }

    if (subjectId !== expectedSubjectId) {
      throw new ValidationError("Invalid review subject");
    }

    return expectedSubjectId;
  }

  /**
   * Validates rating values to ensure they meet business requirements
   * This method can be easily tested in isolation
   */
  private validateRatingValues(reviewData: CreateReviewData | UpdateReviewData): void {
    // Primary rating validation
    if ('rating' in reviewData && reviewData.rating !== undefined) {
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new ValidationError("Rating must be between 1 and 5");
      }
    }

    // Detailed ratings validation - extracted to reduce complexity
    const detailedRatings = [
      reviewData.communicationRating,
      reviewData.qualityRating,
      reviewData.timelinessRating,
    ];

    for (const rating of detailedRatings) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new ValidationError("All ratings must be between 1 and 5");
      }
    }
  }

  /**
   * Validates time-based constraints for review operations
   * This encapsulates all time-related business rules
   */
  private validateTimeConstraints(
    operation: 'edit' | 'delete',
    createdAt: Date,
    isAdmin: boolean = false
  ): void {
    if (isAdmin) {
      return; // Admins bypass time constraints
    }

    const now = Date.now();
    const creationTime = createdAt.getTime();
    const timeSinceCreation = now - creationTime;

    if (operation === 'edit') {
      const editWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (timeSinceCreation > editWindow) {
        throw new ConflictError("Reviews can only be edited within 7 days of creation");
      }
    } else if (operation === 'delete') {
      const deleteWindow = 24 * 60 * 60 * 1000; // 24 hours
      if (timeSinceCreation > deleteWindow) {
        throw new ConflictError("Reviews can only be deleted within 24 hours of creation");
      }
    }
  }

  // ====================================
  // QUERY BUILDER METHODS
  // These methods construct database queries and are focused on data access
  // ====================================

  /**
   * Builds the where clause for review search queries
   * This method has reduced cognitive complexity by separating concerns
   */
  private buildReviewSearchWhereClause(filters: ReviewSearchFilters): ReviewWhereClause {
    const whereClause: ReviewWhereClause = {
      isPublic: true, // Default to showing only public reviews
    };

    // Simple field filters - each is handled independently
    this.addSimpleReviewFilters(whereClause, filters);
    
    // Complex range filters - separated for clarity
    this.addRatingRangeFilter(whereClause, filters);
    this.addDateRangeFilter(whereClause, filters);

    return whereClause;
  }

  /**
   * Adds simple field-based filters to the where clause
   * These are straightforward equality checks
   */
  private addSimpleReviewFilters(whereClause: ReviewWhereClause, filters: ReviewSearchFilters): void {
    if (filters.taskId) {
      whereClause.taskId = filters.taskId;
    }

    if (filters.authorId) {
      whereClause.authorId = filters.authorId;
    }

    if (filters.subjectId) {
      whereClause.subjectId = filters.subjectId;
    }

    if (filters.isVerified !== undefined) {
      whereClause.isVerified = filters.isVerified;
    }
  }

  /**
   * Adds rating range filters to the where clause
   * This isolates the rating filter logic for better maintainability
   */
  private addRatingRangeFilter(whereClause: ReviewWhereClause, filters: ReviewSearchFilters): void {
    const hasRatingFilters = filters.minRating !== undefined || filters.maxRating !== undefined;
    
    if (hasRatingFilters) {
      whereClause.rating = {};
      
      if (filters.minRating !== undefined) {
        whereClause.rating.gte = filters.minRating;
      }
      
      if (filters.maxRating !== undefined) {
        whereClause.rating.lte = filters.maxRating;
      }
    }
  }

  /**
   * Adds date range filters to the where clause
   * This encapsulates temporal filtering logic
   */
  private addDateRangeFilter(whereClause: ReviewWhereClause, filters: ReviewSearchFilters): void {
    const hasDateFilters = filters.createdAfter || filters.createdBefore;
    
    if (hasDateFilters) {
      whereClause.createdAt = {};
      
      if (filters.createdAfter) {
        whereClause.createdAt.gte = filters.createdAfter;
      }
      
      if (filters.createdBefore) {
        whereClause.createdAt.lte = filters.createdBefore;
      }
    }
  }

  // ====================================
  // CORE BUSINESS METHODS
  // These methods orchestrate the main business operations
  // ====================================

  /**
   * Create a new review - simplified and more focused
   * 
   * This method now has a clear flow:
   * 1. Fetch and validate the task
   * 2. Check for existing reviews
   * 3. Validate the review data
   * 4. Create the review
   * 5. Update trust score asynchronously
   */
  async createReview(
    authorId: string,
    reviewData: CreateReviewData
  ): Promise<ReviewWithRelations> {
    try {
      // Step 1: Fetch task and validate review eligibility
      const task = await this.fetchTaskForReview(reviewData.taskId);
      this.validateReviewEligibility(task, authorId, reviewData.subjectId);

      // Step 2: Check for duplicate reviews
      await this.checkForExistingReview(reviewData.taskId, authorId);

      // Step 3: Validate review data
      this.validateRatingValues(reviewData);

      // Step 4: Create the review
      const newReview = await this.persistNewReview(authorId, reviewData);

      // Step 5: Asynchronously update trust score (non-blocking)
      this.scheduleAsyncTrustScoreUpdate(reviewData.subjectId);

      this.logReviewCreation(newReview, task.id, authorId);
      return newReview;

    } catch (error) {
      logger.error("Failed to create review:", error);
      throw error;
    }
  }

  /**
   * Update an existing review with improved validation flow
   */
  async updateReview(
    reviewId: string,
    authorId: string,
    updateData: UpdateReviewData
  ): Promise<ReviewWithRelations> {
    try {
      // Validate permissions and time constraints
      const existingReview = await this.fetchReviewForUpdate(reviewId, authorId);
      this.validateTimeConstraints('edit', existingReview.createdAt);
      
      // Validate the update data
      this.validateRatingValues(updateData);

      // Perform the update
      const updatedReview = await this.persistReviewUpdate(reviewId, updateData);

      // Update trust score if rating changed
      if (updateData.rating !== undefined) {
        this.scheduleAsyncTrustScoreUpdate(updatedReview.subjectId);
      }

      logger.info("Review updated:", {
        reviewId,
        authorId,
        updatedFields: Object.keys(updateData),
      });

      return updatedReview;
    } catch (error) {
      logger.error("Failed to update review:", error);
      throw error;
    }
  }

  /**
   * Search reviews with reduced cognitive complexity
   * This method now focuses on orchestration rather than implementation details
   */
  async searchReviews(
    filters: ReviewSearchFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewSearchResult> {
    try {
      // Build query filters using dedicated helper
      const whereClause = this.buildReviewSearchWhereClause(filters);
      
      // Execute search with pagination
      const { reviews, totalCount } = await this.executeReviewSearch(whereClause, page, limit);
      
      // Create pagination info
      const pagination = createPagination(page, limit, totalCount);

      logger.info("Review search completed:", {
        filters,
        page,
        limit,
        totalResults: totalCount,
      });

      return { reviews, pagination };
    } catch (error) {
      logger.error("Review search failed:", error);
      throw error;
    }
  }

  /**
   * Delete a review with improved validation
   */
  async deleteReview(
    reviewId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<void> {
    try {
      const review = await this.fetchReviewForDeletion(reviewId, userId, isAdmin);
      this.validateTimeConstraints('delete', review.createdAt, isAdmin);

      await db.review.delete({
        where: { id: reviewId },
      });

      logger.info("Review deleted:", {
        reviewId,
        deletedBy: userId,
        isAdmin,
      });
    } catch (error) {
      logger.error("Failed to delete review:", error);
      throw error;
    }
  }

  // ====================================
  // DATA ACCESS HELPER METHODS
  // These methods handle specific database operations
  // ====================================

  /**
   * Fetches task data needed for review validation
   */
  private async fetchTaskForReview(taskId: string): Promise<TaskForReviewValidation> {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        assigneeId: true,
        completionDate: true,
      },
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return task as TaskForReviewValidation;
  }

  /**
   * Checks if a review already exists for the given task and author
   */
  private async checkForExistingReview(taskId: string, authorId: string): Promise<void> {
    const existingReview = await db.review.findUnique({
      where: {
        taskId_authorId: {
          taskId,
          authorId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError("You have already reviewed this task");
    }
  }

  /**
   * Persists a new review to the database
   */
  private async persistNewReview(
    authorId: string,
    reviewData: CreateReviewData
  ): Promise<ReviewWithRelations> {
    return await db.review.create({
      data: {
        taskId: reviewData.taskId,
        authorId: authorId,
        subjectId: reviewData.subjectId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        communicationRating: reviewData.communicationRating,
        qualityRating: reviewData.qualityRating,
        timelinessRating: reviewData.timelinessRating,
        isPublic: true,
        isVerified: false,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            trustScore: true,
          },
        },
        subject: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            trustScore: true,
          },
        },
      },
    }) as ReviewWithRelations;
  }

  /**
   * Executes the review search query with pagination
   */
  private async executeReviewSearch(
    whereClause: ReviewWhereClause,
    page: number,
    limit: number
  ): Promise<{ reviews: ReviewWithRelations[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    // Execute both queries concurrently for better performance
    const [totalCount, reviews] = await Promise.all([
      db.review.count({ where: whereClause }),
      db.review.findMany({
        where: whereClause,
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
            },
          },
          subject: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    return { reviews: reviews as ReviewWithRelations[], totalCount };
  }

  /**
   * Fetches review data for update operations with permission validation
   */
  private async fetchReviewForUpdate(reviewId: string, authorId: string) {
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
      },
    });

    if (!existingReview) {
      throw new NotFoundError("Review not found");
    }

    if (existingReview.authorId !== authorId) {
      throw new AuthorizationError("You can only update your own reviews");
    }

    return existingReview;
  }

  /**
   * Persists review updates to the database
   */
  private async persistReviewUpdate(
    reviewId: string,
    updateData: UpdateReviewData
  ): Promise<ReviewWithRelations> {
    return await db.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            trustScore: true,
          },
        },
        subject: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            trustScore: true,
          },
        },
      },
    }) as ReviewWithRelations;
  }

  /**
   * Fetches review data for deletion with permission validation
   */
  private async fetchReviewForDeletion(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
      },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (!isAdmin && review.authorId !== userId) {
      throw new AuthorizationError("You can only delete your own reviews");
    }

    return review;
  }

  // ====================================
  // UTILITY METHODS
  // These methods handle calculations and background operations
  // ====================================

  /**
   * Schedules asynchronous trust score update (non-blocking)
   */
  private scheduleAsyncTrustScoreUpdate(userId: string): void {
    setImmediate(() => {
      this.updateUserTrustScore(userId);
    });
  }

  /**
   * Logs review creation with relevant context
   */
  private logReviewCreation(
    review: ReviewWithRelations,
    taskId: string,
    authorId: string
  ): void {
    logger.info("New review created:", {
      reviewId: review.id,
      taskId,
      authorId,
      subjectId: review.subjectId,
      rating: review.rating,
    });
  }

  // ====================================
  // EXISTING METHODS (Maintained for compatibility)
  // These methods remain largely unchanged but benefit from the improved architecture
  // ====================================

  async getReviewById(
    reviewId: string,
    currentUserId?: string
  ): Promise<ReviewWithRelations & { permissions: Record<string, boolean> }> {
    try {
      const review = await db.review.findUnique({
        where: { id: reviewId },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              budget: true,
              completionDate: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
            },
          },
          subject: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
            },
          },
        },
      }) as ReviewWithRelations | null;

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      if (!review.isPublic) {
        const canView =
          currentUserId === review.authorId ||
          currentUserId === review.subjectId;

        if (!canView) {
          throw new AuthorizationError("This review is not public");
        }
      }

      const permissions = {
        canEdit: currentUserId === review.authorId,
        canDelete: currentUserId === review.authorId,
        canVoteHelpful: Boolean(
          currentUserId && currentUserId !== review.authorId
        ),
      };

      logger.info("Review retrieved:", {
        reviewId,
        viewedBy: currentUserId,
      });

      return {
        ...review,
        permissions,
      };
    } catch (error) {
      logger.error("Failed to get review:", error);
      throw error;
    }
  }

  async getUserReviewStats(userId: string): Promise<UserReviewStats> {
    try {
      const reviewsReceived = await db.review.findMany({
        where: {
          subjectId: userId,
          isPublic: true,
        },
        select: {
          rating: true,
          communicationRating: true,
          qualityRating: true,
          timelinessRating: true,
          createdAt: true,
        },
      }) as ReviewStatisticsData[];

      const reviewsGiven = await db.review.findMany({
        where: { authorId: userId },
        select: {
          rating: true,
          createdAt: true,
        },
      });

      const totalReceived = reviewsReceived.length;
      const totalGiven = reviewsGiven.length;

      if (totalReceived === 0) {
        return {
          received: {
            total: 0,
            averageRating: 0,
            averageCommunication: 0,
            averageQuality: 0,
            averageTimeliness: 0,
            ratingDistribution: {},
            recentTrend: "neutral",
          },
          given: {
            total: totalGiven,
            averageRating:
              totalGiven > 0
                ? reviewsGiven.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalGiven
                : 0,
          },
        };
      }

      return this.calculateDetailedReviewStats(reviewsReceived, reviewsGiven);
    } catch (error) {
      logger.error("Failed to get user review statistics:", error);
      throw error;
    }
  }

  async voteReviewHelpful(reviewId: string, voterId: string): Promise<void> {
    try {
      const review = await db.review.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          authorId: true,
          helpfulVotes: true,
        },
      });

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      if (review.authorId === voterId) {
        throw new ConflictError("You cannot vote on your own review");
      }

      await db.review.update({
        where: { id: reviewId },
        data: {
          helpfulVotes: {
            increment: 1,
          },
        },
      });

      logger.info("Review voted helpful:", {
        reviewId,
        voterId,
      });
    } catch (error) {
      logger.error("Failed to vote review helpful:", error);
      throw error;
    }
  }

  private calculateDetailedReviewStats(
    reviewsReceived: ReviewStatisticsData[],
    reviewsGiven: Array<{ rating: number; createdAt: Date }>
  ): UserReviewStats {
    const totalReceived = reviewsReceived.length;
    const totalGiven = reviewsGiven.length;

    const totalRating = reviewsReceived.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReceived;

    const communicationRatings = reviewsReceived
      .filter((r: ReviewStatisticsData) => r.communicationRating !== null)
      .map((r: ReviewStatisticsData) => r.communicationRating!);
    const averageCommunication =
      communicationRatings.length > 0
        ? communicationRatings.reduce((sum: number, r: number) => sum + r, 0) / communicationRatings.length
        : 0;

    const qualityRatings = reviewsReceived
      .filter((r: ReviewStatisticsData) => r.qualityRating !== null)
      .map((r: ReviewStatisticsData) => r.qualityRating!);
    const averageQuality =
      qualityRatings.length > 0
        ? qualityRatings.reduce((sum: number, r: number) => sum + r, 0) / qualityRatings.length
        : 0;

    const timelinessRatings = reviewsReceived
      .filter((r: ReviewStatisticsData) => r.timelinessRating !== null)
      .map((r: ReviewStatisticsData) => r.timelinessRating!);
    const averageTimeliness =
      timelinessRatings.length > 0
        ? timelinessRatings.reduce((sum: number, r: number) => sum + r, 0) / timelinessRatings.length
        : 0;

    const ratingDistribution = reviewsReceived.reduce(
      (dist, review) => {
        const rating = review.rating;
        dist[rating] = (dist[rating] ?? 0) + 1;
        return dist;
      },
      {} as Record<number, number>
    );

    const recentTrend = this.calculateRecentTrend(reviewsReceived);
    const averageGivenRating =
      totalGiven > 0
        ? reviewsGiven.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalGiven
        : 0;

    return {
      received: {
        total: totalReceived,
        averageRating: Math.round(averageRating * 10) / 10,
        averageCommunication: Math.round(averageCommunication * 10) / 10,
        averageQuality: Math.round(averageQuality * 10) / 10,
        averageTimeliness: Math.round(averageTimeliness * 10) / 10,
        ratingDistribution,
        recentTrend,
      },
      given: {
        total: totalGiven,
        averageRating: Math.round(averageGivenRating * 10) / 10,
      },
    };
  }

  private calculateRecentTrend(
    reviewsReceived: ReviewStatisticsData[]
  ): "improving" | "declining" | "neutral" {
    const sortedReviews = [...reviewsReceived].sort(
      (a: ReviewStatisticsData, b: ReviewStatisticsData) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const recentReviews = sortedReviews.slice(0, 10);
    const olderReviews = sortedReviews.slice(10);

    if (recentReviews.length >= 5 && olderReviews.length >= 5) {
      const recentAvg =
        recentReviews.reduce((sum: number, r: ReviewStatisticsData) => sum + r.rating, 0) / recentReviews.length;
      const olderAvg =
        olderReviews.reduce((sum: number, r: ReviewStatisticsData) => sum + r.rating, 0) / olderReviews.length;

      if (recentAvg > olderAvg + 0.2) {
        return "improving";
      } else if (recentAvg < olderAvg - 0.2) {
        return "declining";
      }
    }

    return "neutral";
  }

  private async updateUserTrustScore(userId: string): Promise<void> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentReviews = await db.review.findMany({
        where: {
          subjectId: userId,
          createdAt: { gte: sixMonthsAgo },
          isPublic: true,
        },
        select: {
          rating: true,
          createdAt: true,
        },
      });

      const completedTasks = await db.task.count({
        where: {
          OR: [
            { ownerId: userId, status: "COMPLETED" },
            { assigneeId: userId, status: "COMPLETED" },
          ],
        },
      });

      const totalTasks = await db.task.count({
        where: {
          OR: [{ ownerId: userId }, { assigneeId: userId }],
        },
      });

      let trustScore = 0;

      if (recentReviews.length > 0) {
        const averageRating =
          recentReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / recentReviews.length;
        trustScore = (averageRating / 5) * 3;
      }

      if (totalTasks > 0) {
        const completionRate = completedTasks / totalTasks;
        trustScore += completionRate * 1;
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          phoneVerified: true,
        },
      });

      if (user) {
        if (user.emailVerified) trustScore += 0.3;
        if (user.phoneVerified) trustScore += 0.2;
      }

      const activityBonus = Math.min(recentReviews.length * 0.05, 0.5);
      trustScore += activityBonus;

      trustScore = Math.min(trustScore, 5.0);

      await db.user.update({
        where: { id: userId },
        data: { trustScore: Math.round(trustScore * 10) / 10 },
      });

      logger.info("Trust score updated:", {
        userId,
        newTrustScore: trustScore,
        reviewCount: recentReviews.length,
        completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      });
    } catch (error) {
      logger.error("Failed to update trust score:", error);
    }
  }
}