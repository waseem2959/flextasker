/**
 * Geospatial Search Component
 * 
 * Advanced geospatial search with clustering, heatmaps, and proximity optimization.
 * Implements project-map specifications for location-based marketplace search.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Compass, Globe, Layers, MapPin, Navigation, Target } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
}

export interface GeoBounds {
  northeast: GeoLocation;
  southwest: GeoLocation;
}

export interface GeoCluster {
  id: string;
  center: GeoLocation;
  count: number;
  radius: number;
  items: GeoSearchResult[];
  density: number;
}

export interface GeoSearchResult {
  id: string;
  title: string;
  location: GeoLocation;
  distance: number; // in km
  category: string;
  price: number;
  rating: number;
  isAvailable: boolean;
  urgency?: 'low' | 'medium' | 'high';
}

export interface GeoSearchParams {
  center: GeoLocation;
  radius: number; // in km
  bounds?: GeoBounds;
  clustering: boolean;
  heatmap: boolean;
  sortBy: 'distance' | 'relevance' | 'price' | 'rating';
  maxResults: number;
}

interface GeospatialSearchProps {
  onSearch: (params: GeoSearchParams) => Promise<GeoSearchResult[]>;
  onLocationSelect: (location: GeoLocation) => void;
  initialLocation?: GeoLocation;
  className?: string;
  showMap?: boolean;
  enableClustering?: boolean;
}

/**
 * Distance Calculator Utility
 */
const calculateDistance = (point1: GeoLocation, point2: GeoLocation): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Geo Clustering Algorithm
 */
const clusterResults = (results: GeoSearchResult[], maxDistance: number = 2): GeoCluster[] => {
  const clusters: GeoCluster[] = [];
  const processed = new Set<string>();

  results.forEach(result => {
    if (processed.has(result.id)) return;

    const cluster: GeoCluster = {
      id: `cluster-${clusters.length}`,
      center: result.location,
      count: 1,
      radius: 0,
      items: [result],
      density: 1,
    };

    // Find nearby results
    results.forEach(other => {
      if (other.id !== result.id && !processed.has(other.id)) {
        const distance = calculateDistance(result.location, other.location);
        if (distance <= maxDistance) {
          cluster.items.push(other);
          cluster.count++;
          processed.add(other.id);
          
          // Update cluster center (centroid)
          const totalLat = cluster.items.reduce((sum, item) => sum + item.location.lat, 0);
          const totalLng = cluster.items.reduce((sum, item) => sum + item.location.lng, 0);
          cluster.center = {
            lat: totalLat / cluster.items.length,
            lng: totalLng / cluster.items.length,
          };
          
          // Update cluster radius
          cluster.radius = Math.max(cluster.radius, distance);
        }
      }
    });

    cluster.density = cluster.count / (Math.PI * Math.pow(cluster.radius || 0.5, 2));
    processed.add(result.id);
    clusters.push(cluster);
  });

  return clusters.sort((a, b) => b.count - a.count);
};

/**
 * Location Input Component
 */
const LocationInput: React.FC<{
  location: GeoLocation | null;
  onCurrentLocation: () => void;
  isGettingLocation: boolean;
}> = ({ location, onCurrentLocation, isGettingLocation }) => {
  const [address, setAddress] = useState(location?.address ?? '');

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // In real implementation, this would trigger geocoding
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-neutral-700">Search Location</Label>
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter address or landmark"
          className="w-full pl-10 pr-12 py-2 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onCurrentLocation}
          disabled={isGettingLocation}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          {isGettingLocation ? (
            <div className="animate-spin w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
        </Button>
      </div>
      
      {location && (
        <div className="text-xs text-neutral-600">
          Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          {location.accuracy && ` (±${location.accuracy}m)`}
        </div>
      )}
    </div>
  );
};

/**
 * Get cluster color based on density
 */
const getClusterColor = (density: number): string => {
  if (density > 5) return "bg-red-500";
  if (density > 2) return "bg-orange-500";
  if (density > 1) return "bg-yellow-500";
  return "bg-green-500";
};

/**
 * Cluster Visualization Component
 */
const ClusterVisualization: React.FC<{
  clusters: GeoCluster[];
  onClusterSelect: (cluster: GeoCluster) => void;
  selectedCluster?: string;
}> = ({ clusters, onClusterSelect, selectedCluster }) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-neutral-700">Result Clusters</Label>
      
      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {clusters.map((cluster) => (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-3 border rounded-lg cursor-pointer transition-all duration-200",
              selectedCluster === cluster.id
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 hover:border-primary-300 hover:bg-primary-25"
            )}
            onClick={() => onClusterSelect(cluster)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                  getClusterColor(cluster.density)
                )}>
                  {cluster.count}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    Cluster {clusters.indexOf(cluster) + 1}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {cluster.radius.toFixed(1)}km radius
                  </div>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {cluster.density.toFixed(1)} density
              </Badge>
            </div>
            
            <div className="mt-2 text-xs text-neutral-600">
              Center: {cluster.center.lat.toFixed(4)}, {cluster.center.lng.toFixed(4)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Geospatial Search Component
 */
export const GeospatialSearch: React.FC<GeospatialSearchProps> = ({
  onSearch,
  onLocationSelect,
  initialLocation,
  className,
  showMap = true,
  enableClustering = true,

}) => {
  const [searchLocation, setSearchLocation] = useState<GeoLocation | null>(
    initialLocation || null
  );
  const [searchRadius, setSearchRadius] = useState([5]);
  const [clustering, setClustering] = useState(enableClustering);
  const [heatmap, setHeatmap] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'relevance' | 'price' | 'rating'>('distance');
  const [maxResults] = useState(50);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [clusters, setClusters] = useState<GeoCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>();

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: GeoLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: 'Current Location',
        };
        
        setSearchLocation(location);
        onLocationSelect(location);
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
        maximumAge: 300000,
      }
    );
  }, [onLocationSelect]);

  // Perform geospatial search
  const handleSearch = useCallback(async () => {
    if (!searchLocation) {
      alert('Please select a search location first.');
      return;
    }

    setIsSearching(true);
    
    try {
      const searchParams: GeoSearchParams = {
        center: searchLocation,
        radius: searchRadius[0],
        clustering,
        heatmap,
        sortBy,
        maxResults,
      };
      
      const searchResults = await onSearch(searchParams);
      setResults(searchResults);
      
      // Generate clusters if enabled
      if (clustering && searchResults.length > 0) {
        const resultClusters = clusterResults(searchResults, searchRadius[0] * 0.1);
        setClusters(resultClusters);
      } else {
        setClusters([]);
      }
    } catch (error) {
      console.error('Geospatial search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchLocation, searchRadius, clustering, heatmap, sortBy, maxResults, onSearch]);

  // Handle cluster selection
  const handleClusterSelect = useCallback((cluster: GeoCluster) => {
    setSelectedCluster(cluster.id);
    onLocationSelect(cluster.center);
  }, [onLocationSelect]);

  // Calculate search area
  const searchArea = useMemo(() => {
    if (!searchLocation) return 0;
    return Math.PI * Math.pow(searchRadius[0], 2);
  }, [searchLocation, searchRadius]);

  return (
    <div className={cn("geospatial-search space-y-6", className)}>
      {/* Header */}
      <Card className="border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-heading text-primary-900">
                Geospatial Search
              </CardTitle>
              <p className="text-primary-700 font-body">
                Location-aware search with clustering and proximity optimization
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Search Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Input */}
              <LocationInput
                location={searchLocation}
                onCurrentLocation={getCurrentLocation}
                isGettingLocation={isGettingLocation}
              />

              {/* Search Radius */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">
                  Search Radius: {searchRadius[0]}km
                </Label>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>1km</span>
                  <span>25km</span>
                  <span>50km</span>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-neutral-700">
                    Enable Clustering
                  </Label>
                  <Switch
                    checked={clustering}
                    onCheckedChange={setClustering}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-neutral-700">
                    Show Heatmap
                  </Label>
                  <Switch
                    checked={heatmap}
                    onCheckedChange={setHeatmap}
                  />
                </div>
              </div>

              {/* Search Stats */}
              {searchLocation && (
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <div className="text-xs text-neutral-600 space-y-1">
                    <div>Search Area: {searchArea.toFixed(1)} km²</div>
                    <div>Max Results: {maxResults}</div>
                    {results.length > 0 && (
                      <div>Found: {results.length} results</div>
                    )}
                  </div>
                </div>
              )}

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={!searchLocation || isSearching}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-heading"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Search Area
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cluster Visualization */}
          {clustering && clusters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  <Layers className="w-5 h-5 inline mr-2" />
                  Clusters ({clusters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClusterVisualization
                  clusters={clusters}
                  onClusterSelect={handleClusterSelect}
                  selectedCluster={selectedCluster}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Placeholder */}
          {showMap && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  <Compass className="w-5 h-5 inline mr-2" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600 font-body">
                      Interactive map would be rendered here
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Integration with Google Maps, Mapbox, or similar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  Search Results ({results.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.slice(0, 10).map((result) => (
                    <div
                      key={result.id}
                      className="p-3 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 font-heading">
                            {result.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {result.distance.toFixed(1)}km away
                            </span>
                            <span>${result.price}</span>
                            <span>★ {result.rating}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {result.urgency && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                result.urgency === 'high' && "bg-red-50 text-red-700 border-red-200",
                                result.urgency === 'medium' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                result.urgency === 'low' && "bg-green-50 text-green-700 border-green-200"
                              )}
                            >
                              {result.urgency} priority
                            </Badge>
                          )}
                          
                          {result.isAvailable && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isSearching && results.length === 0 && searchLocation && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="font-medium text-neutral-900 font-heading mb-2">
                  No Results Found
                </h3>
                <p className="text-neutral-600 font-body">
                  Try expanding your search radius or adjusting your location.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeospatialSearch;
