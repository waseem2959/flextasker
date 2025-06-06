/**
 * AI-Powered Search Engine Component
 * 
 * Advanced search engine with Elasticsearch integration, ML ranking, and intelligent suggestions.
 * Implements project-map specifications for enhanced search capabilities.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Filter, MapPin, Search, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'category' | 'location' | 'service';
  confidence: number;
  popularity: number;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    distance?: number;
  };
  price: {
    amount: number;
    currency: string;
    type: 'fixed' | 'hourly';
  };
  rating: number;
  reviewCount: number;
  relevanceScore: number;
  mlScore: number;
  isPromoted: boolean;
  tags: string[];
  images: string[];
  createdAt: Date;
}

export interface SearchFilters {
  categories: string[];
  priceRange: { min: number; max: number };
  location: {
    center: { lat: number; lng: number };
    radius: number;
  };
  rating: number;
  availability: 'any' | 'today' | 'this-week';
  sortBy: 'relevance' | 'price' | 'rating' | 'distance' | 'date';
}

interface AISearchEngineProps {
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  className?: string;
  enableMLRanking?: boolean;
  enableVisualSearch?: boolean;
}

/**
 * Smart Search Suggestions Component
 */
const SmartSuggestions: React.FC<{
  query: string;
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  isLoading: boolean;
}> = ({ query, suggestions, onSelect, isLoading }) => {
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, SearchSuggestion[]> = {
      query: [],
      category: [],
      location: [],
      service: [],
    };
    
    suggestions.forEach(suggestion => {
      groups[suggestion.type].push(suggestion);
    });
    
    return groups;
  }, [suggestions]);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'query': return Search;
      case 'category': return Filter;
      case 'location': return MapPin;
      case 'service': return Target;
      default: return Search;
    }
  };

  if (!query || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-xl max-h-96 overflow-y-auto"
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-neutral-600 font-body">Finding smart suggestions...</p>
        </div>
      ) : (
        <div className="p-2">
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => {
            if (typeSuggestions.length === 0) return null;
            
            const IconComponent = getSuggestionIcon(type as SearchSuggestion['type']);
            
            return (
              <div key={type} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  <IconComponent className="w-3 h-3" />
                  {type === 'query' ? 'Suggestions' : type}
                </div>
                
                {typeSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.id}
                    onClick={() => onSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-primary-50 rounded-lg transition-colors duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4 text-neutral-500 group-hover:text-primary-600" />
                        <span className="text-neutral-900 font-body group-hover:text-primary-900">
                          {suggestion.text}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {suggestion.popularity > 0.8 && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            Popular
                          </Badge>
                        )}
                        <div className="text-xs text-neutral-500">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

/**
 * ML Ranking Indicator Component
 */
const MLRankingIndicator: React.FC<{
  score: number;
  factors: string[];
  showDetails?: boolean;
}> = ({ score, factors, showDetails = false }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-primary-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-neutral-600';
  };

  return (
    <div className="ml-ranking-indicator">
      <div className="flex items-center gap-2">
        <Brain className={cn("w-4 h-4", getScoreColor(score))} />
        <span className={cn("text-sm font-medium", getScoreColor(score))}>
          AI Score: {Math.round(score * 100)}%
        </span>
        {showDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 p-0"
          >
            <Sparkles className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2 bg-neutral-50 rounded-lg"
          >
            <p className="text-xs font-medium text-neutral-700 mb-1">Ranking Factors:</p>
            <div className="flex flex-wrap gap-1">
              {factors.map((factor) => (
                <Badge key={factor} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Visual Search Component
 */
const VisualSearch: React.FC<{
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}> = ({ onImageUpload, isProcessing }) => {
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div className="visual-search p-4 border-2 border-dashed border-neutral-300 rounded-lg text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary-600" />
      </div>
      
      <h3 className="font-medium text-neutral-900 font-heading mb-2">
        Visual Search
      </h3>
      <p className="text-sm text-neutral-600 font-body mb-4">
        Upload an image to find similar tasks or services
      </p>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="visual-search-input"
        disabled={isProcessing}
        aria-label="Upload image for visual search"
      />
      
      <Button
        variant="outline"
        onClick={() => document.getElementById('visual-search-input')?.click()}
        disabled={isProcessing}
        className="text-primary-600 border-primary-300 hover:bg-primary-50"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Upload Image
          </>
        )}
      </Button>
    </div>
  );
};

/**
 * Main AI Search Engine Component
 */
export const AISearchEngine: React.FC<AISearchEngineProps> = ({
  onSearch,
  onSuggestionSelect,
  className,
  enableMLRanking = true,

  enableVisualSearch = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Refs for cleanup
  const suggestionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const imageProcessingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (imageProcessingTimeoutRef.current) {
        clearTimeout(imageProcessingTimeoutRef.current);
      }
    };
  }, []);

  // Mock suggestions generation
  const generateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    // Clear any existing timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Simulate API call with cleanup
    suggestionTimeoutRef.current = setTimeout(() => {
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          text: `${searchQuery} services`,
          type: 'query',
          confidence: 0.9,
          popularity: 0.8,
        },
        {
          id: '2',
          text: `${searchQuery} near me`,
          type: 'location',
          confidence: 0.85,
          popularity: 0.9,
        },
        {
          id: '3',
          text: 'Home Cleaning',
          type: 'category',
          confidence: 0.7,
          popularity: 0.95,
        },
        {
          id: '4',
          text: 'Professional Cleaning Service',
          type: 'service',
          confidence: 0.8,
          popularity: 0.7,
        },
      ];

      setSuggestions(mockSuggestions);
      setIsLoadingSuggestions(false);
    }, 300);
  }, []);

  // Handle query change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);
    generateSuggestions(newQuery);
  }, [generateSuggestions]);

  // Handle search execution
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      const mockFilters: SearchFilters = {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        location: {
          center: { lat: -33.8688, lng: 151.2093 },
          radius: 25,
        },
        rating: 0,
        availability: 'any',
        sortBy: 'relevance',
      };
      
      const searchResults = await onSearch(query, mockFilters);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, onSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSuggestionSelect(suggestion);
    handleSearch();
  }, [onSuggestionSelect, handleSearch]);

  // Handle visual search
  const handleImageUpload = useCallback(async (_file: File) => {
    setIsProcessingImage(true);

    // Clear any existing timeout
    if (imageProcessingTimeoutRef.current) {
      clearTimeout(imageProcessingTimeoutRef.current);
    }

    // Simulate image processing with cleanup
    imageProcessingTimeoutRef.current = setTimeout(() => {
      setQuery('cleaning services');
      setIsProcessingImage(false);
      handleSearch();
    }, 2000);
  }, [handleSearch]);

  return (
    <div className={cn("ai-search-engine space-y-6", className)}>
      {/* Enhanced Search Header */}
      <Card className="border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-heading text-primary-900">
                AI-Powered Search
              </CardTitle>
              <p className="text-primary-700 font-body">
                Intelligent search with ML ranking and smart suggestions
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Main Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder="What service do you need? Try 'house cleaning' or 'furniture assembly'"
                className="pl-12 pr-32 h-14 text-base border-2 border-neutral-200 focus:border-primary-500 rounded-xl"
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {enableMLRanking && (
                  <Badge variant="outline" className="text-xs bg-primary-50 text-primary-700 border-primary-200">
                    <Brain className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                )}
                
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="h-10 bg-primary-600 hover:bg-primary-700 text-white font-heading"
                >
                  {isSearching ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>

            {/* Smart Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <SmartSuggestions
                  query={query}
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  isLoading={isLoadingSuggestions}
                />
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Search Features */}
      <Tabs defaultValue="text-search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text-search">Text Search</TabsTrigger>
          {enableVisualSearch && (
            <TabsTrigger value="visual-search">Visual Search</TabsTrigger>
          )}
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="text-search" className="space-y-4">
          {/* Search Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  Search Results ({results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 font-heading mb-1">
                            {result.title}
                          </h3>
                          <p className="text-sm text-neutral-600 font-body mb-2">
                            {result.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {result.location.address}
                            </span>
                            <span>${result.price.amount}</span>
                            <span>★ {result.rating} ({result.reviewCount})</span>
                          </div>
                        </div>
                        
                        {enableMLRanking && (
                          <MLRankingIndicator
                            score={result.mlScore}
                            factors={['Relevance', 'Quality', 'Distance']}
                            showDetails={true}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {enableVisualSearch && (
          <TabsContent value="visual-search">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Visual Search</CardTitle>
              </CardHeader>
              <CardContent>
                <VisualSearch
                  onImageUpload={handleImageUpload}
                  isProcessing={isProcessingImage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Advanced Search Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900 font-heading">ML Ranking</h3>
                  </div>
                  <p className="text-sm text-blue-700 font-body">
                    Machine learning algorithms rank results based on relevance, quality, and user preferences.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900 font-heading">Geospatial Search</h3>
                  </div>
                  <p className="text-sm text-green-700 font-body">
                    Location-aware search with distance calculations and geographic clustering.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISearchEngine;
