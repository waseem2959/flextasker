import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types/enums';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { TaskCard } from './TaskCard';

// EDUCATIONAL CONCEPT #1: Creating Missing Type Definitions
// When you encounter missing types, it's often because your code has evolved
// beyond your type definitions. The solution is to define types that match
// what your code actually needs to do.

/**
 * Enhanced task filter parameters with proper enum typing
 */
interface TaskFilterParams {
  search?: string;
  category?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  sort?: 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'bids-high' | 'bids-low';
  location?: string;
  budgetRange?: {
    min?: number;
    max?: number;
  };
  ownerId?: string; // For filtering tasks created by a specific user
  assigneeId?: string; // For filtering tasks assigned to a specific user
}

// EDUCATIONAL CONCEPT #2: Extended Types for Enhanced Functionality
// Sometimes your base types (like Task) don't have all the properties you need
// for specific UI components. Instead of modifying the base type everywhere,
// we can create "enhanced" versions that safely add the missing properties.

interface TaskWithEnhancedData extends Task {
  // These properties might come from separate API calls or be calculated
  bids?: Array<{
    id: string;
    amount: number;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  // Enhanced budget that might be an object instead of just a number
  enhancedBudget?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  title?: string;
  showFilters?: boolean;
  emptyMessage?: string;
  categories: string[];
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  title = 'Available Tasks',
  showFilters = true,
  emptyMessage = 'No tasks available. Check back later!',
  categories 
}) => {
  const [filters, setFilters] = useState<TaskFilterParams>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>('newest');

  // EDUCATIONAL CONCEPT #3: Safe Property Access with Type Guards
  // When working with properties that might not exist, we need helper functions
  // that safely extract the data we need without causing runtime errors.

  const getBudgetValue = (task: Task, type: 'min' | 'max'): number => {
    // First, check if budget exists and is a number (your current Task type)
    if (typeof task.budget === 'number') {
      // Convert single budget value to min/max range
      // This is a common pattern when your UI needs ranges but your data has single values
      const baseValue = task.budget;
      return type === 'min' ? Math.round(baseValue * 0.8) : Math.round(baseValue * 1.2);
    }
    
    // Check if budget is already an object with min/max (future-proofing)
    if (typeof task.budget === 'object' && task.budget !== null) {
      const budgetObj = task.budget as { min?: number; max?: number };
      if (type === 'min' && typeof budgetObj.min === 'number') return budgetObj.min;
      if (type === 'max' && typeof budgetObj.max === 'number') return budgetObj.max;
    }
    
    // Fallback for any other case
    return 0;
  };

  const getBidsCount = (task: Task): number => {
    // Check if the task has been enhanced with bids data
    const taskWithBids = task as TaskWithEnhancedData;
    if (taskWithBids.bids && Array.isArray(taskWithBids.bids)) {
      return taskWithBids.bids.length;
    }
    
    // Check if there's a bidCount property (alternative data structure)
    const taskWithBidCount = task as Task & { bidCount?: number };
    if (typeof taskWithBidCount.bidCount === 'number') {
      return taskWithBidCount.bidCount;
    }
    
    // Default to 0 if no bid information is available
    return 0;
  };

  // EDUCATIONAL CONCEPT #4: Safe String Matching with Null Coalescing
  // When filtering by category, we need to handle the fact that category
  // might be a string or an object, just like in our TaskCard component.
  
  const getCategoryString = (task: Task): string => {
    if (!task.category) return '';
    if (typeof task.category === 'string') return task.category;
    if (typeof task.category === 'object' && 'name' in task.category) {
      const categoryObj = task.category as { name: unknown };
      return typeof categoryObj.name === 'string' ? categoryObj.name : '';
    }
    return '';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setFilters({ ...filters, category: category ?? undefined });
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setFilters({ 
      ...filters, 
      sort: option as TaskFilterParams['sort']
    });
  };

  // EDUCATIONAL CONCEPT #5: Safe Filtering with Defensive Programming
  // When filtering data, we need to be prepared for properties that might
  // not exist or might be in different formats than we expect.

  const filterTasks = (tasks: Task[], filters: TaskFilterParams): Task[] => {
    return tasks.filter(task => {
      // Search filter - check both title and description
      if (filters.search && 
          !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !task.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all' && 
          task.category.name.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
      
      // Status filter (can be single status or array of statuses)
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          if (!filters.status.includes(task.status)) {
            return false;
          }
        } else if (task.status !== filters.status) {
          return false;
        }
      }
      
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      
      // Creator/owner filter
      if (filters.ownerId && task.owner.id !== filters.ownerId) {
        return false;
      }
      
      // Assignee filter
      if (filters.assigneeId && 
          (!task.assignee || task.assignee.id !== filters.assigneeId)) {
        return false;
      }
      
      // Budget range filter
      if (filters.budgetRange) {
        if (filters.budgetRange.min !== undefined && task.budget < filters.budgetRange.min) {
          return false;
        }
        if (filters.budgetRange.max !== undefined && task.budget > filters.budgetRange.max) {
          return false;
        }
      }
      
      return true;
    });
  };

  let filteredTasks = filterTasks(tasks, filters);

  // EDUCATIONAL CONCEPT #6: Safe Sorting with Null-Safe Comparisons
  // When sorting by properties that might not exist, we need comparison
  // functions that handle missing data gracefully.

  if (filters.sort) {
    switch (filters.sort) {
      case 'newest':
        filteredTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filteredTasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'budget-high':
        // Use our safe budget accessor instead of direct property access
        filteredTasks.sort((a, b) => getBudgetValue(b, 'max') - getBudgetValue(a, 'max'));
        break;
      case 'budget-low':
        // Use our safe budget accessor instead of direct property access
        filteredTasks.sort((a, b) => getBudgetValue(a, 'min') - getBudgetValue(b, 'min'));
        break;
      case 'bids-high':
        // Use our safe bids counter instead of direct property access
        filteredTasks.sort((a, b) => getBidsCount(b) - getBidsCount(a));
        break;
      case 'bids-low':
        // Use our safe bids counter instead of direct property access
        filteredTasks.sort((a, b) => getBidsCount(a) - getBidsCount(b));
        break;
      default:
        break;
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {showFilters && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-md border border-gray-300 py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-flextasker-500"
              aria-label="Sort tasks"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="budget-high">Budget (High to Low)</option>
              <option value="budget-low">Budget (Low to High)</option>
              <option value="bids-high">Bids (High to Low)</option>
              <option value="bids-low">Bids (Low to High)</option>
            </select>
          </div>
        )}
      </div>
      
      {showFilters && (
        <div className="mb-8">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          
          {/* Category filters */}
          <div className="relative">
            <div className="flex overflow-x-auto py-2 space-x-2 no-scrollbar">
              <button
                className={`category-chip whitespace-nowrap ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => handleCategorySelect(null)}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-chip whitespace-nowrap ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};