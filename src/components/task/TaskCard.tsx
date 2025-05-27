import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import TaskStatusBadge from './TaskStatusBadge';

interface TaskCardProps {
  task: Task;
}

/**
 * Helper function to truncate text for display
 */
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

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
    if (typeof task.budget !== 'number') return '$0.00';
    const formattedValue = task.budget.toFixed(2);
    const suffix = task.budgetType === 'HOURLY' ? '/hr' : '';
    return `$${formattedValue}${suffix}`;
  };
  
  // Get display data
  const taskImages = getTaskImages();
  const taskAddress = typeof task.location === 'string' ? task.location : 'No location provided';
  
  // Format the created date to a human-readable format
  const formattedDate = task.createdAt ? 
    formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : 
    'Recently';

  return (
    <Card className="task-card h-full">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={taskImages[0]} 
          alt={task.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCategoryDefaultImage(task.category);
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white text-black">
            {task.bidCount || 0} {task.bidCount === 1 ? 'Bid' : 'Bids'}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="bg-gray-100">
            {task.category.name}
          </Badge>
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <Link to={`/tasks/${task.id}`} className="block hover:no-underline">
          <h3 className="text-lg font-semibold text-gray-900 mt-1 hover:text-blue-600 transition-colors">
            {task.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 my-2">
          {truncateText(task.description, 100)}
        </p>
        
        <div className="flex items-center gap-2 mb-2">
          <TaskStatusBadge status={task.status} />
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className={task.bidCount > 0 ? "bg-green-50 text-green-700" : "bg-gray-100"}>
            {task.bidCount > 0 ? "Active Bids" : "No Bids Yet"}
          </Badge>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm">
          <MapPin className="h-4 w-4 mr-1" />
          {taskAddress}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Budget:</p>
          <p className="text-sm font-medium mt-1">
            {formatBudget()}
          </p>
        </div>
        
        <Button variant="outline" className="ml-auto" asChild>
          <Link to={`/tasks/${task.id}`}>
            View
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};