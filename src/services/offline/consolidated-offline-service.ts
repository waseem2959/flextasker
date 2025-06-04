/**
 * Consolidated Offline Queue Service
 * 
 * This service provides offline request queue functionality, including:
 * - Database operations (IndexedDB)
 * - Request queueing and processing
 * - Online/offline synchronization
 * - React hook for component integration
 * 
 * This is a consolidated version that combines functionality from:
 * - services/api/offline-queue-service.ts
 * - services/offline/offline-service.ts
 */

import { toast } from '@/hooks/use-toast';
// Error formatting removed for simplicity
import { logger } from '@/services/logging';
import { IDBPDatabase, openDB } from 'idb';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Define types locally since api-client types may not be available
export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ConflictStrategy {
  REPLACE = 'replace',
  MERGE = 'merge',
  SKIP = 'skip'
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers: Record<string, string>;
  status: RequestStatus;
  timestamp: number;
  priority: number;
  retries: number;
  maxRetries: number;
  timeout: number;
  conflictStrategy: ConflictStrategy;
}

export interface QueueRequestOptions {
  id?: string;
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  priority?: number;
  maxRetries?: number;
  timeout?: number;
  conflictStrategy?: ConflictStrategy;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

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
      'by-priority': number;
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
  private readonly dbName = 'flextasker-offline-queue';
  private readonly dbVersion = 1;
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
      logger.error('Failed to initialize offline queue database', { error: error instanceof Error ? error.message : String(error) });
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
    store.createIndex('by-priority', 'priority');
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
    
    const id = request.id ?? uuidv4();
    const timestamp = Date.now();
    
    const queuedRequest: QueuedRequest = {
      id,
      url: request.url,
      method: request.method ?? 'GET',
      body: request.body,
      headers: request.headers ?? {},
      status: RequestStatus.PENDING,
      timestamp,
      priority: request.priority ?? 0,
      retries: 0,
      maxRetries: request.maxRetries ?? 3,
      timeout: request.timeout ?? 30000,
      conflictStrategy: request.conflictStrategy ?? ConflictStrategy.REPLACE
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
      
      // Then by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
    
    const total = pendingRequests.length;
    let processed = 0;
    
    for (const request of pendingRequests) {
      try {
        await this.processRequestWithTimeout(request);
      } catch (error) {
        logger.error(`Failed to process request ${request.id}`, { error: error instanceof Error ? error.message : String(error) });
      }
      
      processed++;
      if (onProgress) {
        onProgress(processed, total);
      }
    }
  }
  
  /**
   * Process a single request with timeout protection
   */
  private async processRequestWithTimeout(request: QueuedRequest): Promise<void> {
    // Update status to processing
    await this.updateRequestStatus(request.id, RequestStatus.PROCESSING);
    
    try {
      // Create an abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout);
      
      // Make the fetch request
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      // Update status to completed
      await this.updateRequestStatus(request.id, RequestStatus.COMPLETED);
    } catch (error) {
      // Handle request failure
      if (request.retries < request.maxRetries) {
        // Increment retry count and keep as pending
        await this.updateRequestRetry(request.id);
      } else {
        // Max retries reached, mark as failed
        await this.updateRequestStatus(request.id, RequestStatus.FAILED);
      }
      
      throw error;
    }
  }
  
  /**
   * Update a request's status
   */
  private async updateRequestStatus(id: string, status: RequestStatus): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const request = await this.db.get('requests', id);
    if (!request) {
      throw new Error(`Request with ID ${id} not found`);
    }
    
    request.status = status;
    await this.db.put('requests', request);
  }
  
  /**
   * Update a request's retry count
   */
  private async updateRequestRetry(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const request = await this.db.get('requests', id);
    if (!request) {
      throw new Error(`Request with ID ${id} not found`);
    }
    
    request.retries += 1;
    await this.db.put('requests', request);
  }
  
  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction('requests', 'readonly');
    const store = tx.objectStore('requests');
    
    const all = await store.getAll();
    
    const stats: QueueStats = {
      total: all.length,
      pending: all.filter(r => r.status === RequestStatus.PENDING).length,
      processing: all.filter(r => r.status === RequestStatus.PROCESSING).length,
      completed: all.filter(r => r.status === RequestStatus.COMPLETED).length,
      failed: all.filter(r => r.status === RequestStatus.FAILED).length
    };
    
    return stats;
  }
  
  /**
   * Get requests by status
   */
  async getRequestsByStatus(status: RequestStatus): Promise<QueuedRequest[]> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction('requests', 'readonly');
    const index = tx.store.index('by-status');
    
    return await index.getAll(status);
  }
  
  /**
   * Clear requests by status
   */
  async clearByStatus(status: RequestStatus): Promise<number> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const requests = await this.getRequestsByStatus(status);
    
    const tx = this.db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    
    for (const request of requests) {
      await store.delete(request.id);
    }
    
    await tx.done;
    
    return requests.length;
  }
  
  /**
   * Delete a specific request
   */
  async deleteRequest(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const tx = this.db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    
    // Check if request exists
    const request = await store.get(id);
    if (!request) {
      return false;
    }
    
    await store.delete(id);
    await tx.done;
    
    return true;
  }
  
  /**
   * Clean up the database
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
 * Manager implementation that provides a simplified interface for application use
 */
class OfflineQueueManagerImpl implements OfflineQueueManager {
  private readonly core: OfflineQueueCore;
  private processing = false;
  private changeCallbacks: ((queueLength: number) => void)[] = [];
  
  constructor(core: OfflineQueueCore) {
    this.core = core;
  }
  
  /**
   * Add a request to the queue
   */
  async enqueue(request: QueueRequestOptions): Promise<string> {
    const id = await this.core.enqueue(request);
    this.notifyQueueChanged();
    return id;
  }
  
  /**
   * Process all pending requests
   */
  async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }
    
    this.processing = true;
    
    try {
      await this.core.process(undefined, (_processed, _total) => {
        // Could implement progress reporting here
      });
    } finally {
      this.processing = false;
      this.notifyQueueChanged();
    }
  }
  
  /**
   * Get the current queue length
   */
  async getQueueLength(): Promise<number> {
    const stats = await this.core.getStats();
    return stats.pending + stats.processing;
  }
  
  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    return this.core.getRequestsByStatus(RequestStatus.PENDING);
  }
  
  /**
   * Clear all completed requests
   */
  async clearCompletedRequests(): Promise<number> {
    const count = await this.core.clearByStatus(RequestStatus.COMPLETED);
    this.notifyQueueChanged();
    return count;
  }
  
  /**
   * Check if the queue is currently processing
   */
  isProcessing(): boolean {
    return this.processing;
  }
  
  /**
   * Register a callback for queue changes
   */
  onQueueChange(callback: (queueLength: number) => void): () => void {
    this.changeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.changeCallbacks = this.changeCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all callbacks of queue changes
   */
  private async notifyQueueChanged(): Promise<void> {
    const length = await this.getQueueLength();
    this.changeCallbacks.forEach(callback => callback(length));
  }
}

/**
 * ======================
 * REACT HOOK
 * ======================
 */

/**
 * React hook for using the offline queue in components
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Subscribe to queue changes
  useEffect(() => {
    // Initialize and get initial queue length
    offlineQueueCore.init().then(() => {
      offlineQueueManager.getQueueLength().then(setQueueLength);
    });
    
    // Subscribe to queue changes
    const unsubscribe = offlineQueueManager.onQueueChange(setQueueLength);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Enqueue a request and handle errors
  const enqueue = async (request: QueueRequestOptions): Promise<void> => {
    try {
      await offlineQueueManager.enqueue(request);
    } catch (error) {
      toast({
        title: 'Failed to queue request',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      } as any);
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
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      } as any);
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
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      } as any);
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

// Export the OfflineQueueManager type for consumers
export type { OfflineQueueManager };

// Re-export singleton
export default offlineQueueManager;
