import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Brain, Camera, Filter, MapPin, Mic, Search, Sliders } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchFilters {
  query: string;
  category: string;
  location: string;
  budget: string;
  sortBy: string;
}

interface EnhancedSearchProps {
  className?: string;
  variant?: 'hero' | 'page' | 'compact';
  showAdvancedFilters?: boolean;
}

const categories = [
  'All Categories',
  'Cleaning & Maintenance',
  'Handyman Services', 
  'Moving & Delivery',
  'Personal Assistant',
  'Tech Support',
  'Design & Creative',
  'Writing & Translation',
  'Tutoring & Education',
  'Event Services',
  'Pet Care',
  'Gardening & Landscaping'
];

const budgetRanges = [
  'Any Budget',
  'Under $50',
  '$50 - $100',
  '$100 - $250',
  '$250 - $500',
  '$500 - $1000',
  'Over $1000'
];

const sortOptions = [
  'Most Recent',
  'Highest Budget',
  'Lowest Budget',
  'Most Bids',
  'Closest to Me'
];

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  className,
  variant = 'hero',
  showAdvancedFilters = false
}) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    location: '',
    budget: '',
    sortBy: ''
  });
  const [showFilters, setShowFilters] = useState(showAdvancedFilters);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    // Build search URL with filters
    const searchParams = new URLSearchParams();
    if (filters.query) searchParams.set('q', filters.query);
    if (filters.category && filters.category !== 'All Categories') {
      searchParams.set('category', filters.category);
    }
    if (filters.location) searchParams.set('location', filters.location);
    if (filters.budget && filters.budget !== 'Any Budget') {
      searchParams.set('budget', filters.budget);
    }
    if (filters.sortBy && filters.sortBy !== 'Most Recent') {
      searchParams.set('sort', filters.sortBy);
    }

    navigate(`/tasks?${searchParams.toString()}`);
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // AI-powered search features
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        updateFilter('query', transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const handleVisualSearch = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate AI image analysis
      const imageAnalysisResults = [
        'furniture assembly',
        'home repair',
        'interior design',
        'cleaning services'
      ];
      const randomResult = imageAnalysisResults[Math.floor(Math.random() * imageAnalysisResults.length)];
      updateFilter('query', `${randomResult} (from image)`);
    }
  };

  const handleAISmartSearch = () => {
    // Simulate AI-powered query enhancement
    const currentQuery = filters.query;
    if (currentQuery) {
      const enhancedQuery = `${currentQuery} (AI-enhanced)`;
      updateFilter('query', enhancedQuery);
    }
  };

  const variantStyles = {
    hero: 'bg-neutral-0 p-6 rounded-2xl shadow-md border border-neutral-200',
    page: 'bg-neutral-0 p-4 rounded-xl border border-neutral-200',
    compact: 'bg-neutral-50 p-3 rounded-lg border border-neutral-200'
  };

  const inputHeight = {
    hero: 'h-14',
    page: 'h-12', 
    compact: 'h-10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(variantStyles[variant], className)}
      role="search"
      aria-label="Task search interface"
    >
      {/* Main Search Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input with AI Features */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5 transition-colors group-focus-within:text-primary-600" />
          <Input
            type="text"
            placeholder="What do you need help with? Try voice, image, or AI search!"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className={cn(
              "pl-12 pr-32 border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl font-body placeholder:text-neutral-500 transition-all duration-200",
              inputHeight[variant]
            )}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-label="Search for tasks with AI assistance"
            aria-describedby="search-help"
          />

          {/* AI Search Features */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {/* Voice Search */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              disabled={isListening}
              className={cn(
                "h-8 w-8 p-0 hover:bg-primary-100 transition-colors",
                isListening && "bg-red-100 text-red-600"
              )}
              title="Voice search"
            >
              <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
            </Button>

            {/* Visual Search */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVisualSearch}
              className="h-8 w-8 p-0 hover:bg-primary-100 transition-colors"
              title="Search by image"
            >
              <Camera className="w-4 h-4" />
            </Button>

            {/* AI Smart Search */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAISmartSearch}
              className="h-8 w-8 p-0 hover:bg-primary-100 transition-colors"
              title="AI-enhanced search"
            >
              <Brain className="w-4 h-4" />
            </Button>
          </div>

          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            aria-label="Upload image for visual search"
          />
        </div>

        {/* Location Input */}
        <div className="lg:w-64 relative group">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5 transition-colors group-focus-within:text-primary-600" />
          <Input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className={cn(
              "pl-12 border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl font-body placeholder:text-neutral-500 transition-all duration-200",
              inputHeight[variant]
            )}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Category Select */}
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className={cn(
            "lg:w-52 border-2 border-neutral-200 focus:border-primary-500 rounded-xl font-body",
            inputHeight[variant]
          )}>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 border-neutral-200 shadow-xl">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="font-body">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className={cn(
            "px-8 bg-primary-900 hover:bg-primary-800 text-neutral-0 font-heading font-semibold rounded-xl shadow-lg shadow-primary-900/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary-900/30 hover:-translate-y-0.5",
            inputHeight[variant]
          )}
        >
          <Search className="w-5 h-5 lg:mr-2" />
          <span className="hidden lg:inline">Search</span>
        </Button>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-700 rounded-xl transition-all duration-200",
            inputHeight[variant]
          )}
        >
          <Sliders className="w-5 h-5" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 pt-6 border-t border-neutral-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Budget Filter */}
            <div>
              <label htmlFor="budget-filter" className="block text-sm font-medium text-neutral-700 mb-2 font-body">
                Budget Range
              </label>
              <Select value={filters.budget} onValueChange={(value) => updateFilter('budget', value)}>
                <SelectTrigger id="budget-filter" className="border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" aria-label="Select budget range">
                  <SelectValue placeholder="Any Budget" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-2 border-neutral-200 shadow-lg">
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range} className="font-body">
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label htmlFor="sort-filter" className="block text-sm font-medium text-neutral-700 mb-2 font-body">
                Sort By
              </label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger id="sort-filter" className="border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" aria-label="Select sort order">
                  <SelectValue placeholder="Most Recent" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-2 border-neutral-200 shadow-lg">
                  {sortOptions.map((option) => (
                    <SelectItem key={option} value={option} className="font-body">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-700 rounded-lg transition-all duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI-Powered Popular Searches */}
      {variant === 'hero' && (
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary-600" />
            <p className="text-sm font-medium text-neutral-600 font-body">AI-suggested searches:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['House Cleaning', 'Furniture Assembly', 'Moving Help', 'Handyman', 'Pet Sitting', 'Garden Maintenance'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => updateFilter('query', term)}
                className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-full transition-all duration-200 font-body hover:scale-105 hover:shadow-sm"
              >
                {term}
              </button>
            ))}
          </div>

          {/* AI Features Info */}
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-1 bg-primary-500 rounded-full">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs text-primary-800 font-body">
                <p className="font-medium mb-1">Enhanced with AI</p>
                <p>Use voice search, upload images, or let AI enhance your queries for better results.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
