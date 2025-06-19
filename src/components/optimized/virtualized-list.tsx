/**
 * Virtualized List Component
 * 
 * High-performance list component for rendering large datasets efficiently
 */

import React, { useCallback, useMemo } from 'react';
import { useVirtualScrolling } from '../../utils/lazy-loading';

// Virtualized list props
export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
}

/**
 * Virtualized list component for efficient rendering of large lists
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey = (_, index) => index,
  overscan = 5,
  className = '',
  onScroll,
  loading = false,
  loadingComponent: LoadingComponent,
  emptyComponent: EmptyComponent
}: VirtualizedListProps<T>) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll: virtualScrollHandler
  } = useVirtualScrolling(items, {
    itemHeight,
    containerHeight,
    overscan
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    virtualScrollHandler(e);
    onScroll?.(e.currentTarget.scrollTop);
  }, [virtualScrollHandler, onScroll]);

  // Memoize visible items to prevent unnecessary re-renders
  const memoizedVisibleItems = useMemo(() => 
    visibleItems.map(({ item, index }) => (
      <div
        key={getItemKey(item, index)}
        style={{
          height: itemHeight,
          transform: `translateY(${index * itemHeight}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}
      >
        {renderItem(item, index)}
      </div>
    ))
  , [visibleItems, itemHeight, renderItem, getItemKey]);

  if (loading && LoadingComponent) {
    return <LoadingComponent />;
  }

  if (items.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <div
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      data-testid="virtualized-container"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {memoizedVisibleItems}
        </div>
      </div>
    </div>
  );
}

// Higher-order component for adding virtualization to existing lists
export interface WithVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function withVirtualization<T, P extends { items: T[] }>(
  Component: React.ComponentType<P>,
  options: WithVirtualizationOptions
) {
  return React.memo((props: P) => {
    const { items, ...otherProps } = props;
    
    return (
      <VirtualizedList
        items={items}
        itemHeight={options.itemHeight}
        containerHeight={options.containerHeight}
        overscan={options.overscan}
        renderItem={(item, index) => (
          <Component {...otherProps as P} items={[item]} key={index} />
        )}
      />
    );
  });
}

// Virtualized table component
export interface VirtualizedTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    header: React.ReactNode;
    render: (item: T, index: number) => React.ReactNode;
    width?: string | number;
  }>;
  rowHeight: number;
  containerHeight: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function VirtualizedTable<T>({
  items,
  columns,
  rowHeight,
  containerHeight,
  className = '',
  headerClassName = '',
  rowClassName = '',
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}: VirtualizedTableProps<T>) {
  const renderRow = useCallback((item: T, index: number) => {
    const rowClass = typeof rowClassName === 'function' 
      ? rowClassName(item, index) 
      : rowClassName;

    return (
      <div
        className={`flex border-b hover:bg-gray-50 cursor-pointer ${rowClass}`}
        onClick={() => onRowClick?.(item, index)}
        style={{ height: rowHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-center px-4"
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.render(item, index)}
          </div>
        ))}
      </div>
    );
  }, [columns, rowHeight, rowClassName, onRowClick]);

  if (loading) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="flex items-center justify-center p-8 text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`flex bg-gray-50 border-b font-medium ${headerClassName}`}>
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-3"
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized rows */}
      <VirtualizedList
        items={items}
        itemHeight={rowHeight}
        containerHeight={containerHeight - 49} // Subtract header height
        renderItem={renderRow}
        getItemKey={(_, index) => `row-${index}`}
      />
    </div>
  );
}

// Export default virtualized list
export default VirtualizedList;