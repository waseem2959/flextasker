import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { cn, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Award,
    Calendar,
    CheckCircle,
    Clock,
    MapPin,
    MessageCircle,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';

interface Provider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTime: string;
  isVerified: boolean;
  completedTasks: number;
  joinedDate: string;
}

interface Bid {
  id: string;
  provider: Provider;
  amount: number;
  type: 'fixed' | 'hourly';
  message: string;
  distance: string;
  estimatedDuration?: string;
  proposedStartDate?: string;
  createdAt: string;
  isHighlighted?: boolean;
}

interface BidCardProps {
  bid: Bid;
  onAccept: (bidId: string) => void;
  onMessage: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
  className?: string;
}

export const BidCard: React.FC<BidCardProps> = ({ 
  bid, 
  onAccept, 
  onMessage, 
  onViewProfile,
  className 
}) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // getInitials function now imported from @/lib/utils

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const shouldTruncateMessage = bid.message.length > 150;
  const displayMessage = shouldTruncateMessage && !showFullMessage 
    ? bid.message.substring(0, 150) + '...' 
    : bid.message;

  return (
    <motion.div
      className={cn("w-full", className)}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:border-primary-300",
        bid.isHighlighted && "ring-2 ring-primary-600 ring-opacity-20",
        isHovered && "shadow-md"
      )}>
        {bid.isHighlighted && (
          <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 text-xs font-medium">
            Featured
          </div>
        )}
        
        <CardContent className="p-6">
          {/* Provider Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={bid.provider.avatar} alt={bid.provider.name} />
                  <AvatarFallback className="bg-primary-50 text-primary-600 font-semibold">
                    {getInitials(bid.provider.name)}
                  </AvatarFallback>
                </Avatar>
                {bid.provider.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-success text-white rounded-full p-1">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-text-primary hover:text-primary-600 cursor-pointer"
                      onClick={() => onViewProfile(bid.provider.id)}>
                    {bid.provider.name}
                  </h3>
                  {bid.provider.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1">
                    <StarRating rating={bid.provider.rating} size="sm" />
                    <span className="text-sm text-text-secondary">
                      {bid.provider.rating.toFixed(1)} ({bid.provider.reviewCount})
                    </span>
                  </div>
                  <span className="text-text-secondary text-sm">•</span>
                  <span className="text-sm text-text-secondary">
                    {bid.provider.completedTasks} tasks completed
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bid Amount */}
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                ${bid.amount.toLocaleString()}
              </div>
              <div className="text-sm text-text-secondary">
                {bid.type === 'fixed' ? 'Fixed price' : 'Per hour'}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {formatTimeAgo(bid.createdAt)}
              </div>
            </div>
          </div>
          
          {/* Bid Message */}
          <div className="mb-4">
            <p className="text-text-primary leading-relaxed">
              {displayMessage}
            </p>
            {shouldTruncateMessage && (
              <button
                type="button"
                onClick={() => setShowFullMessage(!showFullMessage)}
                className="text-primary-600 text-sm hover:underline mt-1 font-medium"
              >
                {showFullMessage ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          
          {/* Additional Details */}
          {(bid.estimatedDuration || bid.proposedStartDate) && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-text-secondary">
              {bid.estimatedDuration && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {bid.estimatedDuration}</span>
                </div>
              )}
              {bid.proposedStartDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Can start: {bid.proposedStartDate}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Provider Stats */}
          <div className="grid grid-cols-3 gap-4 py-3 mb-4 bg-surface rounded-lg px-3">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold text-text-primary">
                  {bid.provider.completionRate}%
                </span>
              </div>
              <span className="text-xs text-text-secondary">Completion rate</span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Clock className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-text-primary">
                  {bid.provider.responseTime}
                </span>
              </div>
              <span className="text-xs text-text-secondary">Response time</span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <MapPin className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-text-primary">
                  {bid.distance}
                </span>
              </div>
              <span className="text-xs text-text-secondary">Distance</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={() => onAccept(bid.id)}
              className="flex-1"
              size="md"
            >
              Accept Bid
            </Button>
            <Button 
              variant="secondary"
              onClick={() => onMessage(bid.provider.id)}
              size="md"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message</span>
            </Button>
            <Button 
              variant="ghost"
              onClick={() => onViewProfile(bid.provider.id)}
              size="md"
            >
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced Bid List Component
interface BidListProps {
  bids: Bid[];
  onAcceptBid: (bidId: string) => void;
  onMessageProvider: (providerId: string) => void;
  onViewProfile: (providerId: string) => void;
  isLoading?: boolean;
}

export const BidList: React.FC<BidListProps> = ({
  bids,
  onAcceptBid,
  onMessageProvider,
  onViewProfile,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-surface rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface rounded w-32 mb-2"></div>
                  <div className="h-3 bg-surface rounded w-24"></div>
                </div>
                <div className="h-8 bg-surface rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-surface rounded w-full"></div>
                <div className="h-4 bg-surface rounded w-3/4"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-text-secondary">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
          <p>Your task is live! Skilled taskers will start bidding soon.</p>
        </div>
      </Card>
    );
  }

  // Sort bids: featured first, then by rating, then by amount
  const sortedBids = [...bids].sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;
    if (a.provider.rating !== b.provider.rating) return b.provider.rating - a.provider.rating;
    return a.amount - b.amount;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {bids.length} Bid{bids.length !== 1 ? 's' : ''} Received
        </h2>
        <div className="text-sm text-text-secondary">
          Sorted by rating and price
        </div>
      </div>
      
      {sortedBids.map((bid) => (
        <BidCard
          key={bid.id}
          bid={bid}
          onAccept={onAcceptBid}
          onMessage={onMessageProvider}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
};
