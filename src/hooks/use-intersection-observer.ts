/**
 * Intersection Observer Hook
 * 
 * Custom hook for implementing lazy loading and performance optimizations
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false
}: UseIntersectionObserverProps = {}): [
  (node: Element | null) => void,
  IntersectionObserverEntry | undefined
] {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = useRef(false);

  const updateEntry = useCallback(
    ([entry]: IntersectionObserverEntry[]): void => {
      if (frozen.current && freezeOnceVisible) return;
      
      setEntry(entry);
      
      if (entry.isIntersecting && freezeOnceVisible) {
        frozen.current = true;
      }
    },
    [freezeOnceVisible]
  );

  const [node, setNode] = useState<Element | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!node) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin
    });

    observer.current.observe(node);

    return () => {
      observer.current?.disconnect();
    };
  }, [node, threshold, root, rootMargin, updateEntry]);

  return [setNode, entry];
}