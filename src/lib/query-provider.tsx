/**
 * React Query Provider Component
 * 
 * Provides the React Query context to the application with our enhanced
 * TypeScript implementation and error handling.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { queryClient } from './query-client';

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Enhanced React Query Provider with TypeScript improvements
 * 
 * @param children - Child components to be wrapped
 * @returns Provider component with proper TypeScript typing
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools can be added here if @tanstack/react-query-devtools is installed */}
    </QueryClientProvider>
  );
}
