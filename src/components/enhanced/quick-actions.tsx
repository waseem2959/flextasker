/**
 * Quick Actions Component
 * 
 * Provides quick action buttons for task cards including save/bookmark,
 * share, quick bid, and other contextual actions.
 */

import React, { useState, useCallback } from 'react';
import { 
  Heart, 
  Share2, 
  Zap, 
  Eye,
  Clock,
  Flag,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';

interface QuickActionsProps {
  taskId: string;
  title: string;
  budget: number;
  isBookmarked?: boolean;
  isWatching?: boolean;
  canBid?: boolean;
  canApply?: boolean;
  urgentDeadline?: boolean;
  className?: string;
  variant?: 'card' | 'detail' | 'compact';
  onBookmark?: (taskId: string, bookmarked: boolean) => void;
  onShare?: (taskId: string, method: string) => void;
  onQuickBid?: (taskId: string, amount: number, message?: string) => void;
  onWatch?: (taskId: string, watching: boolean) => void;
  onReport?: (taskId: string, reason: string) => void;
  onApply?: (taskId: string) => void;
}

interface QuickBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  suggestedBudget: number;
  onSubmit: (amount: number, message: string) => void;
}

const QuickBidModal: React.FC<QuickBidModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  suggestedBudget,
  onSubmit
}) => {
  const [bidAmount, setBidAmount] = useState(suggestedBudget);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bidAmount < 10) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(bidAmount, message);
      onClose();
      setBidAmount(suggestedBudget);
      setMessage('');
    } catch (error) {
      console.error('Quick bid failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Bid</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Task
            </label>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {taskTitle}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Your Bid Amount ($)
            </label>
            <Input
              type="number"
              min="10"
              step="1"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              placeholder="Enter your bid amount"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Suggested: ${suggestedBudget}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Message (Optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Briefly explain why you're the right person for this task..."
              className="w-full"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || bidAmount < 10}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const QuickActions: React.FC<QuickActionsProps> = ({
  taskId,
  title,
  budget,
  isBookmarked = false,
  isWatching = false,
  canBid = true,
  canApply = false,
  urgentDeadline = false,
  className = '',
  variant = 'card',
  onBookmark,
  onShare,
  onQuickBid,
  onWatch,
  onReport,
  onApply
}) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [watching, setWatching] = useState(isWatching);
  const [showQuickBid, setShowQuickBid] = useState(false);
  const { toast } = useToast();

  const handleBookmark = useCallback(async () => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    
    try {
      await onBookmark?.(taskId, newBookmarked);
      toast({
        title: newBookmarked ? 'Task Bookmarked' : 'Bookmark Removed',
        description: newBookmarked 
          ? 'Task saved to your bookmarks' 
          : 'Task removed from bookmarks',
        duration: 2000
      });
    } catch (error) {
      setBookmarked(!newBookmarked);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive'
      });
    }
  }, [bookmarked, taskId, onBookmark, toast]);

  const handleWatch = useCallback(async () => {
    const newWatching = !watching;
    setWatching(newWatching);
    
    try {
      await onWatch?.(taskId, newWatching);
      toast({
        title: newWatching ? 'Now Watching' : 'Stopped Watching',
        description: newWatching 
          ? 'You\'ll get notifications about updates' 
          : 'You won\'t receive notifications anymore',
        duration: 2000
      });
    } catch (error) {
      setWatching(!newWatching);
      toast({
        title: 'Error',
        description: 'Failed to update watch status',
        variant: 'destructive'
      });
    }
  }, [watching, taskId, onWatch, toast]);

  const handleShare = useCallback(async (method: string) => {
    try {
      if (method === 'copy') {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Task link copied to clipboard',
          duration: 2000
        });
      } else if (method === 'native' && navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this task: ${title}`,
          url: window.location.href
        });
      }
      
      onShare?.(taskId, method);
    } catch (error) {
      if (method !== 'native') {
        toast({
          title: 'Error',
          description: 'Failed to share task',
          variant: 'destructive'
        });
      }
    }
  }, [taskId, title, onShare, toast]);

  const handleQuickBid = useCallback(async (amount: number, message: string) => {
    try {
      await onQuickBid?.(taskId, amount, message);
      toast({
        title: 'Bid Submitted',
        description: `Your bid of $${amount} has been submitted`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Bid Failed',
        description: 'Failed to submit your bid. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  }, [taskId, onQuickBid, toast]);

  const handleApply = useCallback(async () => {
    try {
      await onApply?.(taskId);
      toast({
        title: 'Application Submitted',
        description: 'Your application has been sent to the task owner',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Application Failed',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    }
  }, [taskId, onApply, toast]);

  const handleReport = useCallback(async (reason: string) => {
    try {
      await onReport?.(taskId, reason);
      toast({
        title: 'Report Submitted',
        description: 'Thank you for reporting this task. We\'ll review it shortly.',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Report Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      });
    }
  }, [taskId, onReport, toast]);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={`p-1 h-7 w-7 ${bookmarked ? 'text-red-500' : 'text-gray-400'}`}
        >
          <Heart className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-gray-400">
              <Share2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleShare('copy')}>
              Copy Link
            </DropdownMenuItem>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <DropdownMenuItem onClick={() => handleShare('native')}>
                Share
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1 h-7 w-7 text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleWatch}>
              <Eye className="w-4 h-4 mr-2" />
              {watching ? 'Stop Watching' : 'Watch Task'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleReport('inappropriate')}
              className="text-red-600"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Primary Actions */}
        <div className="flex gap-3">
          {canBid && (
            <Button
              onClick={() => setShowQuickBid(true)}
              className="flex-1"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Quick Bid
              {urgentDeadline && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Urgent
                </Badge>
              )}
            </Button>
          )}
          
          {canApply && (
            <Button
              onClick={handleApply}
              className="flex-1"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Now
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBookmark}
            className={bookmarked ? 'text-red-500 border-red-200' : ''}
          >
            <Heart className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
          
          <Button variant="outline" onClick={handleWatch}>
            <Eye className="w-4 h-4 mr-2" />
            {watching ? 'Watching' : 'Watch'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                Copy Link
              </DropdownMenuItem>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <DropdownMenuItem onClick={() => handleShare('native')}>
                  Native Share
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleShare('twitter')}>
                Share on Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                Share on LinkedIn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <QuickBidModal
          isOpen={showQuickBid}
          onClose={() => setShowQuickBid(false)}
          taskTitle={title}
          suggestedBudget={Math.floor(budget * 0.8)}
          onSubmit={handleQuickBid}
        />
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={`${bookmarked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
        >
          <Heart className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWatch}
          className={`${watching ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-500`}
        >
          <Eye className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <Share2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleShare('copy')}>
              Copy Link
            </DropdownMenuItem>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <DropdownMenuItem onClick={() => handleShare('native')}>
                Share
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {urgentDeadline && (
          <Badge variant="destructive" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        )}
        
        {canBid && (
          <Button
            size="sm"
            onClick={() => setShowQuickBid(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-1" />
            Quick Bid
          </Button>
        )}
        
        {canApply && (
          <Button
            size="sm"
            onClick={handleApply}
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Apply
          </Button>
        )}
      </div>

      <QuickBidModal
        isOpen={showQuickBid}
        onClose={() => setShowQuickBid(false)}
        taskTitle={title}
        suggestedBudget={Math.floor(budget * 0.8)}
        onSubmit={handleQuickBid}
      />
    </div>
  );
};

export default QuickActions;