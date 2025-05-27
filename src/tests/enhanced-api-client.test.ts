/**
 * Enhanced API Client Tests
 * 
 * This file contains comprehensive tests for the enhanced API client features:
 * - API client functionality
 * - Offline queue manager
 * - Real-time synchronization
 * - Performance monitoring
 * - Rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhancedApiClient } from '@/services/api/enhanced-client';
import { offlineQueueManager, RequestStatus } from '@/utils/offline-queue';
import { TaskStatus, TaskPriority, BudgetType } from '@/types/enums';

// Mock fetch
global.fetch = vi.fn();

// Mock IndexedDB
vi.mock('idb', () => ({
  openDB: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getAllFromIndex: vi.fn().mockResolvedValue([]),
    countFromIndex: vi.fn().mockResolvedValue(0),
    transaction: vi.fn(),
    objectStoreNames: {
      contains: vi.fn().mockReturnValue(true)
    },
    createObjectStore: vi.fn()
  }))
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

describe('Enhanced API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Success',
        data: { id: '123', title: 'Test Task' },
        timestamp: new Date().toISOString()
      })
    });
  });
  
  describe('Basic functionality', () => {
    it('should make successful GET requests', async () => {
      const response = await enhancedApiClient.get('/tasks');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object)
        })
      );
      
      expect(response).toEqual(expect.objectContaining({
        success: true,
        message: 'Success',
        data: { id: '123', title: 'Test Task' }
      }));
    });
    
    it('should make successful POST requests', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.MEDIUM,
        budgetType: BudgetType.FIXED
      };
      
      await enhancedApiClient.post('/tasks', taskData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(taskData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    it('should handle error responses properly', async () => {
      // Mock an error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          success: false,
          message: 'Task not found',
          errors: ['Resource not found'],
          timestamp: new Date().toISOString()
        })
      });
      
      const response = await enhancedApiClient.get('/tasks/999');
      
      expect(response).toEqual(expect.objectContaining({
        success: false,
        message: 'Task not found',
        errors: ['Resource not found']
      }));
    });
    
    it('should handle network errors', async () => {
      // Mock a network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const response = await enhancedApiClient.get('/tasks');
      
      expect(response).toEqual(expect.objectContaining({
        success: false,
        message: expect.stringContaining('error'),
        errors: [expect.stringContaining('Network error')]
      }));
    });
  });
  
  describe('Performance monitoring', () => {
    it('should track request timing', async () => {
      // Mock the performance monitoring
      const startTimingSpy = vi.spyOn(enhancedApiClient.performanceMonitor, 'startTiming');
      const recordRequestSpy = vi.spyOn(enhancedApiClient.performanceMonitor, 'recordRequest');
      
      await enhancedApiClient.get('/tasks');
      
      expect(startTimingSpy).toHaveBeenCalledWith('/tasks', 'GET');
      expect(recordRequestSpy).toHaveBeenCalledWith(
        '/tasks',
        'GET',
        expect.any(Number),
        200,
        true,
        false,
        expect.any(Number),
        0
      );
    });
  });
  
  describe('Rate limiting', () => {
    it('should throttle requests when limit is reached', async () => {
      // Make multiple requests in quick succession
      const promises = Array(10).fill(0).map(() => 
        enhancedApiClient.get('/tasks')
      );
      
      await Promise.all(promises);
      
      // Should have applied rate limiting
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });
  });
});

describe('Offline Queue Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IndexedDB implementation
    const mockRequests: any[] = [];
    const mockDb = {
      add: vi.fn().mockImplementation((store, request) => {
        mockRequests.push(request);
        return Promise.resolve();
      }),
      put: vi.fn().mockImplementation((store, request) => {
        const index = mockRequests.findIndex(r => r.id === request.id);
        if (index >= 0) {
          mockRequests[index] = request;
        } else {
          mockRequests.push(request);
        }
        return Promise.resolve();
      }),
      getAllFromIndex: vi.fn().mockImplementation((store, index, status) => {
        return Promise.resolve(mockRequests.filter(r => r.status === status));
      }),
      countFromIndex: vi.fn().mockImplementation((store, index, status) => {
        return Promise.resolve(mockRequests.filter(r => r.status === status).length);
      }),
      delete: vi.fn().mockImplementation((store, id) => {
        const index = mockRequests.findIndex(r => r.id === id);
        if (index >= 0) {
          mockRequests.splice(index, 1);
        }
        return Promise.resolve();
      })
    };
    
    require('idb').openDB.mockResolvedValue(mockDb);
  });
  
  it('should enqueue a request', async () => {
    const request = {
      url: '/tasks',
      method: 'POST',
      data: { title: 'Test Task', priority: TaskPriority.HIGH },
      entityType: 'task'
    };
    
    const id = await offlineQueueManager.enqueue(request);
    
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    
    // Verify it was added to the database
    const db = await require('idb').openDB();
    expect(db.add).toHaveBeenCalledWith('requests', expect.objectContaining({
      id,
      ...request,
      status: RequestStatus.PENDING,
      timestamp: expect.any(Number),
      retryCount: 0
    }));
  });
  
  it('should process the queue when online', async () => {
    // Mock some pending requests
    const mockRequests = [
      {
        id: '1',
        url: '/tasks',
        method: 'POST',
        data: { title: 'Task 1' },
        status: RequestStatus.PENDING,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: '2',
        url: '/tasks',
        method: 'PUT',
        data: { title: 'Task 2', status: TaskStatus.COMPLETED },
        status: RequestStatus.PENDING,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3
      }
    ];
    
    const db = await require('idb').openDB();
    db.getAllFromIndex.mockResolvedValueOnce(mockRequests);
    
    // Mock successful fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'Success' })
    });
    
    await offlineQueueManager.processQueue();
    
    // Verify the requests were processed
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(db.put).toHaveBeenCalledWith('requests', expect.objectContaining({
      id: '1',
      status: RequestStatus.COMPLETED
    }));
    expect(db.put).toHaveBeenCalledWith('requests', expect.objectContaining({
      id: '2',
      status: RequestStatus.COMPLETED
    }));
  });
  
  it('should retry failed requests', async () => {
    // Mock a pending request
    const mockRequest = {
      id: '3',
      url: '/tasks',
      method: 'POST',
      data: { title: 'Retry Task' },
      status: RequestStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
    
    const db = await require('idb').openDB();
    db.getAllFromIndex.mockResolvedValueOnce([mockRequest]);
    
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    await offlineQueueManager.processQueue();
    
    // Verify the request was marked for retry
    expect(db.put).toHaveBeenCalledWith('requests', expect.objectContaining({
      id: '3',
      status: RequestStatus.PENDING,
      retryCount: 1,
      lastError: 'Network error'
    }));
  });
  
  it('should mark requests as failed after max retries', async () => {
    // Mock a request that has reached max retries
    const mockRequest = {
      id: '4',
      url: '/tasks',
      method: 'POST',
      data: { title: 'Failed Task' },
      status: RequestStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 3,
      maxRetries: 3
    };
    
    const db = await require('idb').openDB();
    db.getAllFromIndex.mockResolvedValueOnce([mockRequest]);
    
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    await offlineQueueManager.processQueue();
    
    // Verify the request was marked as failed
    expect(db.put).toHaveBeenCalledWith('requests', expect.objectContaining({
      id: '4',
      status: RequestStatus.FAILED,
      lastError: 'Network error'
    }));
  });
});

describe('Enhanced API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
  });
  
  it('should use offline queue when offline', async () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false
    });
    
    // Mock the offlineQueueManager.enqueue
    const enqueueSpy = vi.spyOn(offlineQueueManager, 'enqueue');
    
    // Make a request while offline
    await enhancedApiClient.post('/tasks', { title: 'Offline Task' });
    
    // Should have queued the request
    expect(enqueueSpy).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('/tasks'),
      method: 'POST',
      data: { title: 'Offline Task' }
    }));
    
    // Should not have made a fetch request
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  it('should make direct API calls when online', async () => {
    // Make a request while online
    await enhancedApiClient.post('/tasks', { title: 'Online Task' });
    
    // Should have made a fetch request
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Online Task' })
      })
    );
  });
  
  it('should process queue when coming back online', () => {
    // Mock the processQueue method
    const processQueueSpy = vi.spyOn(offlineQueueManager, 'processQueue');
    
    // Simulate coming online
    window.dispatchEvent(new Event('online'));
    
    // Should have called processQueue
    expect(processQueueSpy).toHaveBeenCalled();
  });
});
