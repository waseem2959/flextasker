import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
}

// Enhanced interfaces that bridge the gap between your current Task type and UI needs
interface EnhancedTaskData {
  images: string[];
  bids: BidSummary[];
  location: LocationDisplay;
  budget: BudgetRange;
  category: CategoryDisplay;
}

interface BidSummary {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
}

interface LocationDisplay {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

interface CategoryDisplay {
  id: string;
  name: string;
  color?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const enhanceTaskData = (baseTask: Task): EnhancedTaskData => {
    return {
      images: generateTaskImages(baseTask),
      bids: generateBidSummary(baseTask),
      location: parseLocationData(baseTask.location),
      budget: generateBudgetRange(baseTask.budget),
      category: normalizeCategoryData(baseTask.category)
    };
  };

  const generateTaskImages = (task: Task): string[] => {
    const taskWithPossibleImages = task as Task & { images?: string[] };
    
    if (taskWithPossibleImages.images && taskWithPossibleImages.images.length > 0) {
      return taskWithPossibleImages.images;
    }
    
    const defaultImages = getCategoryDefaultImage(task.category);
    return [defaultImages];
  };

  // EDUCATIONAL FIX #1: Proper Type Guards Instead of 'any'
  // The original code used 'any' which defeats TypeScript's purpose
  // This approach uses type guards - functions that help TypeScript understand types
  const getCategoryDefaultImage = (category: Task['category']): string => {
    const imageMap: Record<string, string> = {
      'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
      'moving': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60',
      'handyman': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60',
      'delivery': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop&q=60',
      'general': 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=500&auto=format&fit=crop&q=60'
    };
    
    // TYPE GUARD PATTERN: Instead of using 'any', we create helper functions
    // that TypeScript can understand and verify
    const extractCategoryString = (cat: Task['category']): string => {
      // Early return pattern - handle the simplest cases first
      if (!cat) return 'general';
      
      // Type narrowing - TypeScript now knows cat is not null/undefined
      if (typeof cat === 'string') return cat;
      
      // Object case with proper type checking
      // We use 'in' operator for type narrowing instead of 'any'
      if (typeof cat === 'object' && cat !== null && 'name' in cat) {
        // TypeScript now knows this object has a 'name' property
        const nameValue = cat.name;
        // Ensure the name is actually a string before using it
        return typeof nameValue === 'string' ? nameValue : 'general';
      }
      
      return 'general';
    };
    
    const categoryString = extractCategoryString(category);
    const normalizedKey = categoryString.toLowerCase();
    
    return imageMap[normalizedKey] ?? imageMap.general;
  };

  const generateBidSummary = (task: Task): BidSummary[] => {
    const taskWithBidInfo = task as Task & { 
      bidCount?: number;
      bids?: BidSummary[];
    };
    
    if (taskWithBidInfo.bids) {
      return taskWithBidInfo.bids;
    }
    
    if (taskWithBidInfo.bidCount && taskWithBidInfo.bidCount > 0) {
      return Array.from({ length: taskWithBidInfo.bidCount }, (_, index) => ({
        id: `bid-${task.id}-${index}`,
        amount: task.budget + (index * 100),
        status: 'pending' as const
      }));
    }
    
    return [];
  };

  const parseLocationData = (location: Task['location']): LocationDisplay => {
    if (!location) {
      return { address: 'Location not specified' };
    }
    
    if (typeof location === 'object' && 'address' in location) {
      return location as LocationDisplay;
    }
    
    if (typeof location === 'string') {
      return { address: location };
    }
    
    return { address: 'Location not specified' };
  };

  const generateBudgetRange = (budget: Task['budget']): BudgetRange => {
    if (typeof budget !== 'number' || !budget) {
      return { min: 0, max: 0, currency: '₹' };
    }
    
    if (typeof budget === 'object' && budget !== null && 'min' in budget && 'max' in budget) {
      return budget as BudgetRange;
    }
    
    return {
      min: Math.round(budget * 0.8),
      max: Math.round(budget * 1.2),
      currency: '₹'
    };
  };

  // EDUCATIONAL FIX #2: The "Type Extraction" Pattern
  // Instead of fighting TypeScript's type narrowing, we'll extract the values
  // we need upfront and work with simple, known types. This pattern is much
  // more reliable and easier to understand.
  const normalizeCategoryData = (category: Task['category']): CategoryDisplay => {
    // STEP 1: Extract the category name as a string, no matter what format it comes in
    // This function's job is ONLY to get us a string - nothing else
    const extractCategoryName = (): string => {
      // Handle the null/undefined case immediately
      if (category == null) return 'General';
      
      // Handle string case - the simplest scenario
      if (typeof category === 'string') return category;
      
      // Handle object case - extract name property safely
      // We use a more explicit approach that TypeScript can easily follow
      try {
        if (typeof category === 'object') {
          // Use bracket notation to avoid TypeScript confusion
          const possibleName = (category as Record<string, unknown>)['name'];
          if (typeof possibleName === 'string') return possibleName;
        }
      } catch {
        // If anything goes wrong, fall back gracefully
      }
      
      // Ultimate fallback
      return 'General';
    };
    
    // STEP 2: Extract the category ID as a string (if available)
    const extractCategoryId = (): string | undefined => {
      if (category == null || typeof category !== 'object') return undefined;
      
      try {
        const possibleId = (category as Record<string, unknown>)['id'];
        return typeof possibleId === 'string' ? possibleId : undefined;
      } catch {
        return undefined;
      }
    };
    
    // STEP 3: Extract the category color as a string (if available)
    const extractCategoryColor = (): string | undefined => {
      if (category == null || typeof category !== 'object') return undefined;
      
      try {
        const possibleColor = (category as Record<string, unknown>)['color'];
        return typeof possibleColor === 'string' ? possibleColor : undefined;
      } catch {
        return undefined;
      }
    };
    
    // STEP 4: Now we work with simple string values that TypeScript fully understands
    const categoryName = extractCategoryName();
    const categoryId = extractCategoryId();
    const categoryColor = extractCategoryColor();
    
    // At this point, categoryName is guaranteed to be a string, so toLowerCase() will work
    const generatedId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    return {
      id: categoryId ?? generatedId,
      name: categoryName,
      color: categoryColor
    };
  };

  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Transform the task data using our enhancement logic
  const enhancedTask = enhanceTaskData(task);
  const { id, title, description, createdAt } = task;
  const formattedTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Card className="task-card h-full">
      <div className="task-card-image">
        <img 
          src={enhancedTask.images[0]} 
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCategoryDefaultImage(task.category);
          }}
        />
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="bg-gray-100">
            {enhancedTask.category.name}
          </Badge>
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formattedTime}
          </div>
        </div>
        
        <Link to={`/tasks/${id}`}>
          <h3 className="font-semibold text-lg hover:text-flextasker-600 transition-colors mb-2">
            {title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3">
          {truncateText(description, 100)}
        </p>
        
        <div className="flex items-center text-gray-500 text-sm">
          <MapPin className="h-4 w-4 mr-1" />
          {enhancedTask.location.address}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Budget:</p>
          <p className="font-semibold text-gray-900">
            {enhancedTask.budget.currency}{enhancedTask.budget.min.toLocaleString()} - {enhancedTask.budget.currency}{enhancedTask.budget.max.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center">
          <div className="mr-4 text-right">
            <p className="text-sm text-gray-500">Bids:</p>
            <p className="font-semibold text-gray-900">
              {enhancedTask.bids.length}
            </p>
          </div>
          
          <Button asChild className="bid-button">
            <Link to={`/tasks/${id}`} className="flex items-center">
              View <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};