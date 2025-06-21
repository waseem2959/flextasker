/**
 * Enhanced Search Component
 * 
 * Features:
 * - Real-time search suggestions
 * - Category filtering
 * - Location-based search
 * - Keyboard navigation
 * - Recent searches
 * - Voice search support
 * - Mobile-optimized
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, Clock, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from './input';
import { Button } from './button';

interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  location?: string;
  type: 'task' | 'category' | 'location' | 'user';
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters?: SearchFilters) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
  showFilters?: boolean;
  voiceSearchEnabled?: boolean;
}

interface SearchFilters {
  category?: string;
  location?: string;
  priceRange?: [number, number];
  dateRange?: [Date, Date];
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = "Search for tasks, services, or locations...",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  className,
  showFilters = true,
  voiceSearchEnabled = false
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters] = useState<SearchFilters>({}); // setFilters not currently used
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);

  // Voice search setup
  const recognition = useRef<any>(null); // SpeechRecognition type not available
  
  useEffect(() => {
    if (voiceSearchEnabled && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => {
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [voiceSearchEnabled]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flextasker-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery, filters);
    }
  }, [debouncedQuery, filters, onSearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0 || recentSearches.length > 0);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowSuggestions(query.length > 0 || recentSearches.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalSuggestions = suggestions.length + recentSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > -1 ? prev - 1 : totalSuggestions - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else {
            const recentIndex = selectedIndex - suggestions.length;
            handleSearch(recentSearches[recentIndex]);
          }
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Add to recent searches
    const newRecentSearches = [
      trimmedQuery,
      ...recentSearches.filter(s => s !== trimmedQuery)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('flextasker-recent-searches', JSON.stringify(newRecentSearches));
    
    onSearch(trimmedQuery, filters);
    setShowSuggestions(false);
    setQuery(trimmedQuery);
  }, [recentSearches, filters, onSearch]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSuggestionSelect?.(suggestion);
    handleSearch(suggestion.text);
  };

  const startVoiceSearch = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('flextasker-recent-searches');
  };

  return (
    <div ref={searchRef} className={cn('relative w-full', className)}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20 py-3 text-base"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {voiceSearchEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startVoiceSearch}
              disabled={isListening}
              className={cn(
                "h-6 w-6 p-0 hover:bg-neutral-100",
                isListening && "text-primary-600 animate-pulse"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
          
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-neutral-100"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div className="p-3 border-b border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Recent searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </Button>
              </div>
              
              {recentSearches.map((recent, index) => (
                <button
                  key={`recent-${index}`}
                  ref={el => { suggestionRefs.current[suggestions.length + index] = el; }}
                  onClick={() => handleSearch(recent)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-50 flex items-center space-x-2",
                    selectedIndex === suggestions.length + index && "bg-neutral-100"
                  )}
                >
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>{recent}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  ref={el => { suggestionRefs.current[index] = el; }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-neutral-50 flex items-start space-x-3",
                    selectedIndex === index && "bg-neutral-100"
                  )}
                >
                  <Search className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-neutral-900">
                      {suggestion.text}
                    </div>
                    {(suggestion.category || suggestion.location) && (
                      <div className="flex items-center space-x-2 mt-1">
                        {suggestion.category && (
                          <span className="text-xs text-neutral-500">
                            in {suggestion.category}
                          </span>
                        )}
                        {suggestion.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-neutral-400" />
                            <span className="text-xs text-neutral-500">
                              {suggestion.location}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {query.length > 0 && suggestions.length === 0 && !loading && (
            <div className="p-6 text-center text-neutral-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs mt-1">Try searching for tasks, categories, or locations</p>
            </div>
          )}
          
          {/* Loading */}
          {loading && (
            <div className="p-6 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
                <span className="text-sm text-neutral-600">Searching...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;