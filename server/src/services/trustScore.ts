import { db } from '@/utils/database';
import { NotFoundError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Trust Score service - this is like the credit rating agency of our platform.
 * It calculates and maintains trust scores based on user behavior, verification
 * status, reviews, task completion rates, and other factors.
 * 
 * Think of this as having a sophisticated reputation system that helps users
 * identify trustworthy partners for their transactions.
 */

// ====================================
// TYPE DEFINITIONS AND INTERFACES
// ====================================

/**
 * These interfaces provide comprehensive typing for trust score calculations.
 * Think of them as blueprints that ensure data consistency and help catch
 * errors during development rather than in production.
 */

export interface TrustScoreFactors {
  verificationScore: number;
  reviewScore: number;
  completionScore: number;
  activityScore: number;
  recencyScore: number;
  totalScore: number;
}

export interface TrustScoreAnalysis {
  currentScore: number;
  factors: TrustScoreFactors;
  recommendations: string[];
  nextMilestone: {
    score: number;
    requirements: string[];
  };
}

// Database result interfaces - what we expect from Prisma queries
interface UserWithTrustData {
  id: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustScore: number;
  reviewsReceived: ReviewFromDatabase[];
  postedTasks: TaskFromDatabase[];
  assignedTasks: TaskFromDatabase[];
  verifications: VerificationFromDatabase[];
}

interface ReviewFromDatabase {
  rating: number;
  createdAt: Date;
  communicationRating?: number | null;
  qualityRating?: number | null;
  timelinessRating?: number | null;
}

interface TaskFromDatabase {
  status: string;
  createdAt: Date;
}

interface VerificationFromDatabase {
  type: string;
  status: string;
}

// Configuration interface for trust score weights
interface TrustScoreWeights {
  verification: number;
  reviews: number;
  completion: number;
  activity: number;
}

// Review statistics interface for calculations
interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  communicationAverage: number;
  qualityAverage: number;
  timelinessAverage: number;
  reviewCountBonus: number;
  consistencyBonus: number;
}

// Task completion statistics interface
interface CompletionStatistics {
  totalTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  finishedTasks: number;
  completionRate: number;
  volumeBonus: number;
}

// Activity metrics interface
interface ActivityMetrics {
  totalActivity: number;
  hasDiverseActivity: boolean;
  baseScore: number;
  diversityBonus: number;
}

// Recency analysis interface
interface RecencyAnalysis {
  mostRecentActivity: number;
  timeSinceActivity: number;
  recencyCategory: 'very_recent' | 'recent' | 'old' | 'none';
}

// ====================================
// TRUST SCORE CALCULATION SERVICE
// ====================================

export class TrustScoreService {
  // Configuration constants with proper typing and environment variable fallbacks
  private readonly weights: TrustScoreWeights = {
    verification: parseFloat(process.env.TRUST_SCORE_VERIFICATION_WEIGHT ?? '0.25'), // 25%
    reviews: parseFloat(process.env.TRUST_SCORE_RATING_WEIGHT ?? '0.35'),           // 35%
    completion: parseFloat(process.env.TRUST_SCORE_COMPLETION_WEIGHT ?? '0.25'),     // 25%
    activity: parseFloat(process.env.TRUST_SCORE_RECENCY_WEIGHT ?? '0.15'),         // 15%
  };

  // Constants for various calculations
  private readonly constants = {
    maxTrustScore: 5.0,
    neutralScoreForNewUsers: 2.5,
    verificationBonus: {
      email: 1.5,
      phone: 1.5,
      document: 2.0,
    },
    activityBonus: {
      diversity: 0.5,
      maxVolumeBonus: 1.0,
    },
    recencyThresholds: {
      oneMonth: 30 * 24 * 60 * 60 * 1000,   // 30 days in milliseconds
      threeMonths: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    },
    reviewBonus: {
      maxCountBonus: 1.0,
      countBonusRate: 0.1,
      maxConsistencyBonus: 0.5,
      minReviewsForConsistency: 5,
    },
  } as const;

  /**
   * Calculate comprehensive trust score for a user
   * 
   * This is the main orchestration method that coordinates all the different
   * aspects of trust score calculation. Think of it like a conductor leading
   * an orchestra - each instrument (verification, reviews, completion, activity)
   * plays its part to create the final symphony.
   */
  async calculateTrustScore(userId: string): Promise<TrustScoreFactors> {
    try {
      // Fetch all user data needed for trust score calculation
      const userData = await this.fetchUserTrustData(userId);

      if (!userData) {
        throw new NotFoundError('User not found');
      }

      // Calculate each component of the trust score using focused methods
      const verificationScore = this.calculateVerificationScore(userData);
      const reviewScore = this.calculateReviewScore(userData.reviewsReceived);
      const completionScore = this.calculateCompletionScore(userData.postedTasks, userData.assignedTasks);
      const activityScore = this.calculateActivityScore(userData.reviewsReceived, userData.postedTasks, userData.assignedTasks);
      const recencyScore = this.calculateRecencyScore(userData.reviewsReceived, userData.postedTasks, userData.assignedTasks);

      // Combine all scores using weighted calculation
      const totalScore = this.calculateWeightedTotalScore({
        verificationScore,
        reviewScore,
        completionScore,
        activityScore,
        recencyScore,
      });

      const factors: TrustScoreFactors = {
        verificationScore,
        reviewScore,
        completionScore,
        activityScore,
        recencyScore,
        totalScore,
      };

      logger.info('Trust score calculated successfully:', {
        userId,
        factors,
      });

      return factors;

    } catch (error) {
      logger.error('Failed to calculate trust score:', error);
      throw error;
    }
  }

  /**
   * Update user's trust score in the database
   * 
   * This method handles the database interaction and ensures the calculated
   * trust score is persisted properly. Think of it as updating someone's
   * credit score in the financial system.
   */
  async updateUserTrustScore(userId: string): Promise<number> {
    try {
      const factors = await this.calculateTrustScore(userId);
      
      await db.user.update({
        where: { id: userId },
        data: { trustScore: factors.totalScore },
      });

      logger.info('User trust score updated successfully:', {
        userId,
        newScore: factors.totalScore,
      });

      return factors.totalScore;

    } catch (error) {
      logger.error('Failed to update user trust score:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive trust score analysis with actionable recommendations
   * 
   * This method provides detailed insights into how a user can improve their
   * trust score. Think of it like a financial advisor explaining how to
   * improve your credit rating.
   */
  async getTrustScoreAnalysis(userId: string): Promise<TrustScoreAnalysis> {
    try {
      const factors = await this.calculateTrustScore(userId);
      const recommendations = this.generateRecommendations(factors);
      const nextMilestone = this.determineNextMilestone(factors.totalScore);
      
      return {
        currentScore: factors.totalScore,
        factors,
        recommendations,
        nextMilestone,
      };

    } catch (error) {
      logger.error('Failed to get trust score analysis:', error);
      throw error;
    }
  }

  /**
   * Batch update trust scores for multiple users
   * 
   * This method handles bulk operations efficiently, which is important for
   * scheduled maintenance tasks that update all user scores periodically.
   */
  async batchUpdateTrustScores(limit: number = 100): Promise<number> {
    try {
      // Get users who need trust score updates
      const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true },
        take: limit,
      });

      let updatedCount = 0;
      
      // Process users in batches to avoid overwhelming the database
      for (const user of users) {
        try {
          await this.updateUserTrustScore(user.id);
          updatedCount++;
        } catch (error) {
          logger.warn('Failed to update trust score for user:', { 
            userId: user.id, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Batch trust score update completed:', {
        totalProcessed: users.length,
        successfulUpdates: updatedCount,
      });

      return updatedCount;

    } catch (error) {
      logger.error('Batch trust score update failed:', error);
      throw error;
    }
  }

  // ====================================
  // PRIVATE HELPER METHODS
  // ====================================

  /**
   * These private methods break down the complex trust score calculation
   * into manageable, testable pieces. Each method has a single responsibility
   * and can be understood and modified independently.
   */

  /**
   * Fetch all user data needed for trust score calculation
   */
  private async fetchUserTrustData(userId: string): Promise<UserWithTrustData | null> {
    return await db.user.findUnique({
      where: { id: userId },
      include: {
        reviewsReceived: {
          select: {
            rating: true,
            createdAt: true,
            communicationRating: true,
            qualityRating: true,
            timelinessRating: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        postedTasks: {
          select: {
            status: true,
            createdAt: true,
          },
        },
        assignedTasks: {
          select: {
            status: true,
            createdAt: true,
          },
        },
        verifications: {
          where: {
            status: 'VERIFIED',
          },
          select: {
            type: true,
          },
        },
      },
    });
  }

  /**
   * Calculate verification component score (0-5 scale)
   * 
   * This evaluates how thoroughly a user has verified their identity.
   * Think of it like checking how many forms of ID someone has provided.
   */
  private calculateVerificationScore(user: UserWithTrustData): number {
    let score = 0;

    // Email verification adds points
    if (user.emailVerified) {
      score += this.constants.verificationBonus.email;
    }

    // Phone verification adds points
    if (user.phoneVerified) {
      score += this.constants.verificationBonus.phone;
    }

    // Document verification adds significant points
    if (user.verifications && user.verifications.length > 0) {
      score += this.constants.verificationBonus.document;
    }

    return Math.min(score, this.constants.maxTrustScore);
  }

  /**
   * Calculate review component score (0-5 scale)
   * 
   * This analyzes the quality and consistency of reviews a user has received.
   * Think of it like analyzing customer satisfaction scores for a business.
   */
  private calculateReviewScore(reviews: ReviewFromDatabase[]): number {
    if (reviews.length === 0) {
      return 0;
    }

    // Calculate basic review statistics
    const reviewStats = this.calculateReviewStatistics(reviews);
    
    // Start with base score from average rating
    let score = (reviewStats.averageRating - 1) * 1.25; // Maps 1-5 scale to 0-5 scale

    // Add bonus for having multiple reviews
    score += reviewStats.reviewCountBonus;

    // Add bonus for consistent ratings (low variability)
    score += reviewStats.consistencyBonus;

    return Math.min(score, this.constants.maxTrustScore);
  }

  /**
   * Calculate detailed review statistics
   */
  private calculateReviewStatistics(reviews: ReviewFromDatabase[]): ReviewStatistics {
    const totalRating = reviews.reduce((sum: number, review: ReviewFromDatabase) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate averages for detailed ratings
    const communicationRatings = reviews
      .filter((review: ReviewFromDatabase) => review.communicationRating !== null)
      .map((review: ReviewFromDatabase) => review.communicationRating!);
    
    const qualityRatings = reviews
      .filter((review: ReviewFromDatabase) => review.qualityRating !== null)
      .map((review: ReviewFromDatabase) => review.qualityRating!);
    
    const timelinessRatings = reviews
      .filter((review: ReviewFromDatabase) => review.timelinessRating !== null)
      .map((review: ReviewFromDatabase) => review.timelinessRating!);

    // Calculate bonus for number of reviews
    const reviewCountBonus = Math.min(
      reviews.length * this.constants.reviewBonus.countBonusRate, 
      this.constants.reviewBonus.maxCountBonus
    );

    // Calculate consistency bonus for users with enough reviews
    let consistencyBonus = 0;
    if (reviews.length >= this.constants.reviewBonus.minReviewsForConsistency) {
      const variance = reviews.reduce((sum: number, review: ReviewFromDatabase) => {
        return sum + Math.pow(review.rating - averageRating, 2);
      }, 0) / reviews.length;
      
      const standardDeviation = Math.sqrt(variance);
      consistencyBonus = Math.max(0, (1 - standardDeviation / 2) * this.constants.reviewBonus.maxConsistencyBonus);
    }

    return {
      totalReviews: reviews.length,
      averageRating,
      communicationAverage: this.calculateAverage(communicationRatings),
      qualityAverage: this.calculateAverage(qualityRatings),
      timelinessAverage: this.calculateAverage(timelinessRatings),
      reviewCountBonus,
      consistencyBonus,
    };
  }

  /**
   * Calculate completion component score (0-5 scale)
   * 
   * This evaluates how reliable a user is at completing their commitments.
   * Think of it like measuring someone's track record of finishing projects.
   */
  private calculateCompletionScore(postedTasks: TaskFromDatabase[], assignedTasks: TaskFromDatabase[]): number {
    const allTasks = [...postedTasks, ...assignedTasks];
    
    if (allTasks.length === 0) {
      return this.constants.neutralScoreForNewUsers; // Neutral score for new users
    }

    const completionStats = this.calculateCompletionStatistics(allTasks);

    if (completionStats.finishedTasks === 0) {
      return this.constants.neutralScoreForNewUsers; // Neutral score if no tasks are finished yet
    }

    // Convert completion rate to 0-5 scale
    let score = completionStats.completionRate * this.constants.maxTrustScore;

    // Add bonus for higher volume of completed tasks
    score += completionStats.volumeBonus;

    return Math.min(score, this.constants.maxTrustScore);
  }

  /**
   * Calculate detailed completion statistics
   */
  private calculateCompletionStatistics(allTasks: TaskFromDatabase[]): CompletionStatistics {
    const completedTasks = allTasks.filter((task: TaskFromDatabase) => task.status === 'COMPLETED').length;
    const cancelledTasks = allTasks.filter((task: TaskFromDatabase) => task.status === 'CANCELLED').length;
    const finishedTasks = completedTasks + cancelledTasks;
    
    const completionRate = finishedTasks > 0 ? completedTasks / finishedTasks : 0;
    const volumeBonus = Math.min(completedTasks * 0.1, this.constants.activityBonus.maxVolumeBonus);

    return {
      totalTasks: allTasks.length,
      completedTasks,
      cancelledTasks,
      finishedTasks,
      completionRate,
      volumeBonus,
    };
  }

  /**
   * Calculate activity component score (0-5 scale)
   * 
   * This measures overall platform engagement and diverse participation.
   * Think of it like measuring how active and well-rounded a community member is.
   */
  private calculateActivityScore(
    reviews: ReviewFromDatabase[], 
    postedTasks: TaskFromDatabase[], 
    assignedTasks: TaskFromDatabase[]
  ): number {
    const activityMetrics = this.calculateActivityMetrics(reviews, postedTasks, assignedTasks);

    if (activityMetrics.totalActivity === 0) {
      return 0;
    }

    // Base score using logarithmic scale for diminishing returns
    let score = activityMetrics.baseScore;

    // Bonus for diverse activity (both posting and completing tasks)
    if (activityMetrics.hasDiverseActivity) {
      score += activityMetrics.diversityBonus;
    }

    return Math.min(score, this.constants.maxTrustScore);
  }

  /**
   * Calculate detailed activity metrics
   */
  private calculateActivityMetrics(
    reviews: ReviewFromDatabase[], 
    postedTasks: TaskFromDatabase[], 
    assignedTasks: TaskFromDatabase[]
  ): ActivityMetrics {
    const totalActivity = reviews.length + postedTasks.length + assignedTasks.length;
    const hasDiverseActivity = postedTasks.length > 0 && assignedTasks.length > 0;
    const baseScore = Math.log(totalActivity + 1) * 1.5;
    const diversityBonus = this.constants.activityBonus.diversity;

    return {
      totalActivity,
      hasDiverseActivity,
      baseScore,
      diversityBonus,
    };
  }

  /**
   * Calculate recency component score (0-5 scale)
   * 
   * This gives higher scores to users who are recently active.
   * Think of it like measuring how current and engaged someone is with the platform.
   */
  private calculateRecencyScore(
    reviews: ReviewFromDatabase[], 
    postedTasks: TaskFromDatabase[], 
    assignedTasks: TaskFromDatabase[]
  ): number {
    const recencyAnalysis = this.analyzeRecency(reviews, postedTasks, assignedTasks);

    switch (recencyAnalysis.recencyCategory) {
      case 'very_recent':
        return 5.0; // Very recent activity
      case 'recent':
        return 3.0; // Moderately recent activity
      case 'old':
        return 1.0; // Old activity
      case 'none':
      default:
        return 0.0; // No activity
    }
  }

  /**
   * Analyze user activity recency
   */
  private analyzeRecency(
    reviews: ReviewFromDatabase[], 
    postedTasks: TaskFromDatabase[], 
    assignedTasks: TaskFromDatabase[]
  ): RecencyAnalysis {
    const now = Date.now();
    
    // Find most recent activity across all types
    const allActivities = [
      ...reviews.map((review: ReviewFromDatabase) => review.createdAt),
      ...postedTasks.map((task: TaskFromDatabase) => task.createdAt),
      ...assignedTasks.map((task: TaskFromDatabase) => task.createdAt),
    ];

    if (allActivities.length === 0) {
      return {
        mostRecentActivity: 0,
        timeSinceActivity: Infinity,
        recencyCategory: 'none',
      };
    }

    const mostRecentActivity = Math.max(...allActivities.map((date: Date) => date.getTime()));
    const timeSinceActivity = now - mostRecentActivity;

    let recencyCategory: RecencyAnalysis['recencyCategory'];
    if (timeSinceActivity <= this.constants.recencyThresholds.oneMonth) {
      recencyCategory = 'very_recent';
    } else if (timeSinceActivity <= this.constants.recencyThresholds.threeMonths) {
      recencyCategory = 'recent';
    } else {
      recencyCategory = 'old';
    }

    return {
      mostRecentActivity,
      timeSinceActivity,
      recencyCategory,
    };
  }

  /**
   * Calculate weighted total score from individual components
   */
  private calculateWeightedTotalScore(scores: Omit<TrustScoreFactors, 'totalScore'>): number {
    const totalScore = 
      (scores.verificationScore * this.weights.verification) +
      (scores.reviewScore * this.weights.reviews) +
      (scores.completionScore * this.weights.completion) +
      (scores.activityScore * this.weights.activity);

    // Round to one decimal place and cap at maximum
    return Math.min(Math.round(totalScore * 10) / 10, this.constants.maxTrustScore);
  }

  /**
   * Generate personalized recommendations for improving trust score
   */
  private generateRecommendations(factors: TrustScoreFactors): string[] {
    const recommendations: string[] = [];
    
    // Verification recommendations
    if (factors.verificationScore < 3.0) {
      if (factors.verificationScore < 1.5) {
        recommendations.push('Verify your email address to increase your trust score');
      }
      if (factors.verificationScore < 3.0) {
        recommendations.push('Verify your phone number to boost credibility');
      }
      if (factors.verificationScore < 5.0) {
        recommendations.push('Submit identity documents for premium verification');
      }
    }

    // Review recommendations
    if (factors.reviewScore < 3.0) {
      recommendations.push('Complete more tasks to receive reviews and ratings');
      if (factors.reviewScore > 0) {
        recommendations.push('Focus on providing excellent service to improve your average rating');
      }
    }

    // Completion recommendations
    if (factors.completionScore < 3.0) {
      recommendations.push('Maintain a high task completion rate by finishing committed work');
    }

    // Activity recommendations
    if (factors.activityScore < 3.0) {
      recommendations.push('Stay active on the platform by regularly posting or bidding on tasks');
    }

    return recommendations;
  }

  /**
   * Determine the next milestone and requirements for reaching it
   */
  private determineNextMilestone(currentScore: number): TrustScoreAnalysis['nextMilestone'] {
    if (currentScore < 2.0) {
      return {
        score: 2.0,
        requirements: ['Verify email address', 'Complete first task'],
      };
    } else if (currentScore < 3.0) {
      return {
        score: 3.0,
        requirements: ['Verify phone number', 'Receive 3+ positive reviews'],
      };
    } else if (currentScore < 4.0) {
      return {
        score: 4.0,
        requirements: ['Complete 10+ tasks', 'Maintain 4.5+ star rating'],
      };
    } else {
      return {
        score: 5.0,
        requirements: ['Submit identity verification', 'Complete 25+ tasks', 'Maintain consistent high ratings'],
      };
    }
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((total: number, num: number) => total + num, 0);
    return sum / numbers.length;
  }
}