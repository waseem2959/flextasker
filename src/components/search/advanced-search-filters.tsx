/**
 * Advanced Search Filters Component
 * 
 * Comprehensive search filtering interface with multiple criteria support.
 * Implements project-map specifications for marketplace search functionality.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryGrid } from '@/components/ui/category-grid';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceRange, PriceRangeSlider } from '@/components/ui/price-range-slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, DollarSign, Filter, MapPin, Star, X } from 'lucide-react';
import React, { useCallback } from 'react';

export interface SearchFilters {
  // Basic filters
  query?: string;
  category?: string;
  subcategory?: string;
  
  // Location filters
  location?: {
    address?: string;
    radius?: number; // in km
    coordinates?: { lat: number; lng: number };
    includeRemote?: boolean;
  };
  
  // Price filters
  priceRange?: PriceRange;
  budgetType?: 'fixed' | 'hourly' | 'any';
  
  // Timing filters
  availability?: 'asap' | 'this-week' | 'this-month' | 'flexible';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  
  // Quality filters
  minRating?: number;
  verifiedOnly?: boolean;
  hasReviews?: boolean;
  
  // Task status filters
  status?: ('open' | 'assigned' | 'in-progress' | 'completed')[];
  
  // Additional filters
  sortBy?: 'relevance' | 'price-low' | 'price-high' | 'date-new' | 'date-old' | 'rating';
  isUrgent?: boolean;
  hasImages?: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  categories?: Array<{ id: string; name: string; icon?: any }>;
}

/**
 * Advanced Search Filters Component
 */
export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isOpen,
  onToggle,
  className,
  categories = [],
}) => {


  // Update filters helper
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'sortBy') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null && v !== '');
    }
    return value !== undefined && value !== null && value !== '';
  }).length;

  const filterSections = [
    {
      id: 'category',
      title: 'Category',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <CategoryGrid
            categories={categories}
            selectedCategory={filters.category}
            onCategorySelect={(categoryId) => updateFilters({ category: categoryId })}
            variant="compact"
            showDescriptions={false}
          />
        </div>
      ),
    },
    {
      id: 'location',
      title: 'Location',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="location-input" className="text-sm font-medium text-neutral-700">
              Location
            </Label>
            <Input
              id="location-input"
              placeholder="Enter city, suburb, or postcode"
              value={filters.location?.address || ''}
              onChange={(e) => updateFilters({
                location: { ...filters.location, address: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="radius-select" className="text-sm font-medium text-neutral-700">
              Search radius
            </Label>
            <Select
              value={filters.location?.radius?.toString() || '10'}
              onValueChange={(value) => updateFilters({
                location: { ...filters.location, radius: parseInt(value) }
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-remote"
              checked={filters.location?.includeRemote || false}
              onCheckedChange={(checked) => updateFilters({
                location: { ...filters.location, includeRemote: checked as boolean }
              })}
            />
            <Label htmlFor="include-remote" className="text-sm text-neutral-700">
              Include remote tasks
            </Label>
          </div>
        </div>
      ),
    },
    {
      id: 'price',
      title: 'Budget',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-3 block">
              Budget type
            </Label>
            <Select
              value={filters.budgetType || 'any'}
              onValueChange={(value) => updateFilters({ budgetType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any budget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any budget type</SelectItem>
                <SelectItem value="fixed">Fixed price</SelectItem>
                <SelectItem value="hourly">Hourly rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <PriceRangeSlider
            min={5}
            max={5000}
            value={filters.priceRange || { min: 5, max: 1000 }}
            onChange={(range) => updateFilters({ priceRange: range })}
            step={5}
            currency="USD"
            showLabels={true}
            showTooltips={true}
          />
        </div>
      ),
    },
    {
      id: 'timing',
      title: 'Timing',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-3 block">
              When do you need this done?
            </Label>
            <Select
              value={filters.availability || 'flexible'}
              onValueChange={(value) => updateFilters({ availability: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgent-only"
              checked={filters.isUrgent || false}
              onCheckedChange={(checked) => updateFilters({ isUrgent: checked as boolean })}
            />
            <Label htmlFor="urgent-only" className="text-sm text-neutral-700">
              Urgent tasks only
            </Label>
          </div>
        </div>
      ),
    },
    {
      id: 'quality',
      title: 'Quality',
      icon: Star,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-3 block">
              Minimum rating
            </Label>
            <Select
              value={filters.minRating?.toString() || '0'}
              onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="4.5">4.5+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified-only"
                checked={filters.verifiedOnly || false}
                onCheckedChange={(checked) => updateFilters({ verifiedOnly: checked as boolean })}
              />
              <Label htmlFor="verified-only" className="text-sm text-neutral-700">
                Verified taskers only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-reviews"
                checked={filters.hasReviews || false}
                onCheckedChange={(checked) => updateFilters({ hasReviews: checked as boolean })}
              />
              <Label htmlFor="has-reviews" className="text-sm text-neutral-700">
                Must have reviews
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-images"
                checked={filters.hasImages || false}
                onCheckedChange={(checked) => updateFilters({ hasImages: checked as boolean })}
              />
              <Label htmlFor="has-images" className="text-sm text-neutral-700">
                Tasks with images
              </Label>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className={cn("advanced-search-filters", className)}>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 border-2 transition-all duration-200",
          isOpen ? "border-primary-500 bg-primary-50" : "border-neutral-200 hover:border-primary-300"
        )}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="bg-primary-500 text-white">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="shadow-xl border-2 border-neutral-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading text-neutral-900">
                    Advanced Filters
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={onToggle}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filterSections.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <section.icon className="w-4 h-4 text-primary-600" />
                        <h3 className="font-medium text-neutral-900 font-heading">
                          {section.title}
                        </h3>
                      </div>
                      {section.content}
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
                  <Button variant="ghost" onClick={onReset} className="text-neutral-600">
                    Reset all
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onToggle}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={onApply}
                      className="bg-primary-900 hover:bg-primary-800 text-white font-heading"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchFilters;
