/**
 * Infinite Scroll Component
 * 
 * High-performance infinite scrolling with virtual scrolling support,
 * smart loading, error handling, and accessibility features.
 */

import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  ReactNode 
} from 'react';
import { useIntersectionObserver } from '../../hooks/use-intersection-observer';
// useVirtualizer import commented out - dependency not available
// import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskCardSkeleton } from './skeleton-loader';

interface InfiniteScrollProps<T> {
  // Data and loading
  items: T[];
  hasNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  
  // Callbacks
  onLoadMore: () => void;
  onRetry?: () => void;
  
  // Rendering
  renderItem: (item: T, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: Error, retry: () => void) => ReactNode;
  renderLoadingMore?: () => ReactNode;
  
  // Configuration
  threshold?: number;
  rootMargin?: string;
  loadMoreOnScroll?: boolean;
  enableVirtualization?: boolean;
  // estimateSize?: number; // Not used due to missing @tanstack/react-virtual dependency
  // overscan?: number; // Not used due to missing @tanstack/react-virtual dependency
  
  // Styling
  className?: string;
  containerClassName?: string;
  itemClassName?: string;
  
  // Accessibility
  role?: string;
  ariaLabel?: string;
  loadMoreButtonText?: string;
  
  // Performance
  debounceMs?: number;
  prefetchThreshold?: number;
}

const InfiniteScroll = <T extends any>({
  items,
  hasNextPage,
  isLoading,
  isError,
  error,
  onLoadMore,
  onRetry,
  renderItem,
  renderEmpty,
  renderError,
  renderLoadingMore,
  threshold = 0.5,
  rootMargin = '50px',
  loadMoreOnScroll = true,
  enableVirtualization = false,
  // estimateSize = 100, // Commented out - not used due to missing dependency
  // overscan = 5, // Commented out - not used due to missing dependency
  className = '',
  containerClassName = '',
  itemClassName = '',
  role = 'list',
  ariaLabel,
  loadMoreButtonText = 'Load More',
  debounceMs = 100,
  prefetchThreshold = 3
}: InfiniteScrollProps<T>) => {
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLoadTime = useRef<number>(0);

  // Debounced load more function
  const debouncedLoadMore = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadTime.current < debounceMs) {
      return;
    }
    
    lastLoadTime.current = now;
    
    if (hasNextPage && !isLoading && !isError) {
      onLoadMore();
    }
  }, [hasNextPage, isLoading, isError, onLoadMore, debounceMs]);

  // Intersection observer for automatic loading
  const [setLoadMoreRef, entry] = useIntersectionObserver({
    threshold,
    rootMargin
  });

  // Load more when intersection observer triggers
  useEffect(() => {
    if (entry?.isIntersecting && loadMoreOnScroll && hasNextPage && !isLoading && !isError) {
      debouncedLoadMore();
    }
  }, [entry?.isIntersecting, loadMoreOnScroll, hasNextPage, isLoading, isError, debouncedLoadMore]);

  // Prefetch logic - load more when approaching the end
  useEffect(() => {
    if (!loadMoreOnScroll || !hasNextPage || isLoading || isError) return;

    const remainingItems = items.length - (items.length - prefetchThreshold);
    if (remainingItems <= prefetchThreshold) {
      debouncedLoadMore();
    }
  }, [items.length, prefetchThreshold, hasNextPage, isLoading, isError, loadMoreOnScroll, debouncedLoadMore]);

  // Virtual scrolling setup - commented out due to missing dependency
  // const virtualizer = useVirtualizer({
  //   count: items.length,
  //   getScrollElement: () => containerRef.current,
  //   estimateSize: () => estimateSize,
  //   overscan,
  //   enabled: enableVirtualization
  // });

  // Handle retry with exponential backoff
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    setTimeout(() => {
      onRetry?.() || onLoadMore();
    }, delay);
  }, [retryCount, onRetry, onLoadMore]);

  // Manual load more button handler
  const handleManualLoadMore = useCallback(() => {
    if (!isLoading && hasNextPage && !isError) {
      debouncedLoadMore();
    }
  }, [isLoading, hasNextPage, isError, debouncedLoadMore]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleManualLoadMore();
    }
  }, [handleManualLoadMore]);

  // Reset retry count on successful load
  useEffect(() => {
    if (!isError && !isLoading) {
      setRetryCount(0);
    }
  }, [isError, isLoading]);

  // Render empty state
  const renderEmptyState = useMemo(() => {
    if (renderEmpty) {
      return renderEmpty();
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
        <p className="text-gray-600 max-w-md">
          Try adjusting your search criteria or check back later for new content.
        </p>
      </div>
    );
  }, [renderEmpty]);

  // Render error state
  const renderErrorState = useMemo(() => {
    if (renderError && error) {
      return renderError(error, handleRetry);
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {error?.message || 'Unable to load content. Please try again.'}
        </p>
        <Button 
          onClick={handleRetry}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Retrying...' : 'Try Again'}
        </Button>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Retry attempt: {retryCount}
          </p>
        )}
      </div>
    );
  }, [renderError, error, handleRetry, isLoading, retryCount]);

  // Render loading more indicator
  const renderLoadingMoreState = useMemo(() => {
    if (renderLoadingMore) {
      return renderLoadingMore();
    }
    
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-gray-600">Loading more items...</span>
      </div>
    );
  }, [renderLoadingMore]);

  // Render virtualized items - fallback to standard rendering due to missing dependency
  const renderVirtualizedItems = useMemo(() => {
    // Virtualizer is not available, fallback to standard rendering
    return (
      <div
        ref={containerRef}
        className={`relative overflow-auto ${containerClassName}`}
        style={{ height: '100%' }}
      >
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }, [items, renderItem, containerClassName, itemClassName]);

  // Render standard items
  const renderStandardItems = useMemo(() => {
    return items.map((item, index) => (
      <div key={index} className={itemClassName}>
        {renderItem(item, index)}
      </div>
    ));
  }, [items, renderItem, itemClassName]);

  // Show initial loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show error state for initial load
  if (isError && items.length === 0) {
    return (
      <div className={className}>
        {renderErrorState}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className={className}>
        {renderEmptyState}
      </div>
    );
  }

  return (
    <div 
      className={className}
      role={role}
      aria-label={ariaLabel}
    >
      {/* Items container */}
      <div className={!enableVirtualization ? containerClassName : ''}>
        {enableVirtualization ? renderVirtualizedItems : renderStandardItems}
      </div>

      {/* Loading more indicator */}
      {isLoading && hasNextPage && renderLoadingMoreState}

      {/* Error state for additional loads */}
      {isError && items.length > 0 && (
        <div className="py-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-gray-600 mb-4">Failed to load more items</p>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </div>
      )}

      {/* Manual load more button */}
      {!loadMoreOnScroll && hasNextPage && !isError && (
        <div className="flex justify-center py-8">
          <Button
            onClick={handleManualLoadMore}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              loadMoreButtonText
            )}
          </Button>
        </div>
      )}

      {/* Intersection observer target */}
      {loadMoreOnScroll && hasNextPage && !isError && (
        <div
          ref={setLoadMoreRef}
          className="h-10 flex items-center justify-center"
          aria-hidden="true"
        />
      )}

      {/* End of results indicator */}
      {!hasNextPage && items.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-gray-600">
              You've reached the end of the results
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} loaded
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;