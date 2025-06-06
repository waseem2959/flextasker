/**
 * Location Search Component
 * 
 * Enhanced location search with autocomplete and geolocation support.
 * Implements project-map specifications for location-based task discovery.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MapPin, Navigation, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface LocationSuggestion {
  id: string;
  displayName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'city' | 'suburb' | 'postcode' | 'address';
}

export interface LocationSearchValue {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  includeRemote?: boolean;
}

interface LocationSearchProps {
  value: LocationSearchValue;
  onChange: (value: LocationSearchValue) => void;
  placeholder?: string;
  className?: string;
  showRadius?: boolean;
  showRemoteOption?: boolean;
  onLocationSelect?: (location: LocationSuggestion) => void;
  disabled?: boolean;
}

/**
 * Mock location suggestions - In real implementation, this would call a geocoding API
 */
const mockLocationSuggestions = (query: string): LocationSuggestion[] => {
  if (query.length < 2) return [];
  
  const suggestions: LocationSuggestion[] = [
    {
      id: '1',
      displayName: 'Sydney, NSW',
      address: 'Sydney NSW, Australia',
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      coordinates: { lat: -33.8688, lng: 151.2093 },
      type: 'city',
    },
    {
      id: '2',
      displayName: 'Melbourne, VIC',
      address: 'Melbourne VIC, Australia',
      city: 'Melbourne',
      state: 'VIC',
      country: 'Australia',
      coordinates: { lat: -37.8136, lng: 144.9631 },
      type: 'city',
    },
    {
      id: '3',
      displayName: 'Brisbane, QLD',
      address: 'Brisbane QLD, Australia',
      city: 'Brisbane',
      state: 'QLD',
      country: 'Australia',
      coordinates: { lat: -27.4698, lng: 153.0251 },
      type: 'city',
    },
  ];
  
  return suggestions.filter(s => 
    s.displayName.toLowerCase().includes(query.toLowerCase()) ||
    s.address.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * Location Search Component
 */
export const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  placeholder = "Enter city, suburb, or postcode",
  className,
  showRadius = true,
  showRemoteOption = true,
  onLocationSelect,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value.address || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const results = mockLocationSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsLoading(false);
      }, 300);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange({
      ...value,
      address: newQuery,
      coordinates: undefined, // Clear coordinates when typing
    });
  }, [value, onChange]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: LocationSuggestion) => {
    setQuery(suggestion.displayName);
    setShowSuggestions(false);
    
    const newValue: LocationSearchValue = {
      ...value,
      address: suggestion.displayName,
      coordinates: suggestion.coordinates,
    };
    
    onChange(newValue);
    onLocationSelect?.(suggestion);
    inputRef.current?.blur();
  }, [value, onChange, onLocationSelect]);

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // In real implementation, reverse geocode to get address
        const newValue: LocationSearchValue = {
          ...value,
          address: 'Current Location',
          coordinates: { lat: latitude, lng: longitude },
        };
        
        setQuery('Current Location');
        onChange(newValue);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [value, onChange]);

  // Clear location
  const handleClear = useCallback(() => {
    setQuery('');
    setShowSuggestions(false);
    onChange({
      ...value,
      address: '',
      coordinates: undefined,
    });
    inputRef.current?.focus();
  }, [value, onChange]);

  // Handle radius change
  const handleRadiusChange = useCallback((radius: number) => {
    onChange({
      ...value,
      radius,
    });
  }, [value, onChange]);

  // Handle remote option toggle
  const handleRemoteToggle = useCallback(() => {
    onChange({
      ...value,
      includeRemote: !value.includeRemote,
    });
  }, [value, onChange]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const radiusOptions = [5, 10, 25, 50, 100];

  return (
    <div className={cn("location-search relative", className)}>
      {/* Main Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          <MapPin className="w-4 h-4" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10 pr-20 transition-all duration-200",
            showSuggestions && "border-primary-500 ring-2 ring-primary-500/20"
          )}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
          
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-neutral-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation || disabled}
            className="h-6 w-6 p-0 hover:bg-primary-50 text-primary-600"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors duration-150 border-b border-neutral-100 last:border-b-0 focus:bg-primary-50 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {suggestion.displayName}
                    </div>
                    <div className="text-sm text-neutral-600 truncate">
                      {suggestion.address}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Options */}
      {(showRadius || showRemoteOption) && value.address && (
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {/* Radius Selection */}
          {showRadius && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700">Radius:</span>
              <div className="flex gap-1">
                {radiusOptions.map((radius) => (
                  <Button
                    key={radius}
                    variant={value.radius === radius ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRadiusChange(radius)}
                    className={cn(
                      "h-7 px-2 text-xs",
                      value.radius === radius 
                        ? "bg-primary-600 text-white" 
                        : "text-neutral-600 hover:text-primary-600"
                    )}
                  >
                    {radius}km
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Remote Option */}
          {showRemoteOption && (
            <Button
              variant={value.includeRemote ? "default" : "outline"}
              size="sm"
              onClick={handleRemoteToggle}
              className={cn(
                "h-7 px-3 text-xs",
                value.includeRemote 
                  ? "bg-primary-600 text-white" 
                  : "text-neutral-600 hover:text-primary-600"
              )}
            >
              Include Remote
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
