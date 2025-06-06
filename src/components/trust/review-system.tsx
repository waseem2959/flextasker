/**
 * Multi-Dimensional Review System Component
 * 
 * Enhanced review system with multiple rating dimensions and detailed feedback.
 * Implements project-map specifications for comprehensive trust evaluation.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Award, Clock, Flag, MessageSquare, Star, ThumbsUp, User } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

export type ReviewDimension = 
  | 'quality'
  | 'communication'
  | 'timeliness'
  | 'professionalism'
  | 'value'
  | 'reliability';

export interface ReviewRating {
  dimension: ReviewDimension;
  score: number; // 1-5
}

export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  revieweeName: string;
  ratings: ReviewRating[];
  overallRating: number;
  comment: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
  helpfulVotes: number;
  reportCount: number;
  response?: {
    comment: string;
    createdAt: Date;
  };
}

interface ReviewFormProps {
  taskId: string;
  revieweeId: string;
  revieweeName: string;
  onSubmit: (review: Omit<Review, 'id' | 'createdAt' | 'helpfulVotes' | 'reportCount'>) => void;
  onCancel: () => void;
  className?: string;
}

interface ReviewDisplayProps {
  reviews: Review[];
  showAverages?: boolean;
  allowInteraction?: boolean;
  onHelpfulVote?: (reviewId: string) => void;

  className?: string;
}

// Review dimension configuration
const REVIEW_DIMENSIONS: Record<ReviewDimension, {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  weight: number; // For overall rating calculation
}> = {
  quality: {
    name: 'Quality of Work',
    description: 'How well was the task completed?',
    icon: Award,
    weight: 0.3,
  },
  communication: {
    name: 'Communication',
    description: 'How clear and responsive was the communication?',
    icon: MessageSquare,
    weight: 0.2,
  },
  timeliness: {
    name: 'Timeliness',
    description: 'Was the work completed on time?',
    icon: Clock,
    weight: 0.2,
  },
  professionalism: {
    name: 'Professionalism',
    description: 'How professional was the service?',
    icon: User,
    weight: 0.15,
  },
  value: {
    name: 'Value for Money',
    description: 'Was the service worth the price?',
    icon: Star,
    weight: 0.1,
  },
  reliability: {
    name: 'Reliability',
    description: 'How dependable was the service provider?',
    icon: Award,
    weight: 0.05,
  },
};

/**
 * Star Rating Component
 */
const StarRating: React.FC<{
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}> = ({ rating, onRatingChange, size = 'md', readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          className={cn(
            "transition-colors duration-150",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default"
          )}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors duration-150",
              (hoverRating || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-neutral-300"
            )}
          />
        </button>
      ))}
    </div>
  );
};

/**
 * Review Form Component
 */
export const ReviewForm: React.FC<ReviewFormProps> = ({
  taskId,
  revieweeId,
  revieweeName,
  onSubmit,
  onCancel,
  className,
}) => {
  const [ratings, setRatings] = useState<ReviewRating[]>(
    Object.keys(REVIEW_DIMENSIONS).map(dimension => ({
      dimension: dimension as ReviewDimension,
      score: 0,
    }))
  );
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate overall rating
  const overallRating = useMemo(() => {
    const weightedSum = ratings.reduce((sum, rating) => {
      const dimension = REVIEW_DIMENSIONS[rating.dimension];
      return sum + (rating.score * dimension.weight);
    }, 0);
    return Math.round(weightedSum * 10) / 10;
  }, [ratings]);

  // Update rating for specific dimension
  const updateRating = useCallback((dimension: ReviewDimension, score: number) => {
    setRatings(prev => prev.map(rating => 
      rating.dimension === dimension ? { ...rating, score } : rating
    ));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (ratings.some(r => r.score === 0) || !comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        taskId,
        reviewerId: 'current-user', // Would come from auth context
        reviewerName: 'Current User', // Would come from auth context
        revieweeId,
        revieweeName,
        ratings,
        overallRating,
        comment: comment.trim(),
        isPublic,
        isVerified: true, // Would be determined by verification status
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [ratings, comment, isPublic, overallRating, taskId, revieweeId, revieweeName, onSubmit]);

  const canSubmit = ratings.every(r => r.score > 0) && comment.trim().length >= 10;

  return (
    <Card className={cn("review-form", className)}>
      <CardHeader>
        <CardTitle className="font-heading">
          Leave a Review for {revieweeName}
        </CardTitle>
        <p className="text-sm text-neutral-600 font-body">
          Your feedback helps build trust in our community
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Dimension Ratings */}
        <div className="space-y-4">
          <h3 className="font-medium text-neutral-900 font-heading">
            Rate Different Aspects
          </h3>
          
          {Object.entries(REVIEW_DIMENSIONS).map(([key, dimension]) => {
            const rating = ratings.find(r => r.dimension === key)?.score || 0;
            const IconComponent = dimension.icon;
            
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconComponent className="w-5 h-5 text-neutral-600" />
                  <div>
                    <p className="font-medium text-neutral-900 font-heading">
                      {dimension.name}
                    </p>
                    <p className="text-xs text-neutral-600 font-body">
                      {dimension.description}
                    </p>
                  </div>
                </div>
                
                <StarRating
                  rating={rating}
                  onRatingChange={(score) => updateRating(key as ReviewDimension, score)}
                />
              </div>
            );
          })}
        </div>

        {/* Overall Rating Display */}
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary-900 font-heading">
              Overall Rating
            </span>
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(overallRating)} readonly size="lg" />
              <span className="text-xl font-bold text-primary-900 font-heading">
                {overallRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Written Review */}
        <div className="space-y-2">
          <label htmlFor="comment" className="font-medium text-neutral-900 font-heading">
            Written Review *
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this person..."
            className="min-h-[100px]"
            maxLength={1000}
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Minimum 10 characters</span>
            <span>{comment.length}/1000</span>
          </div>
        </div>

        {/* Privacy Setting */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-neutral-300"
          />
          <label htmlFor="isPublic" className="text-sm text-neutral-700 font-body">
            Make this review public (recommended for community trust)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white font-heading"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Review Display Component
 */
export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  reviews,
  showAverages = true,
  allowInteraction = true,
  onHelpfulVote,

  className,
}) => {


  // Calculate average ratings
  const averageRatings = useMemo(() => {
    if (reviews.length === 0) return {};
    
    const dimensionTotals: Record<ReviewDimension, number> = {} as any;
    const dimensionCounts: Record<ReviewDimension, number> = {} as any;
    
    reviews.forEach(review => {
      review.ratings.forEach(rating => {
        dimensionTotals[rating.dimension] = (dimensionTotals[rating.dimension] || 0) + rating.score;
        dimensionCounts[rating.dimension] = (dimensionCounts[rating.dimension] || 0) + 1;
      });
    });
    
    const averages: Record<ReviewDimension, number> = {} as any;
    Object.keys(dimensionTotals).forEach(dimension => {
      const dim = dimension as ReviewDimension;
      averages[dim] = dimensionTotals[dim] / dimensionCounts[dim];
    });
    
    return averages;
  }, [reviews]);

  const overallAverage = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviews.length 
    : 0;

  return (
    <div className={cn("review-display space-y-6", className)}>
      {/* Average Ratings Summary */}
      {showAverages && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Review Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-900 font-heading mb-2">
                  {overallAverage.toFixed(1)}
                </div>
                <StarRating rating={Math.round(overallAverage)} readonly size="lg" />
                <p className="text-sm text-neutral-600 font-body mt-2">
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              
              {/* Dimension Breakdown */}
              <div className="space-y-3">
                {Object.entries(REVIEW_DIMENSIONS).map(([key, dimension]) => {
                  const average = (averageRatings as any)[key as ReviewDimension] || 0;
                  const IconComponent = dimension.icon;
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm font-medium text-neutral-900 font-heading">
                          {dimension.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(average)} readonly size="sm" />
                        <span className="text-sm text-neutral-600 font-body">
                          {average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="review-card">
            <CardContent className="p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.reviewerAvatar} />
                    <AvatarFallback>
                      {review.reviewerName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 font-heading">
                        {review.reviewerName}
                      </span>
                      {review.isVerified && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={Math.round(review.overallRating)} readonly size="sm" />
                      <span className="text-sm text-neutral-600 font-body">
                        {review.overallRating.toFixed(1)} • {review.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {allowInteraction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Review Content */}
              <div className="space-y-4">
                <p className="text-neutral-700 font-body leading-relaxed">
                  {review.comment}
                </p>

                {/* Dimension Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {review.ratings.map((rating) => {
                    const dimension = REVIEW_DIMENSIONS[rating.dimension];
                    const IconComponent = dimension.icon;
                    
                    return (
                      <div key={rating.dimension} className="flex items-center gap-2">
                        <IconComponent className="w-3 h-3 text-neutral-500" />
                        <span className="text-xs text-neutral-600 font-body">
                          {dimension.name}
                        </span>
                        <StarRating rating={rating.score} readonly size="sm" />
                      </div>
                    );
                  })}
                </div>

                {/* Review Actions */}
                {allowInteraction && (
                  <div className="flex items-center gap-4 pt-3 border-t border-neutral-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHelpfulVote?.(review.id)}
                      className="text-neutral-600 hover:text-neutral-800"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful ({review.helpfulVotes})
                    </Button>
                  </div>
                )}

                {/* Response */}
                {review.response && (
                  <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-neutral-900 font-heading">
                        Response from {review.revieweeName}
                      </span>
                      <span className="text-xs text-neutral-500 font-body">
                        {review.response.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 font-body">
                      {review.response.comment}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="font-medium text-neutral-900 font-heading mb-2">
              No Reviews Yet
            </h3>
            <p className="text-neutral-600 font-body">
              Be the first to leave a review and help build trust in our community.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default { ReviewForm, ReviewDisplay };
