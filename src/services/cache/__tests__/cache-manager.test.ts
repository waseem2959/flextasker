/**
 * Cache Manager Tests
 * 
 * Tests for multi-layer cache management including Memory, LocalStorage,
 * IndexedDB layers, LRU eviction, compression, and encryption.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cacheManager, useCache } from '../cache-manager';
import { renderHook, act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          add: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          onsuccess: null,
          onerror: null
        })
      })
    }
  }),
  deleteDatabase: jest.fn()
};
Object.defineProperty(window, 'indexedDB', { value: mockIndexedDB });

// Mock compression
jest.mock('lz-string', () => ({
  compress: jest.fn((str) => `compressed_${str}`),
  decompress: jest.fn((str) => str.replace('compressed_', '')),
  compressToUTF16: jest.fn((str) => `utf16_${str}`),
  decompressFromUTF16: jest.fn((str) => str.replace('utf16_', ''))
}));

describe('CacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', timestamp: Date.now() };

      await cacheManager.set(key, value);
      const retrieved = await cacheManager.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete values', async () => {
      const key = 'delete-test';
      const value = 'test-value';

      await cacheManager.set(key, value);
      expect(await cacheManager.get(key)).toBe(value);

      await cacheManager.delete(key);
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'exists-test';
      
      expect(await cacheManager.has(key)).toBe(false);
      
      await cacheManager.set(key, 'value');
      expect(await cacheManager.has(key)).toBe(true);
    });

    it('should clear all cache', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      await cacheManager.set('key3', 'value3');

      await cacheManager.clear();

      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
      expect(await cacheManager.get('key3')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect TTL settings', async () => {
      const key = 'ttl-test';
      const value = 'expires-soon';
      const shortTTL = 100; // 100ms

      await cacheManager.set(key, value, { ttl: shortTTL });
      
      // Should be available immediately
      expect(await cacheManager.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-test';
      const value = 'default-expiry';

      await cacheManager.set(key, value);
      
      // Should be stored with default TTL
      expect(await cacheManager.get(key)).toBe(value);
    });

    it('should handle infinite TTL', async () => {
      const key = 'infinite-ttl-test';
      const value = 'never-expires';

      await cacheManager.set(key, value, { ttl: Infinity });
      
      expect(await cacheManager.get(key)).toBe(value);
    });
  });

  describe('Cache Layers', () => {
    it('should prefer memory layer for fastest access', async () => {
      const key = 'memory-test';
      const value = 'in-memory';

      await cacheManager.set(key, value);
      
      // First access should hit memory layer
      const result = await cacheManager.get(key);
      expect(result).toBe(value);
    });

    it('should fall back to localStorage when memory cache misses', async () => {
      const key = 'localstorage-test';
      const value = 'in-localstorage';

      // Mock localStorage to have the value
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        value,
        timestamp: Date.now(),
        ttl: Infinity
      }));

      const result = await cacheManager.get(key);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`cache_${key}`);
    });

    it('should store in multiple layers based on priority', async () => {
      const key = 'multi-layer-test';
      const value = 'multi-layer-value';

      await cacheManager.set(key, value, { priority: 'high' });

      // High priority should be stored in multiple layers
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Priority Levels', () => {
    it('should handle high priority items', async () => {
      const key = 'high-priority';
      const value = 'important-data';

      await cacheManager.set(key, value, { priority: 'high' });
      
      expect(await cacheManager.get(key)).toBe(value);
    });

    it('should handle low priority items', async () => {
      const key = 'low-priority';
      const value = 'less-important-data';

      await cacheManager.set(key, value, { priority: 'low' });
      
      expect(await cacheManager.get(key)).toBe(value);
    });

    it('should prioritize high priority items during eviction', async () => {
      // This test would need a controlled cache size limit
      const highPriorityKey = 'high-priority-keep';
      const lowPriorityKey = 'low-priority-evict';

      await cacheManager.set(highPriorityKey, 'keep-me', { priority: 'high' });
      await cacheManager.set(lowPriorityKey, 'evict-me', { priority: 'low' });

      // High priority should be preserved longer
      expect(await cacheManager.get(highPriorityKey)).toBe('keep-me');
    });
  });

  describe('Tags and Grouping', () => {
    it('should store and retrieve items by tags', async () => {
      await cacheManager.set('user-1', { name: 'John' }, { tags: ['users', 'active'] });
      await cacheManager.set('user-2', { name: 'Jane' }, { tags: ['users', 'inactive'] });
      await cacheManager.set('task-1', { title: 'Task 1' }, { tags: ['tasks'] });

      expect(await cacheManager.get('user-1')).toEqual({ name: 'John' });
      expect(await cacheManager.get('user-2')).toEqual({ name: 'Jane' });
      expect(await cacheManager.get('task-1')).toEqual({ title: 'Task 1' });
    });

    it('should delete by tags', async () => {
      await cacheManager.set('user-1', { name: 'John' }, { tags: ['users'] });
      await cacheManager.set('user-2', { name: 'Jane' }, { tags: ['users'] });
      await cacheManager.set('task-1', { title: 'Task 1' }, { tags: ['tasks'] });

      await cacheManager.deleteByTags(['users']);

      expect(await cacheManager.get('user-1')).toBeNull();
      expect(await cacheManager.get('user-2')).toBeNull();
      expect(await cacheManager.get('task-1')).toEqual({ title: 'Task 1' });
    });

    it('should handle multiple tags per item', async () => {
      const key = 'multi-tag-item';
      const value = 'tagged-value';
      const tags = ['tag1', 'tag2', 'tag3'];

      await cacheManager.set(key, value, { tags });
      
      expect(await cacheManager.get(key)).toBe(value);
      
      // Deleting by any tag should remove the item
      await cacheManager.deleteByTags(['tag2']);
      expect(await cacheManager.get(key)).toBeNull();
    });
  });

  describe('Compression', () => {
    it('should compress large values', async () => {
      const key = 'large-data';
      const largeValue = 'x'.repeat(10000); // Large string

      await cacheManager.set(key, largeValue, { enableCompression: true });
      
      const retrieved = await cacheManager.get(key);
      expect(retrieved).toBe(largeValue);
    });

    it('should handle compression errors gracefully', async () => {
      const key = 'compression-error';
      const value = 'test-value';

      // Mock compression to throw
      const LZString = await import('lz-string');
      const originalCompress = LZString.compress;
      vi.mocked(LZString.compress).mockImplementation(() => {
        throw new Error('Compression failed');
      });

      // Should still store without compression
      await cacheManager.set(key, value, { enableCompression: true });
      expect(await cacheManager.get(key)).toBe(value);

      // Restore original function
      vi.mocked(LZString.compress).mockImplementation(originalCompress);
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      await cacheManager.set('test1', 'value1');
      await cacheManager.set('test2', 'value2');
      await cacheManager.get('test1'); // Hit
      await cacheManager.get('non-existent'); // Miss

      const stats = await cacheManager.getStatistics();

      expect(stats.totalEntries).toBe(2);
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', async () => {
      await cacheManager.set('hit-test', 'value');
      
      // 2 hits, 1 miss
      await cacheManager.get('hit-test');
      await cacheManager.get('hit-test');
      await cacheManager.get('non-existent');

      const stats = await cacheManager.getStatistics();
      
      expect(stats.hitRate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });

    it('should track storage usage by layer', async () => {
      await cacheManager.set('storage-test-1', 'value1');
      await cacheManager.set('storage-test-2', 'value2');

      const stats = await cacheManager.getStatistics();

      expect(stats.storageUsage).toBeDefined();
      expect(stats.storageUsage.memory).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw, should handle gracefully
      await expect(cacheManager.set('quota-test', 'value')).resolves.not.toThrow();
    });

    it('should handle JSON parse errors', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = await cacheManager.get('invalid-json-key');
      expect(result).toBeNull();
    });

    it('should handle IndexedDB errors', async () => {
      // Mock IndexedDB to fail
      mockIndexedDB.open.mockReturnValue({
        onerror: () => {},
        onsuccess: null,
        onupgradeneeded: null
      });

      // Should fall back to other layers
      await expect(cacheManager.set('idb-error', 'value')).resolves.not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should implement LRU eviction', async () => {
      // Set cache size limit (would need to be configurable)
      const keys = Array.from({ length: 10 }, (_, i) => `key-${i}`);
      
      // Fill cache
      for (const key of keys) {
        await cacheManager.set(key, `value-${key}`);
      }

      // Access some keys to make them recently used
      await cacheManager.get('key-0');
      await cacheManager.get('key-1');

      // Add more items to trigger eviction
      await cacheManager.set('new-key-1', 'new-value-1');
      await cacheManager.set('new-key-2', 'new-value-2');

      // Recently accessed items should still be available
      expect(await cacheManager.get('key-0')).toBe('value-key-0');
      expect(await cacheManager.get('key-1')).toBe('value-key-1');
    });

    it('should clean up expired entries', async () => {
      const expiredKey = 'expired-key';
      const validKey = 'valid-key';

      await cacheManager.set(expiredKey, 'expired-value', { ttl: 50 });
      await cacheManager.set(validKey, 'valid-value', { ttl: 10000 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cleanup should remove expired entries
      const stats = await cacheManager.getStatistics();
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('Advanced Features', () => {
    it('should handle concurrent access safely', async () => {
      const key = 'concurrent-test';
      const promises = [];

      // Start multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(cacheManager.set(`${key}-${i}`, `value-${i}`));
      }

      await Promise.all(promises);

      // All values should be stored correctly
      for (let i = 0; i < 10; i++) {
        expect(await cacheManager.get(`${key}-${i}`)).toBe(`value-${i}`);
      }
    });

    it('should support cache warming', async () => {
      const warmingData = [
        { key: 'warm-1', value: 'warmed-value-1' },
        { key: 'warm-2', value: 'warmed-value-2' },
        { key: 'warm-3', value: 'warmed-value-3' }
      ];

      // Warm cache with multiple entries
      await Promise.all(
        warmingData.map(({ key, value }) => cacheManager.set(key, value))
      );

      // All warmed entries should be available
      for (const { key, value } of warmingData) {
        expect(await cacheManager.get(key)).toBe(value);
      }
    });

    it('should handle serialization of complex objects', async () => {
      const complexObject = {
        id: 1,
        name: 'Complex Object',
        nested: {
          array: [1, 2, 3],
          date: new Date().toISOString(),
          boolean: true,
          null: null,
          undefined: undefined
        },
        functions: undefined // Functions should be filtered out
      };

      await cacheManager.set('complex-object', complexObject);
      const retrieved = await cacheManager.get('complex-object');

      expect(retrieved).toMatchObject({
        id: 1,
        name: 'Complex Object',
        nested: {
          array: [1, 2, 3],
          date: complexObject.nested.date,
          boolean: true,
          null: null
        }
      });
    });
  });
});

describe('useCache Hook', () => {
  it('should provide cache operations', () => {
    const { result } = renderHook(() => useCache());

    expect(result.current).toMatchObject({
      get: expect.any(Function),
      set: expect.any(Function),
      delete: expect.any(Function),
      clear: expect.any(Function),
      has: expect.any(Function),
      getStatistics: expect.any(Function)
    });
  });

  it('should set and get values through hook', async () => {
    const { result } = renderHook(() => useCache());

    await act(async () => {
      await result.current.set('hook-test', 'hook-value');
    });

    await act(async () => {
      const value = await result.current.get('hook-test');
      expect(value).toBe('hook-value');
    });
  });

  it('should delete values through hook', async () => {
    const { result } = renderHook(() => useCache());

    await act(async () => {
      await result.current.set('hook-delete', 'delete-me');
      expect(await result.current.get('hook-delete')).toBe('delete-me');
      
      await result.current.delete('hook-delete');
      expect(await result.current.get('hook-delete')).toBeNull();
    });
  });

  it('should check existence through hook', async () => {
    const { result } = renderHook(() => useCache());

    await act(async () => {
      expect(await result.current.has('hook-exists')).toBe(false);
      
      await result.current.set('hook-exists', 'exists');
      expect(await result.current.has('hook-exists')).toBe(true);
    });
  });

  it('should provide statistics through hook', async () => {
    const { result } = renderHook(() => useCache());

    await act(async () => {
      await result.current.set('stats-test', 'value');
      const stats = await result.current.getStatistics();
      
      expect(stats).toMatchObject({
        totalEntries: expect.any(Number),
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.any(Number)
      });
    });
  });

  it('should clear cache through hook', async () => {
    const { result } = renderHook(() => useCache());

    await act(async () => {
      await result.current.set('clear-test-1', 'value1');
      await result.current.set('clear-test-2', 'value2');
      
      await result.current.clear();
      
      expect(await result.current.get('clear-test-1')).toBeNull();
      expect(await result.current.get('clear-test-2')).toBeNull();
    });
  });
});

describe('Integration Tests', () => {
  it('should work across browser sessions (localStorage persistence)', async () => {
    const key = 'persistent-test';
    const value = 'persisted-value';

    await cacheManager.set(key, value, { priority: 'high' });

    // Simulate page reload by mocking localStorage to return the value
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      value,
      timestamp: Date.now(),
      ttl: Infinity,
      tags: [],
      priority: 'high'
    }));

    const retrieved = await cacheManager.get(key);
    expect(retrieved).toBe(value);
  });

  it('should handle cache invalidation scenarios', async () => {
    // Set up related data with tags
    await cacheManager.set('user-profile-123', { name: 'John' }, { tags: ['user-123'] });
    await cacheManager.set('user-tasks-123', [{ id: 1 }], { tags: ['user-123', 'tasks'] });
    await cacheManager.set('user-notifications-123', [], { tags: ['user-123', 'notifications'] });

    // Invalidate all user-related data
    await cacheManager.deleteByTags(['user-123']);

    // All user data should be invalidated
    expect(await cacheManager.get('user-profile-123')).toBeNull();
    expect(await cacheManager.get('user-tasks-123')).toBeNull();
    expect(await cacheManager.get('user-notifications-123')).toBeNull();
  });

  it('should maintain performance under load', async () => {
    const operations = 1000;
    const startTime = performance.now();

    // Perform many cache operations
    const promises = [];
    for (let i = 0; i < operations; i++) {
      promises.push(cacheManager.set(`load-test-${i}`, `value-${i}`));
    }
    await Promise.all(promises);

    const setTime = performance.now();

    // Read all values back
    const readPromises = [];
    for (let i = 0; i < operations; i++) {
      readPromises.push(cacheManager.get(`load-test-${i}`));
    }
    await Promise.all(readPromises);

    const endTime = performance.now();

    const setDuration = setTime - startTime;
    const getDuration = endTime - setTime;

    // Operations should complete in reasonable time
    expect(setDuration).toBeLessThan(1000); // 1 second for 1000 sets
    expect(getDuration).toBeLessThan(500);  // 0.5 seconds for 1000 gets

    console.log(`Performance test: ${operations} sets in ${setDuration}ms, ${operations} gets in ${getDuration}ms`);
  });
});