import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { OptimizedTaskImage } from '@/components/ui/enhanced-image';
import { HoverLift, PulseIndicator } from '@/components/ui/micro-interactions';
import { cn, truncate } from '@/lib/utils';
import { Task } from '@/types';
import { formatTaskBudget } from '@/utils/budget-utils';
import { getCategoryDefaultImage } from '@/utils/category-utils';
import { getLocationDisplayText } from '@/utils/task-utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskStatusBadge from './task-status-badge';

interface TaskCardProps {
  task: Task;
}

// Removed duplicate helper functions - now using centralized utilities

/**
 * TaskCard component for displaying a task in a card format
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  // Get task images - either from task or default for the category
  const getTaskImages = (): string[] => {
    const taskWithPossibleImages = task as Task & { images?: string[] };
    if (taskWithPossibleImages.images && taskWithPossibleImages.images.length > 0) {
      return taskWithPossibleImages.images;
    }
    return [getCategoryDefaultImage(task.category.name)];
  };
  
  // Format the budget to display it with proper formatting
  const formattedBudget = formatTaskBudget(task.budget, task.budgetType);
  
  // Get display data
  const taskImages = getTaskImages();
  const taskAddress = getLocationDisplayText(task.location);
  
  // Format the created date to a human-readable format
  const formattedDate = task.createdAt ?
    formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) :
    'Recently';

  // Determine if task is new (created within last 24 hours)
  const isNewTask = task.createdAt ?
    new Date().getTime() - new Date(task.createdAt).getTime() < 24 * 60 * 60 * 1000 :
    false;

  return (
    <HoverLift className="h-full">
      <Card className="task-card h-full flex flex-col group cursor-pointer bg-neutral-0 border border-neutral-200">
        <div className="relative h-40 overflow-hidden rounded-t-xl">
        <OptimizedTaskImage
          src={taskImages[0] || getCategoryDefaultImage(typeof task.category === 'object' ? task.category.name : task.category)}
          alt={task.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-110"
          aspectRatio={16/9}
        />
        {/* Enhanced gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Enhanced bid indicators with visual hierarchy */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "font-medium bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200",
              (task.bidCount ?? 0) > 0
                ? "text-primary-700 border-primary-200 bg-primary-50/90"
                : "text-neutral-600 border-neutral-200"
            )}
          >
            {task.bidCount ?? 0} {task.bidCount === 1 ? 'Bid' : 'Bids'}
          </Badge>

          {/* Urgency indicator */}
          {task.isUrgent && (
            <div className="flex items-center gap-1">
              <PulseIndicator color="error" size="sm" />
              <Badge
                variant="destructive"
                className="font-medium bg-red-500/90 text-white border-red-400 shadow-sm"
              >
                Urgent
              </Badge>
            </div>
          )}

          {/* New task indicator */}
          {isNewTask && (
            <div className="flex items-center gap-1">
              <PulseIndicator color="success" size="sm" />
              <Badge
                variant="secondary"
                className="font-medium bg-green-500/90 text-white border-green-400 shadow-sm"
              >
                New
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-6 flex-grow">
        {/* Enhanced header with better spacing and typography */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            variant="accent"
            className="bg-primary-50 text-primary-800 border-primary-200 font-medium px-3 py-1"
          >
            {task.category.name}
          </Badge>
          <div className="text-sm text-neutral-600 flex items-center font-body">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
            {formattedDate}
          </div>
        </div>

        {/* Enhanced title with project-map typography */}
        <Link to={`/tasks/${task.id}`} className="block hover:no-underline group">
          <h3 className="font-heading text-xl font-semibold text-neutral-900 leading-tight mb-3 group-hover:text-primary-700 transition-colors duration-200 line-clamp-2">
            {task.title}
          </h3>
        </Link>

        {/* Enhanced description with better typography */}
        <p className="text-sm text-neutral-600 font-body leading-relaxed mb-4 line-clamp-3">
          {truncate(task.description, 120)}
        </p>

        {/* Status and activity indicators */}
        <div className="flex items-center justify-between mb-4">
          <TaskStatusBadge status={task.status} />
          <Badge
            variant={(task.bidCount ?? 0) > 0 ? "success" : "secondary"}
            className={`font-medium ${
              (task.bidCount ?? 0) > 0
                ? "bg-primary-100 text-primary-800 border-primary-200"
                : "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}
          >
            {(task.bidCount ?? 0) > 0 ? "Active Bids" : "No Bids Yet"}
          </Badge>
        </div>

        {/* Enhanced location with better visual hierarchy */}
        <div className="flex items-center text-neutral-600 text-sm font-body">
          <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
          <span className="truncate">{taskAddress}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
        {/* Enhanced budget display with better visual hierarchy */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1 font-body">Budget</p>
          <p className="text-xl font-bold text-primary-700 font-heading">
            {formattedBudget}
          </p>
        </div>

        {/* Enhanced CTA button with project-map styling */}
        <Button
          variant="ghost"
          className="ml-auto text-primary-700 hover:text-primary-800 hover:bg-primary-50 font-medium transition-all duration-200 group"
          asChild
        >
          <Link to={`/tasks/${task.id}`} className="flex items-center">
            View Details
            <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
      </Card>
    </HoverLift>
  );
};