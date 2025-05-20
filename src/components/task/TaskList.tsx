
import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Task, TaskFilterParams } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setFilters({ ...filters, category: category || undefined });
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setFilters({ 
      ...filters, 
      sort: option as TaskFilterParams['sort']
    });
  };

  // Apply filters
  let filteredTasks = [...tasks];

  // Filter by category
  if (filters.category) {
    filteredTasks = filteredTasks.filter(task => task.category === filters.category);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredTasks = filteredTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) || 
      task.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort tasks
  if (filters.sort) {
    switch (filters.sort) {
      case 'newest':
        filteredTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filteredTasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'budget-high':
        filteredTasks.sort((a, b) => (b.budget?.max || 0) - (a.budget?.max || 0));
        break;
      case 'budget-low':
        filteredTasks.sort((a, b) => (a.budget?.min || 0) - (b.budget?.min || 0));
        break;
      case 'bids-high':
        filteredTasks.sort((a, b) => b.bids.length - a.bids.length);
        break;
      case 'bids-low':
        filteredTasks.sort((a, b) => a.bids.length - b.bids.length);
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
