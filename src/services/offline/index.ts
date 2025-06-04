/**
 * Offline Services Index
 * 
 * This file exports the consolidated offline queue service
 */

// Export the consolidated offline service as the main implementation
export {
    offlineQueueCore,
    offlineQueueManager,
    useOfflineQueue, type OfflineQueueManager, type QueuedRequest,
    type QueueRequestOptions,
    type QueueStats
} from './consolidated-offline-service';

// Re-export as default
export { default } from './consolidated-offline-service';
