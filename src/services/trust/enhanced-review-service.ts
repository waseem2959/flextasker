/**
 * Enhanced Review & Rating Service
 * 
 * Advanced review system with photo/video capabilities, verified transaction reviews,
 * reputation management, and AI-powered moderation for marketplace trust.
 */

import { ApiResponse } from '@/types';
import { apiClient } from '../api/api-client';
import { errorService } from '../error/error-service';

export type ReviewType = 'task_completion' | 'service_quality' | 'communication' | 'overall';
export type ReviewStatus = 'pending' | 'published' | 'flagged' | 'removed' | 'under_review';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'requires_human_review';

export interface ReviewMedia {
  id: string;
  type: 'photo' | 'video' | 'audio';
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  duration?: number; // for video/audio in seconds
  uploadedAt: Date;
  
  // Content Analysis
  analysis?: {
    isAppropriate: boolean;
    confidence: number;
    flags: Array<{
      type: 'inappropriate_content' | 'personal_info' | 'spam' | 'fake';
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    
    // Image/Video Analysis
    objectsDetected?: string[];
    textDetected?: string;
    facesDetected?: number;
    qualityScore?: number;
  };
  
  // Moderation Results
  moderation: {
    status: ModerationStatus;
    reviewedAt?: Date;
    reviewedBy?: string;
    moderationNotes?: string;
  };
}

export interface EnhancedReview {
  id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  
  // Review Content
  rating: number; // 1-5 stars
  title: string;
  content: string;
  
  // Detailed Ratings
  detailedRatings: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
    valueForMoney: number;
  };
  
  // Media Attachments
  media: ReviewMedia[];
  
  // Verification Status
  isVerified: boolean;
  verificationMethod: 'transaction_confirmed' | 'payment_verified' | 'manual_verification';
  transactionId?: string;
  
  // Review Metadata
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Moderation & AI Analysis
  moderation: {
    aiAnalysis: {
      sentimentScore: number; // -1 to 1
      authenticity: number; // 0 to 1
      helpfulness: number; // 0 to 1
      flags: Array<{
        type: 'fake_review' | 'spam' | 'inappropriate' | 'bias' | 'incentivized';
        confidence: number;
        reason: string;
      }>;
    };
    
    humanReview?: {
      reviewedBy: string;
      reviewedAt: Date;
      decision: 'approve' | 'reject' | 'edit';
      notes: string;
    };
    
    status: ModerationStatus;
  };
  
  // Engagement Metrics
  engagement: {
    helpfulVotes: number;
    unhelpfulVotes: number;
    reportCount: number;
    responseCount: number;
  };
  
  // Response from Reviewee
  response?: {
    content: string;
    createdAt: Date;
    isPublic: boolean;
  };
}

export interface ReputationProfile {
  userId: string;
  overallRating: number;
  totalReviews: number;
  verifiedReviews: number;
  
  // Rating Distribution
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  
  // Detailed Metrics
  metrics: {
    averageQuality: number;
    averageCommunication: number;
    averageTimeliness: number;
    averageProfessionalism: number;
    averageValueForMoney: number;
  };
  
  // Trust Indicators
  trustIndicators: {
    verificationLevel: 'basic' | 'standard' | 'premium';
    identityVerified: boolean;
    paymentVerified: boolean;
    phoneVerified: boolean;
    emailVerified: boolean;
    backgroundChecked: boolean;
  };
  
  // Badges and Achievements
  badges: Array<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    earnedAt: Date;
    category: 'quality' | 'reliability' | 'communication' | 'experience';
  }>;
  
  // Performance Trends
  trends: {
    last30Days: {
      averageRating: number;
      reviewCount: number;
      responseRate: number;
    };
    last90Days: {
      averageRating: number;
      reviewCount: number;
      responseRate: number;
    };
  };
  
  updatedAt: Date;
}

export interface ReviewModerationQueue {
  id: string;
  review: EnhancedReview;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  
  // Moderation Context
  context: {
    reportReasons: string[];
    reportCount: number;
    aiFlags: Array<{
      type: string;
      confidence: number;
      description: string;
    }>;
    userHistory: {
      previousViolations: number;
      accountAge: number;
      reviewCount: number;
    };
  };
  
  // Moderation Actions
  availableActions: Array<{
    action: 'approve' | 'reject' | 'edit' | 'request_more_info' | 'escalate';
    description: string;
  }>;
  
  createdAt: Date;
  dueDate: Date;
}

/**
 * Submit a new review with media
 */
export async function submitReview(
  taskId: string,
  revieweeId: string,
  reviewData: {
    rating: number;
    title: string;
    content: string;
    detailedRatings: EnhancedReview['detailedRatings'];
  },
  mediaFiles?: File[]
): Promise<ApiResponse<EnhancedReview>> {
  try {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('revieweeId', revieweeId);
    formData.append('reviewData', JSON.stringify(reviewData));
    
    if (mediaFiles) {
      mediaFiles.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });
    }

    return await apiClient.post('/reviews/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to submit review');
    throw error;
  }
}

/**
 * Upload review media
 */
export async function uploadReviewMedia(
  reviewId: string,
  mediaFile: File,
  metadata?: {
    caption?: string;
    tags?: string[];
  }
): Promise<ApiResponse<ReviewMedia>> {
  try {
    const formData = new FormData();
    formData.append('media', mediaFile);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return await apiClient.post(`/reviews/${reviewId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to upload review media');
    throw error;
  }
}

/**
 * Get reviews for a user or task
 */
export async function getReviews(
  filters: {
    userId?: string;
    taskId?: string;
    reviewerId?: string;
    status?: ReviewStatus;
    verified?: boolean;
    hasMedia?: boolean;
  },
  pagination?: {
    page: number;
    limit: number;
    sortBy?: 'date' | 'rating' | 'helpfulness';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<{
  reviews: EnhancedReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  aggregates: {
    averageRating: number;
    totalReviews: number;
    verifiedReviews: number;
    ratingDistribution: Record<number, number>;
  };
}>> {
  try {
    const params = { ...filters, ...pagination };
    return await apiClient.get('/reviews', params);
  } catch (error) {
    errorService.handleError(error, 'Failed to get reviews');
    throw error;
  }
}

/**
 * Moderate review content using AI
 */
export async function moderateReview(
  reviewId: string,
  options?: {
    checkAuthenticity?: boolean;
    checkSentiment?: boolean;
    checkAppropriate?: boolean;
    checkSpam?: boolean;
  }
): Promise<ApiResponse<{
  moderationResult: EnhancedReview['moderation']['aiAnalysis'];
  recommendedAction: 'approve' | 'reject' | 'flag_for_human_review';
  confidence: number;
}>> {
  try {
    return await apiClient.post(`/reviews/${reviewId}/moderate`, options);
  } catch (error) {
    errorService.handleError(error, 'Failed to moderate review');
    throw error;
  }
}

/**
 * Report a review
 */
export async function reportReview(
  reviewId: string,
  reportData: {
    reason: 'fake' | 'spam' | 'inappropriate' | 'personal_attack' | 'off_topic' | 'other';
    description: string;
    evidence?: string[];
  }
): Promise<ApiResponse<{ reportId: string; status: string }>> {
  try {
    return await apiClient.post(`/reviews/${reviewId}/report`, reportData);
  } catch (error) {
    errorService.handleError(error, 'Failed to report review');
    throw error;
  }
}

/**
 * Vote on review helpfulness
 */
export async function voteOnReview(
  reviewId: string,
  vote: 'helpful' | 'unhelpful'
): Promise<ApiResponse<{
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote: string;
}>> {
  try {
    return await apiClient.post(`/reviews/${reviewId}/vote`, { vote });
  } catch (error) {
    errorService.handleError(error, 'Failed to vote on review');
    throw error;
  }
}

/**
 * Respond to a review
 */
export async function respondToReview(
  reviewId: string,
  response: {
    content: string;
    isPublic: boolean;
  }
): Promise<ApiResponse<EnhancedReview>> {
  try {
    return await apiClient.post(`/reviews/${reviewId}/respond`, response);
  } catch (error) {
    errorService.handleError(error, 'Failed to respond to review');
    throw error;
  }
}

/**
 * Get user reputation profile
 */
export async function getReputationProfile(
  userId: string
): Promise<ApiResponse<ReputationProfile>> {
  try {
    return await apiClient.get(`/reputation/${userId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to get reputation profile');
    throw error;
  }
}

/**
 * Update reputation badges
 */
export async function updateReputationBadges(
  userId: string
): Promise<ApiResponse<ReputationProfile['badges']>> {
  try {
    return await apiClient.post(`/reputation/${userId}/update-badges`);
  } catch (error) {
    errorService.handleError(error, 'Failed to update reputation badges');
    throw error;
  }
}

/**
 * Get moderation queue
 */
export async function getModerationQueue(
  filters?: {
    priority?: ReviewModerationQueue['priority'];
    assignedTo?: string;
    status?: ModerationStatus;
  },
  pagination?: {
    page: number;
    limit: number;
  }
): Promise<ApiResponse<{
  queue: ReviewModerationQueue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalPending: number;
    averageProcessingTime: number;
    priorityBreakdown: Record<string, number>;
  };
}>> {
  try {
    const params = { ...filters, ...pagination };
    return await apiClient.get('/reviews/moderation/queue', params);
  } catch (error) {
    errorService.handleError(error, 'Failed to get moderation queue');
    throw error;
  }
}

/**
 * Process moderation decision
 */
export async function processModerationDecision(
  queueId: string,
  decision: {
    action: 'approve' | 'reject' | 'edit' | 'escalate';
    reason: string;
    notes?: string;
    editedContent?: {
      title?: string;
      content?: string;
    };
  }
): Promise<ApiResponse<ReviewModerationQueue>> {
  try {
    return await apiClient.post(`/reviews/moderation/queue/${queueId}/decision`, decision);
  } catch (error) {
    errorService.handleError(error, 'Failed to process moderation decision');
    throw error;
  }
}

/**
 * Get review analytics
 */
export async function getReviewAnalytics(
  timeRange: {
    startDate: Date;
    endDate: Date;
  },
  filters?: {
    userId?: string;
    category?: string;
  }
): Promise<ApiResponse<{
  totalReviews: number;
  averageRating: number;
  verificationRate: number;
  moderationStats: {
    totalModerated: number;
    approvalRate: number;
    averageProcessingTime: number;
    topFlags: Array<{ flag: string; count: number }>;
  };
  trends: {
    dailyReviews: Array<{ date: Date; count: number; averageRating: number }>;
    ratingDistribution: Record<number, number>;
    mediaUsage: {
      withPhotos: number;
      withVideos: number;
      withoutMedia: number;
    };
  };
}>> {
  try {
    const params = {
      startDate: timeRange.startDate.toISOString(),
      endDate: timeRange.endDate.toISOString(),
      ...filters
    };
    return await apiClient.get('/reviews/analytics', params);
  } catch (error) {
    errorService.handleError(error, 'Failed to get review analytics');
    throw error;
  }
}

// Export service object
export const enhancedReviewService = {
  submitReview,
  uploadReviewMedia,
  getReviews,
  moderateReview,
  reportReview,
  voteOnReview,
  respondToReview,
  getReputationProfile,
  updateReputationBadges,
  getModerationQueue,
  processModerationDecision,
  getReviewAnalytics
};

export default enhancedReviewService;
