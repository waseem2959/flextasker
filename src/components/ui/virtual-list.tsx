/**
 * Virtual List Component
 * 
 * Efficiently renders large lists by only rendering visible items
 * Improves performance for lists with hundreds or thousands of items
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight: number;
  containerClassName?: string;
  itemClassName?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  containerClassName,
  itemClassName,
  overscan = 3,
  onScroll,
  getItemKey = (_, index) => index
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const isFixedHeight = typeof itemHeight === 'number';
  const getItemHeight = useCallback(
    (index: number) => {
      return isFixedHeight ? itemHeight : itemHeight(index);
    },
    [itemHeight, isFixedHeight]
  );

  // Calculate which items are visible
  const calculateVisibleRange = useCallback(() => {
    if (isFixedHeight) {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
      return { startIndex, endIndex };
    } else {
      // For variable heights, we need to iterate
      let accumulatedHeight = 0;
      let startIndex = 0;
      let endIndex = items.length - 1;
      
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        
        if (accumulatedHeight + height >= scrollTop && startIndex === 0) {
          startIndex = Math.max(0, i - overscan);
        }
        
        if (accumulatedHeight >= scrollTop + containerHeight) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
        
        accumulatedHeight += height;
      }
      
      return { startIndex, endIndex };
    }
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan, isFixedHeight, getItemHeight]);

  const { startIndex, endIndex } = calculateVisibleRange();
  
  // Calculate total height and offset
  const totalHeight = isFixedHeight
    ? items.length * itemHeight
    : items.reduce((acc, _, index) => acc + getItemHeight(index), 0);
    
  const offsetY = isFixedHeight
    ? startIndex * itemHeight
    : items.slice(0, startIndex).reduce((acc, _, index) => acc + getItemHeight(index), 0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const height = getItemHeight(actualIndex);
            
            return (
              <div
                key={getItemKey(item, actualIndex)}
                className={itemClassName}
                style={{ height }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for measuring dynamic item heights
export function useMeasuredItems(
  // items: T[], // Not currently used in implementation
  estimatedItemHeight: number = 50
) {
  const itemHeights = useRef<Map<number, number>>(new Map());
  
  const getItemHeight = useCallback((index: number) => {
    return itemHeights.current.get(index) || estimatedItemHeight;
  }, [estimatedItemHeight]);
  
  const measureItem = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      if (height !== itemHeights.current.get(index)) {
        itemHeights.current.set(index, height);
      }
    }
  }, []);
  
  return { getItemHeight, measureItem };
}