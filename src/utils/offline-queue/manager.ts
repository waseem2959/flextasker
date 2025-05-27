/**
 * Offline Queue Manager
 * 
 * This module provides a simplified interface to the offline queue functionality,
 * exposing only the methods needed by application components and ensuring
 * proper initialization and cleanup.
 */

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  QueueRequestOptions,
  QueuedRequest,
  RequestStatus 
} from '@/types/api-requests';
import { OfflineQueueManager, UseOfflineQueueReturn } from './types';
import { offlineQueueCore } from './core';

/**
 * Create the offline queue manager
 */
class OfflineQueueManagerImpl implements OfflineQueueManager {
  // Track if queue is processing
  private processing = false;
  
  // Queue change listeners
  private queueChangeListeners: Set<(queueLength: number) => void> = new Set();
  
  constructor() {
    // Initialize core
    offlineQueueCore.init().catch(error => {
      console.error('Failed to initialize offline queue:', error);
    });
    
    // Setup listeners for online/offline events
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for online/offline events
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      // Process queue when we come back online
      void this.processQueue();
    });
  }
  
  /**
   * Notify listeners when queue changes
   */
  private async notifyQueueChange(): Promise<void> {
    const queueLength = await this.getQueueLength();
    
    this.queueChangeListeners.forEach(listener => {
      try {
        listener(queueLength);
      } catch (error) {
        console.error('Error in queue change listener:', error);
      }
    });
  }
  
  /**
   * Add a request to the queue
   */
  async enqueue(request: QueueRequestOptions): Promise<string> {
    const id = await offlineQueueCore.enqueue(request);
    
    // Notify listeners
    await this.notifyQueueChange();
    
    return id;
  }
  
  /**
   * Process the offline queue
   */
  async processQueue(): Promise<void> {
    // Check if already processing
    if (this.processing) {
      return;
    }
    
    // Mark as processing
    this.processing = true;
    
    try {
      // Get queue stats before processing
      const stats = await offlineQueueCore.getStats();
      
      if (stats.pending === 0) {
        this.processing = false;
        return;
      }
      
      // Show toast if there are pending requests
      if (stats.pending > 0) {
        toast({
          title: 'Syncing offline changes',
          description: `Processing ${stats.pending} pending requests...`,
          variant: 'default'
        });
      }
      
      // Track progress
      let successCount = 0;
      let failureCount = 0;
      
      // Process the queue with a progress callback
      await offlineQueueCore.process(undefined, async (processed, total) => {
        // Update stats after each item is processed
        const currentStats = await offlineQueueCore.getStats();
        
        // Count successes and failures
        successCount = currentStats.completed - stats.completed;
        failureCount = currentStats.failed - stats.failed;
        
        // Notify listeners of progress
        await this.notifyQueueChange();
      });
      
      // Get final stats
      const finalStats = await offlineQueueCore.getStats();
      
      // Show result toast
      if (successCount > 0 || failureCount > 0) {
        toast({
          title: 'Sync completed',
          description: `${successCount} requests completed, ${failureCount} failed.`,
          variant: failureCount > 0 ? 'destructive' : 'default'
        });
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
      
      toast({
        title: 'Sync failed',
        description: 'Could not process offline changes. Will retry later.',
        variant: 'destructive'
      });
    } finally {
      // Mark as not processing
      this.processing = false;
      
      // Notify listeners one more time
      await this.notifyQueueChange();
    }
  }
  
  /**
   * Get the number of items in the queue
   */
  async getQueueLength(): Promise<number> {
    const stats = await offlineQueueCore.getStats();
    return stats.pending + stats.processing;
  }
  
  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    const pendingRequests = await offlineQueueCore.getRequestsByStatus(RequestStatus.PENDING);
    const processingRequests = await offlineQueueCore.getRequestsByStatus(RequestStatus.PROCESSING);
    
    return [...pendingRequests, ...processingRequests];
  }
  
  /**
   * Clear all completed requests
   */
  async clearCompletedRequests(): Promise<number> {
    const count = await offlineQueueCore.clearByStatus(RequestStatus.COMPLETED);
    
    // Notify listeners
    await this.notifyQueueChange();
    
    return count;
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
    
    // Return unsubscribe function
    return () => {
      this.queueChangeListeners.delete(callback);
    };
  }
}

// Create and export the singleton instance
export const offlineQueueManager = new OfflineQueueManagerImpl();

/**
 * React hook for using the offline queue
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queueLength, setQueueLength] = useState(0);
  
  // Create a wrapper for the enqueue function that discards the returned ID
  const enqueueWrapper = async (request: QueueRequestOptions): Promise<void> => {
    await offlineQueueManager.enqueue(request);
    // Void return - discards the ID
  };
  
  useEffect(() => {
    // Get initial queue length
    offlineQueueManager.getQueueLength().then(setQueueLength);
    
    // Process all queued requests
    void offlineQueueManager.processQueue();
    
    // Subscribe to queue changes
    const unsubscribe = offlineQueueManager.onQueueChange(setQueueLength);
    
    // Cleanup on unmount
    return unsubscribe;
  }, []);
  
  return {
    enqueue: enqueueWrapper,
    processQueue: offlineQueueManager.processQueue,
    clearCompleted: offlineQueueManager.clearCompletedRequests,
    isProcessing: offlineQueueManager.isProcessing,
    queueLength
  };
}
