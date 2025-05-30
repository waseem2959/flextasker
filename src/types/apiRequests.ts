/**
 * API Request Types (Bridge File)
 * 
 * ⚠️ DEPRECATION NOTICE ⚠️
 * This file is a bridge for backward compatibility.
 * New code should use the consolidated API types defined in:
 * - '@/types/api.ts' for API response and request models
 * - '@/types/apiClient.ts' for client implementation types
 * - '@/types/consolidatedModels.ts' for domain models
 */

// Log deprecation warning in development
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'DEPRECATION NOTICE: Using types/apiRequests.ts is deprecated. ' +
    'Please use types/apiClient.ts for API client types and types/api.ts for API models.'
  );
}

// Re-export everything from the consolidated implementation
export * from './apiClient';
