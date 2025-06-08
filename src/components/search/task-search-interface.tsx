/**
 * Task Search Interface Component
 * 
 * Comprehensive task search interface combining all search components.
 * Implements project-map specifications for marketplace task discovery.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Grid, List, MapPin, Search } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { LocationSearch, LocationSearchValue } from './location-search';
// Simplified search filters interface
export interface SearchFilters {
  category?: string;
  priceRange?: { min?: number; max?: number };
  rating?: number;
  availability?: string;
  [key: string]: any;
}

export interface TaskSearchState {
  query: string;
  location: LocationSearchValue;
  filters: SearchFilters;
  sortBy: string;
  viewMode: 'grid' | 'list' | 'map';
}

interface TaskSearchInterfaceProps {
  searchState: TaskSearchState;
  onSearchStateChange: (state: TaskSearchState) => void;
  onSearch: () => void;
  categories?: Array<{ id: string; name: string; icon?: any }>;
  className?: string;
  showViewModes?: boolean;
  showQuickFilters?: boolean;
}

/**
 * Task Search Interface Component
 */
export const TaskSearchInterface: React.FC<TaskSearchInterfaceProps> = ({
  searchState,
  onSearchStateChange,
  onSearch,
  categories = [],
  className,
  showViewModes = true,
  showQuickFilters = true,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Update search state helper
  const updateSearchState = useCallback((updates: Partial<TaskSearchState>) => {
    onSearchStateChange({ ...searchState, ...updates });
  }, [searchState, onSearchStateChange]);

  // Handle query change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchState({ query: e.target.value });
  }, [updateSearchState]);

  // Handle location change
  const handleLocationChange = useCallback((location: LocationSearchValue) => {
    updateSearchState({ location });
  }, [updateSearchState]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    updateSearchState({ sortBy });
  }, [updateSearchState]);

  // Handle view mode change
  const handleViewModeChange = useCallback((viewMode: 'grid' | 'list' | 'map') => {
    updateSearchState({ viewMode });
  }, [updateSearchState]);

  // Handle quick category selection
  const handleQuickCategorySelect = useCallback((categoryId: string) => {
    updateSearchState({
      filters: {
        ...searchState.filters,
        category: categoryId,
      },
    });
  }, [updateSearchState, searchState.filters]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    updateSearchState({
      query: '',
      location: { address: '' },
      filters: {},
      sortBy: 'relevance',
    });
  }, [updateSearchState]);

  // Count active filters
  const activeFilterCount = Object.entries(searchState.filters).filter(([key, value]) => {
    if (key === 'sortBy') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null && v !== '');
    }
    return value !== undefined && value !== null && value !== '';
  }).length;

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date-new', label: 'Newest First' },
    { value: 'date-old', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const popularCategories = categories.slice(0, 6);

  return (
    <div className={cn("task-search-interface space-y-6", className)}>
      {/* Main Search Bar */}
      <Card className="shadow-lg border-2 border-neutral-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Query */}
            <div className="lg:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <Input
                type="text"
                placeholder="What service do you need?"
                value={searchState.query}
                onChange={handleQueryChange}
                className="pl-10 h-12 text-base border-2 border-neutral-200 focus:border-primary-500"
              />
            </div>

            {/* Location Search */}
            <div className="lg:col-span-4">
              <LocationSearch
                value={searchState.location}
                onChange={handleLocationChange}
                placeholder="Where do you need it done?"
                showRadius={false}
                showRemoteOption={false}
                className="h-12"
              />
            </div>

            {/* Search Button */}
            <div className="lg:col-span-3 flex gap-2">
              <Button
                onClick={onSearch}
                className="flex-1 h-12 bg-primary-900 hover:bg-primary-800 text-white font-heading font-semibold"
              >
                Search Tasks
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-12 px-4 border-2 border-neutral-200 hover:border-primary-300"
              >
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary-600 text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      {showQuickFilters && popularCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-neutral-900">
              Popular Categories
            </h3>
            {searchState.filters.category && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickCategorySelect('')}
                className="text-neutral-600 hover:text-neutral-800"
              >
                Clear category
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {popularCategories.map((category) => (
              <Button
                key={category.id}
                variant={searchState.filters.category === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickCategorySelect(category.id)}
                className={cn(
                  "transition-all duration-200",
                  searchState.filters.category === category.id
                    ? "bg-primary-600 text-white border-primary-600"
                    : "text-neutral-700 border-neutral-300 hover:border-primary-300 hover:text-primary-700"
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search Controls */}
      <div className="flex items-center justify-between">
        {/* Active Filters & Sort */}
        <div className="flex items-center gap-4">
          {/* Active Filters Count */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-neutral-600 hover:text-neutral-800"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">Sort by:</span>
            <Select value={searchState.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode Toggle */}
        {showViewModes && (
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <Button
              variant={searchState.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={searchState.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={searchState.viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('map')}
              className="h-8 w-8 p-0"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Location & Radius Display */}
      {searchState.location.address && (
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <MapPin className="w-4 h-4" />
          <span>Searching in: {searchState.location.address}</span>
          {searchState.location.radius && (
            <Badge variant="outline" className="text-xs">
              {searchState.location.radius}km radius
            </Badge>
          )}
          {searchState.location.includeRemote && (
            <Badge variant="outline" className="text-xs">
              Including remote
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSearchInterface;
