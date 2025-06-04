import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import React from 'react';

// Export the Star component so it can be imported from this file
export { Star };

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 'md',
  className,
  showValue = false,
}) => {
  const getStarFill = (starIndex: number) => {
    if (starIndex <= rating) {
      return 'text-warning fill-warning';
    } else if (starIndex - 0.5 <= rating) {
      return 'text-warning fill-warning/50';
    } else {
      return 'text-border fill-none';
    }
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="flex items-center space-x-0.5">
        {Array(totalStars).fill(0).map((_, i) => {
          const starIndex = i + 1;
          return (
            <Star
              key={`star-rating-${rating}-${totalStars}-${i}`}
              className={cn(
                sizeClasses[size],
                getStarFill(starIndex),
                'transition-colors duration-150'
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-text-secondary ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};