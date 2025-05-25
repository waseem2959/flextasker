// src/hooks/useApiError.ts
import { useCallback } from 'react';

interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{ field: string; message: string }>;
}

export function useApiError() {
  const handleError = useCallback((error: unknown): ApiError => {
    if (error instanceof Error) {
      const apiError = error as any;
      
      return {
        message: apiError.message ?? 'An unexpected error occurred',
        status: apiError.status,
        errors: apiError.data?.errors,
      };
    }
    
    return {
      message: 'An unexpected error occurred',
    };
  }, []);
  
  return { handleError };
}