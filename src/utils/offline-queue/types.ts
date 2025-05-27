/**
 * Offline Queue Types
 * 
 * This file contains type definitions specifically for the offline queue system.
 * Most general types are defined in src/types/api-requests.ts
 */

import { 
  RequestStatus, 
  ConflictStrategy, 
  QueuedRequest, 
  QueueRequestOptions,
  QueueStats
} from '@/types/api-requests';

/**
 * Database schema for the offline queue IndexedDB
 */
export interface OfflineQueueDB {
  requests: {
    key: string;
    value: QueuedRequest;
    indexes: {
      'by-status': string;
      'by-url': string;
      'by-timestamp': number;
    };
  };
}

/**
 * Core offline queue functionality interface
 */
export interface OfflineQueueCore {
  /**
   * Initialize the offline queue database
   */
  init(): Promise<void>;
  
  /**
   * Add a request to the queue
   * @returns The ID of the queued request
   */
  enqueue(request: QueueRequestOptions): Promise<string>;
  
  /**
   * Process the entire queue or a specific request
   * @param requestId Optional ID of a specific request to process
   * @param onProgress Optional callback for progress updates
   */
  process(requestId?: string, onProgress?: (processed: number, total: number) => void): Promise<void>;
  
  /**
   * Get statistics about the current queue state
   */
  getStats(): Promise<QueueStats>;
  
  /**
   * Get all requests with a specific status
   */
  getRequestsByStatus(status: RequestStatus): Promise<QueuedRequest[]>;
  
  /**
   * Clear requests with a specific status
   * @returns Number of requests cleared
   */
  clearByStatus(status: RequestStatus): Promise<number>;
  
  /**
   * Delete a specific request by ID
   */
  deleteRequest(id: string): Promise<boolean>;
  
  /**
   * Clean up and close the database connection
   */
  cleanup(): Promise<void>;
}

/**
 * Simplified interface for the queue manager used by application components
 */
export interface OfflineQueueManager {
  /**
   * Add a request to the queue
   * @returns The ID of the queued request
   */
  enqueue(request: QueueRequestOptions): Promise<string>;
  
  /**
   * Process all pending requests in the queue
   */
  processQueue(): Promise<void>;
  
  /**
   * Get the number of pending and processing requests
   */
  getQueueLength(): Promise<number>;
  
  /**
   * Get all pending and processing requests
   */
  getPendingRequests(): Promise<QueuedRequest[]>;
  
  /**
   * Clear all completed requests
   * @returns Number of requests cleared
   */
  clearCompletedRequests(): Promise<number>;
  
  /**
   * Check if queue is currently processing
   */
  isProcessing(): boolean;
  
  /**
   * Register a callback for queue changes
   * @returns Function to unsubscribe
   */
  onQueueChange(callback: (queueLength: number) => void): () => void;
}

/**
 * Hook return type for useOfflineQueue
 */
export interface UseOfflineQueueReturn {
  enqueue: (request: QueueRequestOptions) => Promise<void>;
  processQueue: () => Promise<void>;
  clearCompleted: () => Promise<number>;
  isProcessing: () => boolean;
  queueLength: number;
}
