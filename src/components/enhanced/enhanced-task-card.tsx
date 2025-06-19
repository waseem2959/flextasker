/**
 * Enhanced Task Card Component
 * 
 * Improved task card with better information hierarchy, quick actions,
 * visual indicators, and responsive design.
 */

import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  Star, 
  Eye,
  MessageSquare,
  Zap,
  Calendar,
  Tag,
  TrendingUp,
  Shield,
  Award,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import QuickActions from './quick-actions';
import { TaskImage } from './responsive-image';
import { formatDistanceToNow, isAfter, differenceInHours } from 'date-fns';

interface TaskOwner {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isPremium?: boolean;
}

interface TaskCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  deadline?: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  isRemote: boolean;
  skills: string[];
  category: TaskCategory;
  owner: TaskOwner;
  bidCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'posted' | 'in_progress' | 'completed' | 'cancelled';
  isUrgent: boolean;
  isFeatured: boolean;
  images?: string[];
  attachments?: Array<{ name: string; url: string; type: string }>;
  isBookmarked?: boolean;
  isWatching?: boolean;
}

interface EnhancedTaskCardProps {
  task: Task;
  variant?: 'default' | 'compact' | 'featured' | 'grid';
  showQuickActions?: boolean;
  showOwnerInfo?: boolean;
  showDescription?: boolean;
  showImages?: boolean;
  maxDescriptionLength?: number;
  className?: string;
  onBookmark?: (taskId: string, bookmarked: boolean) => void;
  onWatch?: (taskId: string, watching: boolean) => void;
  onQuickBid?: (taskId: string, amount: number, message?: string) => void;
  onShare?: (taskId: string, method: string) => void;
  onClick?: (task: Task) => void;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  variant = 'default',
  showQuickActions = true,
  showOwnerInfo = true,
  showDescription = true,
  showImages = true,
  maxDescriptionLength = 150,
  className = '',
  onBookmark,
  onWatch,
  onQuickBid,
  onShare,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);

  // Calculate urgency and time-related info
  const isNewTask = differenceInHours(new Date(), new Date(task.createdAt)) <= 24;
  const isExpiringSoon = task.deadline 
    ? differenceInHours(new Date(task.deadline), new Date()) <= 48
    : false;
  const isExpired = task.deadline 
    ? isAfter(new Date(), new Date(task.deadline))
    : false;

  // Format budget display
  const formatBudget = () => {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(task.budget);

    return task.budgetType === 'hourly' ? `${amount}/hr` : amount;
  };

  // Format description with truncation
  const formatDescription = () => {
    if (!showDescription) return '';
    
    const description = task.description || '';
    if (description.length <= maxDescriptionLength) {
      return description;
    }
    
    return `${description.substring(0, maxDescriptionLength)}...`;
  };

  // Handle card click
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    
    if (onClick) {
      onClick(task);
    }
  };

  // Render visual indicators
  const renderIndicators = () => (
    <div className="flex items-center gap-1 mb-2">
      {task.isFeatured && (
        <Badge variant="default" className="bg-yellow-500 text-white text-xs">
          <Star className="w-3 h-3 mr-1" />
          Featured
        </Badge>
      )}
      {task.isUrgent && (
        <Badge variant="destructive" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Urgent
        </Badge>
      )}
      {isNewTask && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
          New
        </Badge>
      )}
      {isExpiringSoon && !isExpired && (
        <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Expires Soon
        </Badge>
      )}
      {task.owner.isVerified && (
        <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )}
    </div>
  );

  // Render task stats
  const renderStats = () => (
    <div className="flex items-center gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-1">
        <MessageSquare className="w-4 h-4" />
        <span>{task.bidCount} bid{task.bidCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        <span>{task.viewCount} view{task.viewCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
      </div>
    </div>
  );

  // Render owner info
  const renderOwnerInfo = () => {
    if (!showOwnerInfo) return null;

    return (
      <div className="flex items-center justify-between">
        <Link 
          to={`/users/${task.owner.id}`}
          className="flex items-center gap-3 hover:opacity-75 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <img 
              src={task.owner.avatar || '/default-avatar.png'} 
              alt={task.owner.name}
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{task.owner.name}</span>
              {task.owner.isVerified && (
                <Shield className="w-4 h-4 text-blue-500" />
              )}
              {task.owner.isPremium && (
                <Award className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="w-3 h-3 fill-current text-yellow-400" />
              <span>{task.owner.rating.toFixed(1)}</span>
              <span>({task.owner.reviewCount} reviews)</span>
            </div>
          </div>
        </Link>

        {/* Budget Display */}
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {formatBudget()}
          </div>
          {task.budgetType === 'fixed' && (
            <div className="text-xs text-gray-500">Fixed Price</div>
          )}
        </div>
      </div>
    );
  };

  // Render deadline info
  const renderDeadline = () => {
    if (!task.deadline) return null;

    const timeUntilDeadline = formatDistanceToNow(new Date(task.deadline), { addSuffix: true });
    const isUrgent = isExpiringSoon || isExpired;

    return (
      <div className={`flex items-center gap-1 text-sm ${
        isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
      }`}>
        <Calendar className="w-4 h-4" />
        <span>
          {isExpired ? 'Expired' : 'Due'} {timeUntilDeadline}
        </span>
      </div>
    );
  };

  // Render location info
  const renderLocation = () => {
    if (!task.location && !task.isRemote) return null;

    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>
          {task.isRemote ? 'Remote' : task.location?.address}
        </span>
      </div>
    );
  };

  // Render skills tags
  const renderSkills = () => {
    if (!task.skills || task.skills.length === 0) return null;

    const displaySkills = task.skills.slice(0, 3);
    const remainingSkills = task.skills.length - displaySkills.length;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displaySkills.map((skill, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {skill}
          </Badge>
        ))}
        {remainingSkills > 0 && (
          <Badge variant="outline" className="text-xs text-gray-500">
            +{remainingSkills} more
          </Badge>
        )}
      </div>
    );
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {renderIndicators()}
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {task.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Badge variant="outline" className="text-xs">
                  {task.category.name}
                </Badge>
                {renderLocation()}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-600">{formatBudget()}</span>
                <span className="text-xs text-gray-500">{task.bidCount} bids</span>
              </div>
            </div>
            {showQuickActions && (
              <QuickActions
                taskId={task.id}
                title={task.title}
                budget={task.budget}
                isBookmarked={task.isBookmarked}
                isWatching={task.isWatching}
                urgentDeadline={isExpiringSoon}
                variant="compact"
                onBookmark={onBookmark}
                onWatch={onWatch}
                onQuickBid={onQuickBid}
                onShare={onShare}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <Card className={`border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-lg transition-all cursor-pointer ${className}`} onClick={handleCardClick}>
        {showImages && task.images && task.images.length > 0 && (
          <div className="relative">
            <TaskImage
              src={task.images[0]}
              alt={task.title}
              className="h-48"
            />
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          </div>
        )}
        
        <CardHeader className="pb-3">
          {renderIndicators()}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-lg line-clamp-2 flex-1">
              {task.title}
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatBudget()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {showDescription && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {formatDescription()}
            </p>
          )}
          
          <div className="space-y-3">
            {renderSkills()}
            <div className="flex items-center justify-between text-sm">
              {renderLocation()}
              {renderDeadline()}
            </div>
            {renderStats()}
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t">
          <div className="w-full space-y-4">
            {renderOwnerInfo()}
            {showQuickActions && (
              <QuickActions
                taskId={task.id}
                title={task.title}
                budget={task.budget}
                isBookmarked={task.isBookmarked}
                isWatching={task.isWatching}
                urgentDeadline={isExpiringSoon}
                variant="card"
                onBookmark={onBookmark}
                onWatch={onWatch}
                onQuickBid={onQuickBid}
                onShare={onShare}
              />
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={handleCardClick}>
      {showImages && task.images && task.images.length > 0 && (
        <div className="relative">
          <TaskImage
            src={task.images[0]}
            alt={task.title}
            className="h-40"
          />
          {(task.isFeatured || task.isUrgent) && (
            <div className="absolute top-2 left-2">
              {task.isFeatured && (
                <Badge className="bg-yellow-500 text-white mr-1">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {task.isUrgent && (
                <Badge variant="destructive">
                  <Zap className="w-3 h-3 mr-1" />
                  Urgent
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-3">
        {renderIndicators()}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {task.category.name}
              </Badge>
              {renderLocation()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">
              {formatBudget()}
            </div>
            {task.budgetType === 'hourly' && (
              <div className="text-xs text-gray-500">per hour</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {showDescription && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {formatDescription()}
          </p>
        )}
        
        <div className="space-y-3">
          {renderSkills()}
          <div className="flex items-center justify-between">
            {renderDeadline()}
            {renderStats()}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="w-full space-y-4">
          {renderOwnerInfo()}
          {showQuickActions && (
            <QuickActions
              taskId={task.id}
              title={task.title}
              budget={task.budget}
              isBookmarked={task.isBookmarked}
              isWatching={task.isWatching}
              urgentDeadline={isExpiringSoon}
              variant="card"
              onBookmark={onBookmark}
              onWatch={onWatch}
              onQuickBid={onQuickBid}
              onShare={onShare}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedTaskCard;