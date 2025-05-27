/**
 * Offline Queue Module
 * 
 * This is the main entry point for the offline queue functionality.
 * It exports the manager interface for application components and 
 * re-exports necessary types.
 */

// Re-export types from the central API requests types file
export type { QueuedRequest, QueueRequestOptions, QueueStats } from '@/types/api-requests';
export { RequestStatus, ConflictStrategy } from '@/types/api-requests';

// Re-export types specific to the offline queue module
export * from './types';

// Export the core functionality for advanced usage
export { offlineQueueCore } from './core';

// Export the manager for regular application use
export { offlineQueueManager, useOfflineQueue } from './manager';

// Import for the default export
import { offlineQueueManager, useOfflineQueue } from './manager';

// Default export for convenience
export default { offlineQueueManager, useOfflineQueue } as const;
