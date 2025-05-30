/**
 * Offline Queue Module
 * 
 * A consolidated module for the offline request queue functionality, including:
 * - Database operations (IndexedDB)
 * - Request queueing and processing
 * - Online/offline synchronization
 * - React hook for component integration
 */

import { v4 as uuidv4 } from 'uuid';
import { openDB, IDBPDatabase } from 'idb';
import { useState, useEffect } from 'react';
import { toast } from '../hooks/useToast';
import { formatErrorMessage } from './errorHandler';
import { 
  RequestStatus, 
  QueuedRequest,
  QueueRequestOptions,
  QueueStats,
  HttpMethod,
  ConflictStrategy
} from '../types/api-client';

/**
 * ======================
 * TYPE DEFINITIONS
 * ======================
 */

/**
 * Database schema for the offline queue IndexedDB
 */
interface OfflineQueueDB {
  requests: {
    key: string;
    value: QueuedRequest;
    indexes: {
      'by-status': string;
      'by-url': string;
      'by-timestamp': number;
    };
  }
}

/**
 * Core offline queue functionality interface
 */
interface OfflineQueueCore {
  init(): Promise<void>;
  enqueue(request: QueueRequestOptions): Promise<string>;
  process(requestId?: string, onProgress?: (processed: number, total: number) => void): Promise<void>;
  getStats(): Promise<QueueStats>;
  getRequestsByStatus(status: RequestStatus): Promise<QueuedRequest[]>;
  clearByStatus(status: RequestStatus): Promise<number>;
  deleteRequest(id: string): Promise<boolean>;
  cleanup(): Promise<void>;
}

/**
 * Simplified interface for the queue manager used by application components
 */
interface OfflineQueueManager {
  enqueue(request: QueueRequestOptions): Promise<string>;
  processQueue(): Promise<void>;
  getQueueLength(): Promise<number>;
  getPendingRequests(): Promise<QueuedRequest[]>;
  clearCompletedRequests(): Promise<number>;
  isProcessing(): boolean;
  onQueueChange(callback: (queueLength: number) => void): () => void;
}

/**
 * Hook return type for useOfflineQueue
 */
interface UseOfflineQueueReturn {
  enqueue: (request: QueueRequestOptions) => Promise<void>;
  processQueue: () => Promise<void>;
  clearCompleted: () => Promise<number>;
  isProcessing: boolean;
  queueLength: number;
}

/**
 * ======================
 * CORE IMPLEMENTATION
 * ======================
 */

/**
 * Core implementation of the offline queue system
 */
class OfflineQueueCoreImpl implements OfflineQueueCore {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private dbName = 'offline-queue';
  private dbVersion = 1;
  private isInitialized = false;
  
  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.db = await openDB<OfflineQueueDB>(this.dbName, this.dbVersion, {
        upgrade: (db) => this.upgrade(db),
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize offline queue database:', formatErrorMessage(error));
      throw error;
    }
  }
  
  /**
   * Database schema upgrade handler
   */
  private upgrade(db: IDBPDatabase<OfflineQueueDB>): void {
    // Create or update the requests object store
    const store = db.createObjectStore('requests', { keyPath: 'id' });
    
    // Create indexes for efficient queries
    store.createIndex('by-status', 'status');
    store.createIndex('by-url', 'url');
    store.createIndex('by-timestamp', 'timestamp');
  }
  
  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }
  
  /**
   * Add a request to the queue
   */
  async enqueue(request: QueueRequestOptions): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const id = request.id || uuidv4();
    const timestamp = Date.now();
    
    const queuedRequest: QueuedRequest = {
      id,
      url: request.url,
      method: request.method || 'GET',
      body: request.body,
      headers: request.headers || {},
      status: RequestStatus.PENDING,
      timestamp,
      priority: request.priority || 0,
      retries: 0,
      maxRetries: request.maxRetries || 3,
      timeout: request.timeout || 30000,
      conflictStrategy: request.conflictStrategy || ConflictStrategy.REPLACE
    };
    
    await this.db.put('requests', queuedRequest);
    
    return id;
  }
  
  /**
   * Process the queue or a specific request
   */
  async process(
    requestId?: string, 
    onProgress?: (processed: number, total: number) => void
  ): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // If specific request ID provided, only process that
    if (requestId) {
      const request = await this.db.get('requests', requestId);
      if (!request) {
        throw new Error(`Request with ID ${requestId} not found`);
      }
      
      await this.processRequestWithTimeout(request);
      return;
    }
    
    // Process all pending requests sorted by priority (highest first) then timestamp
    const pendingRequests = await this.getRequestsByStatus(RequestStatus.PENDING);
    pendingRequests.sort((a, b) => {
      // Sort by priority (descending)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by timestamp (ascending - oldest first)
      return a.timestamp - b.timestamp;
    });
    
    let processed = 0;
    const total = pendingRequests.length;
    
    for (const request of pendingRequests) {
      await this.processRequestWithTimeout(request);
      processed++;
      
      if (onProgress) {
        onProgress(processed, total);
      }
    }
  }
  
  /**
   * Process a single request with timeout
   */
  private async processRequestWithTimeout(request: QueuedRequest): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    // Set request status to PROCESSING
    request.status = RequestStatus.PROCESSING;
    await this.db.put('requests', request);
    
    try {
      // Process with timeout
      const timeout = request.timeout || 30000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout);
      });
      
      // Execute or timeout, whichever comes first
      await Promise.race([
        this.executeRequest(request),
        timeoutPromise
      ]);
      
      // Mark as completed
      request.status = RequestStatus.COMPLETED;
      request.completedAt = Date.now();
      await this.db.put('requests', request);
      return true;
    } catch (error) {
      console.error(`Error processing request ${request.id}:`, formatErrorMessage(error));
      
      // Handle retry logic
      if (request.retries < request.maxRetries) {
        request.retries += 1;
        request.status = RequestStatus.PENDING;
        request.lastError = formatErrorMessage(error);
        await this.db.put('requests', request);
      } else {
        // Max retries reached, mark as failed
        request.status = RequestStatus.FAILED;
        request.lastError = formatErrorMessage(error);
        await this.db.put('requests', request);
      }
      
      return false;
    }
  }
  
  /**
   * Execute the actual API request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    // Skip execution if offline
    if (!navigator.onLine) {
      throw new Error('Device is offline');
    }
    
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  
  /**
   * Get statistics about the current queue state
   */
  async getStats(): Promise<QueueStats> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const [pending, processing, completed, failed] = await Promise.all([
      this.db.getAllFromIndex('requests', 'by-status', RequestStatus.PENDING),
      this.db.getAllFromIndex('requests', 'by-status', RequestStatus.PROCESSING),
      this.db.getAllFromIndex('requests', 'by-status', RequestStatus.COMPLETED),
      this.db.getAllFromIndex('requests', 'by-status', RequestStatus.FAILED)
    ]);
    
    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
      total: pending.length + processing.length + completed.length + failed.length
    };
  }
  
  /**
   * Get all requests with a specific status
   */
  async getRequestsByStatus(status: RequestStatus): Promise<QueuedRequest[]> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db.getAllFromIndex('requests', 'by-status', status);
  }
  
  /**
   * Clear requests with a specific status
   */
  async clearByStatus(status: RequestStatus): Promise<number> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const requests = await this.db.getAllFromIndex('requests', 'by-status', status);
    
    // Delete each request
    for (const request of requests) {
      await this.db.delete('requests', request.id);
    }
    
    return requests.length;
  }
  
  /**
   * Delete a specific request by ID
   */
  async deleteRequest(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const request = await this.db.get('requests', id);
    if (!request) {
      return false;
    }
    
    await this.db.delete('requests', id);
    return true;
  }
  
  /**
   * Clean up and close the database connection
   */
  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

/**
 * ======================
 * MANAGER IMPLEMENTATION
 * ======================
 */

/**
 * Create the offline queue manager
 */
class OfflineQueueManagerImpl implements OfflineQueueManager {
  private processing = false;
  private queueChangeListeners: Set<(queueLength: number) => void> = new Set();
  
  constructor(private core: OfflineQueueCore) {
    // Initialize core
    this.core.init().catch(error => {
      console.error('Failed to initialize offline queue:', formatErrorMessage(error));
    });
    
    // Setup listeners for online/offline events
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for online/offline events
   */
  private setupEventListeners(): void {
    // Process queue when we come back online
    window.addEventListener('online', () => {
      console.log('Device is online, processing offline queue');
      this.processQueue().catch(error => {
        console.error('Failed to process queue on online event:', formatErrorMessage(error));
      });
    });
    
    // Log when we go offline
    window.addEventListener('offline', () => {
      console.log('Device is offline, requests will be queued');
    });
  }
  
  /**
   * Notify listeners when queue changes
   */
  private async notifyQueueChange(): Promise<void> {
    try {
      const stats = await this.core.getStats();
      const pendingCount = stats.pending + stats.processing;
      
      for (const listener of this.queueChangeListeners) {
        listener(pendingCount);
      }
    } catch (error) {
      console.error('Error notifying queue change listeners:', formatErrorMessage(error));
    }
  }
  
  /**
   * Add a request to the queue
   */
  async enqueue(request: QueueRequestOptions): Promise<string> {
    try {
      // If we're online and the request is not specifically flagged for offline,
      // try to process it immediately
      if (navigator.onLine && !request.forceQueue) {
        try {
          const requestId = await this.core.enqueue({
            ...request,
            status: RequestStatus.PENDING
          });
          
          // Process the queued request immediately
          await this.core.process(requestId);
          
          await this.notifyQueueChange();
          return requestId;
        } catch (error) {
          console.warn('Failed to process request immediately, queueing for later:', formatErrorMessage(error));
          // Fall through to queue
        }
      }
      
      // Queue the request for later processing
      const id = await this.core.enqueue(request);
      
      // Notify listeners
      await this.notifyQueueChange();
      
      return id;
    } catch (error) {
      console.error('Failed to enqueue request:', formatErrorMessage(error));
      throw error;
    }
  }
  
  /**
   * Process the offline queue
   */
  async processQueue(): Promise<void> {
    // Skip if already processing
    if (this.processing) {
      return;
    }
    
    try {
      this.processing = true;
      
      // Skip processing if device is offline
      if (!navigator.onLine) {
        console.log('Device is offline, skipping queue processing');
        return;
      }
      
      await this.core.process(undefined, (processed, total) => {
        console.log(`Processing offline queue: ${processed}/${total} requests`);
      });
      
      // Notify listeners
      await this.notifyQueueChange();
      
    } catch (error) {
      console.error('Failed to process offline queue:', formatErrorMessage(error));
      throw error;
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Get the number of items in the queue
   */
  async getQueueLength(): Promise<number> {
    try {
      const stats = await this.core.getStats();
      return stats.pending + stats.processing;
    } catch (error) {
      console.error('Failed to get queue length:', formatErrorMessage(error));
      return 0;
    }
  }
  
  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    try {
      return await this.core.getRequestsByStatus(RequestStatus.PENDING);
    } catch (error) {
      console.error('Failed to get pending requests:', formatErrorMessage(error));
      return [];
    }
  }
  
  /**
   * Clear all completed requests
   */
  async clearCompletedRequests(): Promise<number> {
    try {
      return await this.core.clearByStatus(RequestStatus.COMPLETED);
    } catch (error) {
      console.error('Failed to clear completed requests:', formatErrorMessage(error));
      return 0;
    }
  }
  
  /**
   * Check if queue is currently processing
   */
  isProcessing(): boolean {
    return this.processing;
  }
  
  /**
   * Register a callback for queue changes
   */
  onQueueChange(callback: (queueLength: number) => void): () => void {
    this.queueChangeListeners.add(callback);
    
    // Return cleanup function
    return () => {
      this.queueChangeListeners.delete(callback);
    };
  }
}

/**
 * ======================
 * REACT HOOK
 * ======================
 */

/**
 * React hook for using the offline queue
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Register for queue length updates
    const unsubscribe = offlineQueueManager.onQueueChange(length => {
      setQueueLength(length);
    });
    
    // Get initial queue length
    offlineQueueManager.getQueueLength()
      .then(length => setQueueLength(length))
      .catch(error => console.error('Failed to get initial queue length:', formatErrorMessage(error)));
    
    return () => {
      // Cleanup listener
      unsubscribe();
    };
  }, []);
  
  // Enqueue a request and catch errors
  const enqueue = async (request: QueueRequestOptions): Promise<void> => {
    try {
      await offlineQueueManager.enqueue(request);
    } catch (error) {
      toast({
        title: 'Failed to queue request',
        description: formatErrorMessage(error),
        variant: 'destructive'
      });
    }
  };
  
  // Process the queue and show progress/errors
  const processQueue = async (): Promise<void> => {
    try {
      setIsProcessing(true);
      await offlineQueueManager.processQueue();
    } catch (error) {
      toast({
        title: 'Error processing queue',
        description: formatErrorMessage(error),
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clear completed requests from the queue
  const clearCompleted = async (): Promise<number> => {
    try {
      return await offlineQueueManager.clearCompletedRequests();
    } catch (error) {
      toast({
        title: 'Error clearing completed requests',
        description: formatErrorMessage(error),
        variant: 'destructive'
      });
      return 0;
    }
  };
  
  return {
    enqueue,
    processQueue,
    clearCompleted,
    isProcessing,
    queueLength
  };
}

/**
 * ======================
 * SINGLETONS
 * ======================
 */

// Create singleton instances for global usage
export const offlineQueueCore = new OfflineQueueCoreImpl();
export const offlineQueueManager = new OfflineQueueManagerImpl(offlineQueueCore);

// Re-export types for consumers
export type {
  QueuedRequest,
  QueueRequestOptions,
  QueueStats,
  OfflineQueueManager
};

// Re-export singleton
export default offlineQueueManager;
