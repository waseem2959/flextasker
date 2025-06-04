import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Search, Star } from 'lucide-react';
import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';

interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  date: string;
  tasker: {
    name: string;
    rating: number;
    completedTasks: number;
  };
}

interface RenderSearchResultsProps {
  results: SearchResultItem[];
  onClearFilters: () => void;
}

const RenderSearchResults = ({ results, onClearFilters }: RenderSearchResultsProps) => {
  if (results.length === 0) {
    return (
      <EmptyState 
        icon={<Search size={24} />}
        title="No results found"
        description="Try adjusting your search or filter criteria to find what you're looking for."
        actionLabel="Clear Filters"
        onAction={onClearFilters}
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-[hsl(220,14%,46%)]">Showing <span className="font-medium">{results.length}</span> results</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[hsl(220,14%,46%)]">Sort by:</span>
          <select 
            className="text-sm border border-[hsl(215,16%,80%)] rounded-md p-1 bg-white text-[hsl(206,33%,16%)]"
            aria-label="Sort results by"
            title="Sort results by"
            name="sort-options"
          >
            <option>Relevance</option>
            <option>Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Rating</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {results.map(result => (
          <Card key={result.id} className="p-6 border-[hsl(215,16%,80%)] hover:border-[hsl(196,80%,43%)] transition-colors">
            <div className="flex justify-between mb-2">
              <h3 className="text-xl font-semibold text-[hsl(206,33%,16%)]">{result.title}</h3>
              <span className="text-lg font-bold text-[hsl(196,80%,43%)]">${result.price}</span>
            </div>
            
            <p className="text-[hsl(220,14%,46%)] mb-4">{result.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-[hsl(196,80%,95%)] text-[hsl(196,80%,43%)] border-[hsl(196,80%,43%)]/30">
                {result.category}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-[hsl(215,16%,80%)]">
                <MapPin size={14} />
                {result.location}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 border-[hsl(215,16%,80%)]">
                <Calendar size={14} />
                {new Date(result.date).toLocaleDateString()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[hsl(196,80%,95%)] flex items-center justify-center text-[hsl(196,80%,43%)]">
                  {result.tasker.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[hsl(206,33%,16%)]">{result.tasker.name}</p>
                  <div className="flex items-center text-sm">
                    <Star size={14} className="text-[hsl(38,92%,50%)] mr-1" />
                    <span className="text-[hsl(220,14%,46%)]">{result.tasker.rating} • {result.tasker.completedTasks} tasks</span>
                  </div>
                </div>
              </div>
              <Button className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)] text-white">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
};

interface SearchFilters {
  category: string[];
  location: string[];
  dateRange: string;
  priceRange: [number, number];
  rating: number | null;
}

const categories = [
  'Cleaning',
  'Handyman',
  'Moving',
  'Gardening',
  'Electrical',
  'Plumbing',
  'Painting',
  'Tutoring',
  'Pet Care'
];

const locations = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego'
];

const SearchResults = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    category: [],
    location: [],
    dateRange: 'anytime',
    priceRange: [0, 500],
    rating: null,
  });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock search function - in a real app this would call an API
  const handleSearch = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (searchQuery.trim() === '') {
        setResults([]);
      } else {
        // Mock data - would come from API in real app
        setResults([
          {
            id: 1,
            title: 'House Cleaning Service',
            description: 'Deep cleaning for a 2-bedroom apartment',
            category: 'Cleaning',
            location: 'New York',
            price: 120,
            date: '2025-06-15',
            rating: 4.8,
            reviews: 24,
            tasker: {
              name: 'Alex Johnson',
              rating: 4.9,
              completedTasks: 156
            }
          },
          {
            id: 2,
            title: 'Furniture Assembly',
            description: 'Assembly of IKEA furniture - 3 items',
            category: 'Handyman',
            location: 'New York',
            price: 85,
            date: '2025-06-10',
            rating: 4.6,
            reviews: 18,
            tasker: {
              name: 'Sam Wilson',
              rating: 4.7,
              completedTasks: 93
            }
          },
          {
            id: 3,
            title: 'Moving Assistance',
            description: 'Help moving from a studio to a 1-bedroom apartment',
            category: 'Moving',
            location: 'Chicago',
            price: 150,
            date: '2025-06-22',
            rating: 4.5,
            reviews: 12,
            tasker: {
              name: 'Maria Garcia',
              rating: 4.8,
              completedTasks: 74
            }
          }
        ]);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => {
      if (filterType === 'category' || filterType === 'location') {
        // Toggle selection for array type filters
        const currentValues = prev[filterType];
        return {
          ...prev,
          [filterType]: currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value]
        };
      }
      
      // Direct assignment for non-array filters
      return {
        ...prev,
        [filterType]: value
      };
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)] mb-2">Search Results</h1>
          <p className="text-[hsl(220,14%,46%)]">Find the perfect tasker for your needs</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(220,14%,46%)]" size={18} />
            <Input 
              type="text"
              placeholder="Search for tasks or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[hsl(215,16%,80%)] focus:border-[hsl(196,80%,43%)] h-11"
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)] text-white h-11"
          >
            Search
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-1/4">
            <Card className="p-4 border-[hsl(215,16%,80%)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[hsl(206,33%,16%)]">Filters</h2>
                <Button variant="ghost" size="sm" className="text-[hsl(196,80%,43%)] hover:text-[hsl(196,80%,38%)] p-0">
                  Clear All
                </Button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[hsl(206,33%,16%)] mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.slice(0, 5).map(category => (
                    <div key={category} className="flex items-center">
                      <Checkbox 
                        id={`category-${category}`} 
                        checked={filters.category.includes(category)}
                        onCheckedChange={() => handleFilterChange('category', category)}
                        className="border-[hsl(215,16%,80%)] data-[state=checked]:bg-[hsl(196,80%,43%)] data-[state=checked]:border-[hsl(196,80%,43%)]"
                      />
                      <label 
                        htmlFor={`category-${category}`} 
                        className="ml-2 text-sm text-[hsl(220,14%,46%)]"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
                {categories.length > 5 && (
                  <Button variant="link" size="sm" className="text-[hsl(196,80%,43%)] p-0 mt-2">
                    Show more
                  </Button>
                )}
              </div>

              <Separator className="bg-[hsl(215,16%,90%)] my-4" />

              {/* Locations */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[hsl(206,33%,16%)] mb-3">Location</h3>
                <div className="space-y-2">
                  {locations.slice(0, 5).map(location => (
                    <div key={location} className="flex items-center">
                      <Checkbox 
                        id={`location-${location}`} 
                        checked={filters.location.includes(location)}
                        onCheckedChange={() => handleFilterChange('location', location)}
                        className="border-[hsl(215,16%,80%)] data-[state=checked]:bg-[hsl(196,80%,43%)] data-[state=checked]:border-[hsl(196,80%,43%)]"
                      />
                      <label 
                        htmlFor={`location-${location}`} 
                        className="ml-2 text-sm text-[hsl(220,14%,46%)]"
                      >
                        {location}
                      </label>
                    </div>
                  ))}
                </div>
                {locations.length > 5 && (
                  <Button variant="link" size="sm" className="text-[hsl(196,80%,43%)] p-0 mt-2">
                    Show more
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="w-full md:w-3/4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6 border-[hsl(215,16%,80%)] animate-pulse">
                    <div className="h-6 bg-[hsl(215,16%,90%)] rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-[hsl(215,16%,90%)] rounded w-full mb-2"></div>
                    <div className="h-4 bg-[hsl(215,16%,90%)] rounded w-5/6 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-[hsl(215,16%,90%)] rounded w-20"></div>
                      <div className="h-6 bg-[hsl(215,16%,90%)] rounded w-24"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-[hsl(215,16%,90%)] rounded w-28"></div>
                      <div className="h-8 bg-[hsl(215,16%,90%)] rounded w-24"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <RenderSearchResults 
                results={results} 
                onClearFilters={() => {
                  setFilters({
                    category: [],
                    location: [],
                    dateRange: 'anytime',
                    priceRange: [0, 500],
                    rating: null
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchResults;
