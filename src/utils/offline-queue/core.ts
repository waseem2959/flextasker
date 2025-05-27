/**
 * Offline Queue Core Implementation
 * 
 * This module provides the core functionality for the offline queue system.
 * It handles database operations, request processing, and conflict resolution.
 */

import { v4 as uuidv4 } from 'uuid';
import { openDB, IDBPDatabase } from 'idb';
import { 
  RequestStatus, 
  ConflictStrategy, 
  QueuedRequest,
  QueueRequestOptions,
  QueueStats,
  HttpMethod
} from '@/types/api-requests';
import { OfflineQueueDB, OfflineQueueCore } from './types';
import { handleError } from '../error-handler';

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
        upgrade: (db) => {
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains('requests')) {
            const store = db.createObjectStore('requests', { keyPath: 'id' });
            store.createIndex('by-status', 'status');
            store.createIndex('by-url', 'url');
            store.createIndex('by-timestamp', 'timestamp');
          }
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize offline queue database:', error);
      throw new Error('Failed to initialize offline queue');
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('Offline queue database not initialized');
    }
  }

  /**
   * Add a request to the queue
   */
  async enqueue(request: QueueRequestOptions): Promise<string> {
    await this.ensureInitialized();
    
    // Create a unique ID
    const id = uuidv4();
    
    // Create the queued request
    const queuedRequest: QueuedRequest = {
      id,
      ...request,
      status: RequestStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: request.maxRetries ?? 3,
      method: (request.method ?? 'GET') as HttpMethod,
      priority: request.priority ?? 1
    };
    
    // Store in database
    await this.db!.add('requests', queuedRequest);
    
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
    
    let requests: QueuedRequest[];
    
    if (requestId) {
      // Process a specific request
      const request = await this.db!.get('requests', requestId);
      requests = request ? [request] : [];
    } else {
      // Process all pending requests
      requests = await this.db!.getAllFromIndex('requests', 'by-status', RequestStatus.PENDING);
      
      // Sort by priority (higher first) and then by timestamp (older first)
      requests.sort((a, b) => {
        if (a.priority !== b.priority) {
          return (b.priority ?? 0) - (a.priority ?? 0);
        }
        return a.timestamp - b.timestamp;
      });
    }
    
    const total = requests.length;
    let processed = 0;
    
    for (const request of requests) {
      try {
        // Mark as processing
        await this.db!.put('requests', {
          ...request,
          status: RequestStatus.PROCESSING
        });
        
        // Process with timeout
        const success = await this.processRequestWithTimeout(request);
        
        // Update status based on result
        if (success) {
          await this.db!.put('requests', {
            ...request,
            status: RequestStatus.COMPLETED
          });
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
        
        // Handle retry logic
        if (request.retryCount < (request.maxRetries ?? 3)) {
          await this.db!.put('requests', {
            ...request,
            status: RequestStatus.PENDING,
            retryCount: request.retryCount + 1,
            lastError: error instanceof Error ? error.message : String(error)
          });
        } else {
          await this.db!.put('requests', {
            ...request,
            status: RequestStatus.FAILED,
            lastError: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
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
    return new Promise((resolve, reject) => {
      // Set a timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 30000);
      
      // Make the request
      this.executeRequest(request)
        .then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute the actual API request
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const controller = new AbortController();
    
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' 
          ? JSON.stringify(request.data) 
          : undefined,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Request execution failed:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the queue
   */
  async getStats(): Promise<QueueStats> {
    await this.ensureInitialized();
    
    const pending = await this.db!.countFromIndex('requests', 'by-status', RequestStatus.PENDING);
    const processing = await this.db!.countFromIndex('requests', 'by-status', RequestStatus.PROCESSING);
    const failed = await this.db!.countFromIndex('requests', 'by-status', RequestStatus.FAILED);
    const completed = await this.db!.countFromIndex('requests', 'by-status', RequestStatus.COMPLETED);
    const conflict = await this.db!.countFromIndex('requests', 'by-status', RequestStatus.CONFLICT);
    
    return {
      pending,
      processing,
      failed,
      completed,
      conflict,
      total: pending + processing + failed + completed + conflict
    };
  }

  /**
   * Get requests by status
   */
  async getRequestsByStatus(status: RequestStatus): Promise<QueuedRequest[]> {
    await this.ensureInitialized();
    return this.db!.getAllFromIndex('requests', 'by-status', status);
  }

  /**
   * Clear requests with a specific status
   */
  async clearByStatus(status: RequestStatus): Promise<number> {
    await this.ensureInitialized();
    
    const requests = await this.db!.getAllFromIndex('requests', 'by-status', status);
    let count = 0;
    
    for (const request of requests) {
      await this.db!.delete('requests', request.id);
      count++;
    }
    
    return count;
  }

  /**
   * Delete a specific request
   */
  async deleteRequest(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      await this.db!.delete('requests', id);
      return true;
    } catch (error) {
      console.error(`Failed to delete request ${id}:`, error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Create and export a singleton instance
export const offlineQueueCore = new OfflineQueueCoreImpl();

// Re-export types for convenience
export { RequestStatus, ConflictStrategy } from '@/types/api-requests';
