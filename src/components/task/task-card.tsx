import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { truncateText } from '@/lib/utils';
import { BudgetType, Task } from '@/types';
import { getLocationDisplayText } from '@/utils/task-utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskStatusBadge from './task-status-badge';

interface TaskCardProps {
  task: Task;
}

/**
 * Helper function to get default image for a category
 */
const getCategoryDefaultImage = (category: Task['category']): string => {
  const imageMap: Record<string, string> = {
    'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
    'moving': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60',
    'handyman': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
    'delivery': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop&q=60',
    'general': 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=500&auto=format&fit=crop&q=60'
  };
  
  // Safely access the category name
  const categoryName = typeof category === 'object' && category !== null ? 
    category.name : 'general';
  const normalizedKey = categoryName.toLowerCase();
  
  return imageMap[normalizedKey] ?? imageMap.general;
};

/**
 * Format task budget with correct currency and type designation
 */
const formatTaskBudget = (budget: number | { amount?: number; type?: string } | undefined, budgetType?: string): string => {
  if (!budget) return '$0.00';
  
  // Handle object-style budget
  if (typeof budget === 'object' && budget !== null) {
    const amount = budget.amount?.toFixed(2) ?? '0.00';
    const type = budget.type ?? budgetType;
    
    let suffix = '';
    if (type === BudgetType.HOURLY) {
      suffix = '/hr';
    } else if (type === BudgetType.NEGOTIABLE) {
      suffix = ' (Negotiable)';
    }
    
    return `$${amount}${suffix}`;
  }
  
  // Handle number budget
  if (typeof budget === 'number') {
    const formattedValue = budget.toFixed(2);
    const suffix = budgetType === BudgetType.HOURLY ? '/hr' : '';
    return `$${formattedValue}${suffix}`;
  }
  
  return '$0.00';
};

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
    return [getCategoryDefaultImage(task.category)];
  };
  
  // Format the budget to display it with proper formatting
  const formatBudget = (): string => {
    return formatTaskBudget(task.budget, task.budgetType);
  };
  
  // Get display data
  const taskImages = getTaskImages();
  const taskAddress = getLocationDisplayText(task.location);
  
  // Format the created date to a human-readable format
  const formattedDate = task.createdAt ? 
    formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : 
    'Recently';

  return (
    <Card className="task-card h-full flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={taskImages[0]} 
          alt={task.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCategoryDefaultImage(task.category);
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="font-medium">
            {task.bidCount ?? 0} {task.bidCount === 1 ? 'Bid' : 'Bids'}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="accent">
            {task.category.name}
          </Badge>
          <div className="text-sm text-[hsl(220,14%,46%)] flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <Link to={`/tasks/${task.id}`} className="block hover:no-underline">
          <h3 className="font-display text-lg font-semibold text-[hsl(206,33%,16%)] mt-1 hover:text-[hsl(185,76%,35%)] transition-colors">
            {task.title}
          </h3>
        </Link>
        
        <p className="text-sm text-[hsl(220,14%,46%)] my-3">
          {truncateText(task.description, 100)}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <TaskStatusBadge status={task.status} />
        </div>
        
        <div className="mt-3">
          <Badge variant={(task.bidCount ?? 0) > 0 ? "success" : "secondary"}>
            {(task.bidCount ?? 0) > 0 ? "Active Bids" : "No Bids Yet"}
          </Badge>
        </div>
        
        <div className="flex items-center text-[hsl(220,14%,46%)] text-sm mt-3">
          <MapPin className="h-4 w-4 mr-1" />
          {taskAddress}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-[hsl(220,13%,91%)] flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(220,14%,46%)]">Budget:</p>
          <p className="text-base font-medium text-[hsl(185,76%,35%)] mt-1">
            {formatBudget()}
          </p>
        </div>
        
        <Button variant="ghost" className="ml-auto" asChild>
          <Link to={`/tasks/${task.id}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};