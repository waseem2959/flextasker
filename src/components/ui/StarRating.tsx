import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 4,
  className,
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      {Array(totalStars).fill(0).map((_, i) => (
        <Star
          key={`star-${i}`}
          className={cn(
            `h-${size} w-${size}`,
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};