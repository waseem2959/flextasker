/**
 * Smart Search Component
 * 
 * Advanced search interface with autocomplete, filters, suggestions,
 * saved searches, and intelligent query building.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Star, Clock, DollarSign, X, ChevronDown, Sparkles } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { useDebounce } from '../../hooks/use-debounce';
// import { useLocalStorage } from '../../hooks/use-local-storage'; // Hook doesn't exist yet

interface SearchFilters {
  categories: string[];
  skills: string[];
  budgetRange: [number, number];
  location: {
    address: string;
    radius: number;
  } | null;
  urgentOnly: boolean;
  featuredOnly: boolean;
  postedWithin: 'day' | 'week' | 'month' | 'all';
  sortBy: 'relevance' | 'newest' | 'budget' | 'deadline';
}

interface SearchSuggestion {
  type: 'query' | 'category' | 'skill' | 'location';
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed: string;
  resultCount: number;
}

interface SmartSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showSavedSearches?: boolean;
  showAdvancedFilters?: boolean;
  categories?: Array<{ id: string; name: string; icon?: string }>;
  // popularSkills?: string[]; // Not used in current implementation
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onFiltersChange,
  placeholder = 'Search for tasks, skills, or categories...',
  showSavedSearches = true,
  showAdvancedFilters = true,
  categories = [],
  // popularSkills = [], // Not used in current implementation
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    categories: [],
    skills: [],
    budgetRange: [10, 10000],
    location: null,
    urgentOnly: false,
    featuredOnly: false,
    postedWithin: 'all',
    sortBy: 'relevance'
  });

  // Saved searches management - TODO: implement useLocalStorage hook
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearchesPanel, setShowSavedSearchesPanel] = useState(false);

  // Refs and hooks
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Get search suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Fetch search suggestions from API
   */
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    try {
      // Simulate API call - replace with actual endpoint
      const mockSuggestions: SearchSuggestion[] = [
        {
          type: 'query',
          value: `${searchQuery} web development`,
          label: `${searchQuery} web development`,
          count: 42,
          icon: <Search className="w-4 h-4" />
        },
        {
          type: 'category',
          value: 'web-development',
          label: 'Web Development',
          count: 156,
          icon: <Filter className="w-4 h-4" />
        },
        {
          type: 'skill',
          value: 'react',
          label: 'React',
          count: 89,
          icon: <Sparkles className="w-4 h-4" />
        }
      ];

      setSuggestions(mockSuggestions);
      setShowSuggestions(true);

    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  /**
   * Handle search execution
   */
  const handleSearch = useCallback(() => {
    if (query.trim() || hasActiveFilters()) {
      onSearch(query.trim(), activeFilters);
      setShowSuggestions(false);
      
      // Update search history
      updateSearchHistory(query.trim(), activeFilters);
    }
  }, [query, activeFilters, onSearch]);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.value);
      setTimeout(handleSearch, 100);
    } else if (suggestion.type === 'category') {
      const newFilters = {
        ...activeFilters,
        categories: [...activeFilters.categories, suggestion.value]
      };
      setActiveFilters(newFilters);
      onFiltersChange?.(newFilters);
    } else if (suggestion.type === 'skill') {
      const newFilters = {
        ...activeFilters,
        skills: [...activeFilters.skills, suggestion.value]
      };
      setActiveFilters(newFilters);
      onFiltersChange?.(newFilters);
    }
    setShowSuggestions(false);
  };

  /**
   * Handle filter changes
   */
  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...activeFilters, ...updates };
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return (
      activeFilters.categories.length > 0 ||
      activeFilters.skills.length > 0 ||
      activeFilters.budgetRange[0] > 10 ||
      activeFilters.budgetRange[1] < 10000 ||
      activeFilters.location !== null ||
      activeFilters.urgentOnly ||
      activeFilters.featuredOnly ||
      activeFilters.postedWithin !== 'all' ||
      activeFilters.sortBy !== 'relevance'
    );
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      categories: [],
      skills: [],
      budgetRange: [10, 10000],
      location: null,
      urgentOnly: false,
      featuredOnly: false,
      postedWithin: 'all',
      sortBy: 'relevance'
    };
    setActiveFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  /**
   * Save current search
   */
  const saveCurrentSearch = () => {
    if (!query.trim() && !hasActiveFilters()) return;

    const searchName = prompt('Enter a name for this search:');
    if (!searchName) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      query: query.trim(),
      filters: activeFilters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      resultCount: 0 // Would be updated after search
    };

    setSavedSearches((prev: SavedSearch[]) => [newSavedSearch, ...prev.slice(0, 9)]);
  };

  /**
   * Load saved search
   */
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setActiveFilters(savedSearch.filters);
    setShowSavedSearchesPanel(false);
    
    // Update last used
    setSavedSearches((prev: SavedSearch[]) =>
      prev.map((s: SavedSearch) =>
        s.id === savedSearch.id
          ? { ...s, lastUsed: new Date().toISOString() }
          : s
      )
    );

    // Execute search
    setTimeout(() => handleSearch(), 100);
  };

  /**
   * Delete saved search
   */
  const deleteSavedSearch = (searchId: string) => {
    setSavedSearches((prev: SavedSearch[]) => prev.filter((s: SavedSearch) => s.id !== searchId));
  };

  /**
   * Update search history for analytics
   */
  const updateSearchHistory = (searchQuery: string, filters: SearchFilters) => {
    // In a real app, this would send analytics data
    console.log('Search executed:', { query: searchQuery, filters });
  };

  /**
   * Get active filter count
   */
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.categories.length > 0) count++;
    if (activeFilters.skills.length > 0) count++;
    if (activeFilters.budgetRange[0] > 10 || activeFilters.budgetRange[1] < 10000) count++;
    if (activeFilters.location) count++;
    if (activeFilters.urgentOnly) count++;
    if (activeFilters.featuredOnly) count++;
    if (activeFilters.postedWithin !== 'all') count++;
    if (activeFilters.sortBy !== 'relevance') count++;
    return count;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            placeholder={placeholder}
            className="pl-10 pr-12 h-12 text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.type}-${suggestion.value}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                {suggestion.icon}
                <div className="flex-1">
                  <div className="font-medium">{suggestion.label}</div>
                  {suggestion.count && (
                    <div className="text-sm text-gray-500">{suggestion.count} results</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Advanced Filters Button */}
        {showAdvancedFilters && (
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5">
                    {getActiveFilterCount()}
                  </Badge>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="start">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Advanced Filters</h3>
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.slice(0, 6).map(category => (
                        <label key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={activeFilters.categories.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFilters({
                                  categories: [...activeFilters.categories, category.id]
                                });
                              } else {
                                updateFilters({
                                  categories: activeFilters.categories.filter(id => id !== category.id)
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Budget Range</label>
                  <div className="space-y-3">
                    <Slider
                      value={activeFilters.budgetRange}
                      onValueChange={(value) => updateFilters({ budgetRange: value as [number, number] })}
                      max={10000}
                      min={10}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${activeFilters.budgetRange[0]}</span>
                      <span>${activeFilters.budgetRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quick Filters</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={activeFilters.urgentOnly}
                        onCheckedChange={(checked) => updateFilters({ urgentOnly: checked as boolean })}
                      />
                      <span className="text-sm">Urgent tasks only</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={activeFilters.featuredOnly}
                        onCheckedChange={(checked) => updateFilters({ featuredOnly: checked as boolean })}
                      />
                      <span className="text-sm">Featured tasks only</span>
                    </label>
                  </div>
                </div>

                {/* Posted Within */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Posted Within</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'day', label: 'Last 24 hours' },
                      { value: 'week', label: 'Last week' },
                      { value: 'month', label: 'Last month' },
                      { value: 'all', label: 'Any time' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="postedWithin"
                          value={option.value}
                          checked={activeFilters.postedWithin === option.value}
                          onChange={(e) => updateFilters({ postedWithin: e.target.value as any })}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Saved Searches */}
        {showSavedSearches && savedSearches.length > 0 && (
          <Popover open={showSavedSearchesPanel} onOpenChange={setShowSavedSearchesPanel}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Saved Searches
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h3 className="font-semibold">Saved Searches</h3>
                {savedSearches.map((savedSearch: SavedSearch) => (
                  <div key={savedSearch.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <button
                      onClick={() => loadSavedSearch(savedSearch)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm">{savedSearch.name}</div>
                      <div className="text-xs text-gray-500">{savedSearch.query}</div>
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(savedSearch.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Save Search Button */}
        {(query.trim() || hasActiveFilters()) && (
          <Button variant="ghost" size="sm" onClick={saveCurrentSearch}>
            <Star className="w-4 h-4 mr-2" />
            Save Search
          </Button>
        )}

        {/* Search Button */}
        <Button onClick={handleSearch} className="px-6">
          Search
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {activeFilters.categories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <Badge key={categoryId} variant="secondary" className="text-xs">
                {category.name}
                <button
                  onClick={() => updateFilters({
                    categories: activeFilters.categories.filter(id => id !== categoryId)
                  })}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ) : null;
          })}

          {activeFilters.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
              <button
                onClick={() => updateFilters({
                  skills: activeFilters.skills.filter(s => s !== skill)
                })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {(activeFilters.budgetRange[0] > 10 || activeFilters.budgetRange[1] < 10000) && (
            <Badge variant="secondary" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              ${activeFilters.budgetRange[0]} - ${activeFilters.budgetRange[1]}
              <button
                onClick={() => updateFilters({ budgetRange: [10, 10000] })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {activeFilters.urgentOnly && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Urgent Only
              <button
                onClick={() => updateFilters({ urgentOnly: false })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {activeFilters.featuredOnly && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured Only
              <button
                onClick={() => updateFilters({ featuredOnly: false })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {activeFilters.postedWithin !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Last {activeFilters.postedWithin}
              <button
                onClick={() => updateFilters({ postedWithin: 'all' })}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;