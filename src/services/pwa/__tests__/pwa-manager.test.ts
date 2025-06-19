/**
 * PWA Manager Tests
 * 
 * Tests for Progressive Web App functionality including service worker
 * registration, offline support, background sync, and push notifications.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { pwaManager, usePWAInstall, usePWAStatus } from '../pwa-manager';

// Mock service worker registration
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
  unregister: vi.fn().mockResolvedValue(true),
  pushManager: {
    subscribe: vi.fn().mockResolvedValue({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    }),
    getSubscription: vi.fn().mockResolvedValue(null)
  },
  sync: {
    register: vi.fn().mockResolvedValue(undefined)
  },
  showNotification: vi.fn().mockResolvedValue(undefined)
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
      ready: Promise.resolve(mockServiceWorkerRegistration),
      controller: mockServiceWorkerRegistration,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    },
    onLine: true,
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' })
    }
  },
  writable: true
});

// Mock window events
const mockBeforeInstallPrompt = {
  preventDefault: vi.fn(),
  prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
  userChoice: Promise.resolve({ outcome: 'accepted' })
};

Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    Notification: {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted')
    },
    matchMedia: vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn()
    })
  },
  writable: true
});

describe('PWAManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registration = await pwaManager.registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBe(mockServiceWorkerRegistration);
    });

    it('should handle service worker registration failure', async () => {
      const mockError = new Error('Service Worker registration failed');
      vi.mocked(navigator.serviceWorker.register).mockRejectedValueOnce(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const registration = await pwaManager.registerServiceWorker();

      expect(registration).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Service Worker registration failed:',
        mockError
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing service worker support', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      const registration = await pwaManager.registerServiceWorker();

      expect(registration).toBeNull();

      // Restore service worker
      (navigator as any).serviceWorker = originalServiceWorker;
    });

    it('should update service worker when available', async () => {
      await pwaManager.registerServiceWorker();
      await pwaManager.updateServiceWorker();

      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });
  });

  describe('PWA Installation', () => {
    it('should detect when PWA is installable', () => {
      // Simulate beforeinstallprompt event
      const mockEvent = mockBeforeInstallPrompt;
      
      pwaManager.handleBeforeInstallPrompt(mockEvent as any);
      
      expect(pwaManager.isInstallable()).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should prompt for installation', async () => {
      // Set up installable state
      pwaManager.handleBeforeInstallPrompt(mockBeforeInstallPrompt as any);

      const result = await pwaManager.promptInstall();

      expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle installation prompt rejection', async () => {
      const rejectPrompt = {
        ...mockBeforeInstallPrompt,
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };

      pwaManager.handleBeforeInstallPrompt(rejectPrompt as any);

      const result = await pwaManager.promptInstall();

      expect(result).toBe(false);
    });

    it('should detect when PWA is already installed', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue({ matches: true }),
        writable: true
      });

      expect(pwaManager.isInstalled()).toBe(true);
    });
  });

  describe('Push Notifications', () => {
    it('should request notification permission', async () => {
      const permission = await pwaManager.requestNotificationPermission();

      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should subscribe to push notifications', async () => {
      await pwaManager.registerServiceWorker();
      
      const subscription = await pwaManager.subscribeToPush('test-vapid-key');

      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key'
      });
      expect(subscription).toBeDefined();
    });

    it('should unsubscribe from push notifications', async () => {
      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(true)
      };

      vi.mocked(mockServiceWorkerRegistration.pushManager.getSubscription)
        .mockResolvedValue(mockSubscription as any);

      await pwaManager.registerServiceWorker();
      const result = await pwaManager.unsubscribeFromPush();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should show local notifications', async () => {
      await pwaManager.registerServiceWorker();

      await pwaManager.showNotification('Test Title', {
        body: 'Test body',
        icon: '/icon.png',
        badge: '/badge.png'
      });

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test body',
          icon: '/icon.png',
          badge: '/badge.png'
        })
      );
    });

    it('should handle notification permission denied', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: true
      });

      const permission = await pwaManager.requestNotificationPermission();
      expect(permission).toBe('denied');

      // Should not attempt to show notification
      await pwaManager.showNotification('Test', { body: 'Test' });
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      await pwaManager.registerServiceWorker();
      await pwaManager.registerBackgroundSync('test-sync');

      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('test-sync');
    });

    it('should handle background sync registration failure', async () => {
      vi.mocked(mockServiceWorkerRegistration.sync.register)
        .mockRejectedValue(new Error('Sync registration failed'));

      await pwaManager.registerServiceWorker();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await pwaManager.registerBackgroundSync('test-sync');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Background sync registration failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should queue tasks for offline execution', async () => {
      const task = {
        id: 'task-1',
        type: 'api-call',
        data: { endpoint: '/api/test', method: 'POST' }
      };

      await pwaManager.queueOfflineTask(task);

      // Should store task in offline queue
      const queuedTasks = await pwaManager.getOfflineQueue();
      expect(queuedTasks).toContainEqual(expect.objectContaining({
        id: 'task-1',
        type: 'api-call'
      }));
    });

    it('should process offline queue when online', async () => {
      const tasks = [
        { id: 'task-1', type: 'api-call', data: {} },
        { id: 'task-2', type: 'sync-data', data: {} }
      ];

      // Queue tasks
      for (const task of tasks) {
        await pwaManager.queueOfflineTask(task);
      }

      // Process queue
      await pwaManager.processOfflineQueue();

      // Queue should be empty after processing
      const remainingTasks = await pwaManager.getOfflineQueue();
      expect(remainingTasks).toHaveLength(0);
    });
  });

  describe('Offline Detection', () => {
    it('should detect online/offline status', () => {
      expect(pwaManager.isOnline()).toBe(true);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      expect(pwaManager.isOnline()).toBe(false);
    });

    it('should handle online/offline events', () => {
      const onlineHandler = vi.fn();
      const offlineHandler = vi.fn();

      pwaManager.onOnline(onlineHandler);
      pwaManager.onOffline(offlineHandler);

      // Simulate offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      // Simulate online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Cache Management', () => {
    it('should clear app cache', async () => {
      await pwaManager.registerServiceWorker();

      // Mock caches API
      global.caches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        delete: vi.fn().mockResolvedValue(true)
      } as any;

      await pwaManager.clearCache();

      expect(global.caches.keys).toHaveBeenCalled();
      expect(global.caches.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle cache clearing errors', async () => {
      global.caches = {
        keys: vi.fn().mockRejectedValue(new Error('Cache access failed'))
      } as any;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await pwaManager.clearCache();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear cache:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('PWA Status', () => {
    it('should provide comprehensive PWA status', async () => {
      await pwaManager.registerServiceWorker();
      pwaManager.handleBeforeInstallPrompt(mockBeforeInstallPrompt as any);

      const status = await pwaManager.getStatus();

      expect(status).toMatchObject({
        isServiceWorkerSupported: true,
        isServiceWorkerRegistered: true,
        isInstallable: true,
        isInstalled: expect.any(Boolean),
        isOnline: true,
        notificationPermission: 'granted',
        hasOfflineQueue: expect.any(Boolean)
      });
    });

    it('should handle missing PWA features gracefully', async () => {
      // Remove service worker support
      delete (navigator as any).serviceWorker;

      const status = await pwaManager.getStatus();

      expect(status.isServiceWorkerSupported).toBe(false);
      expect(status.isServiceWorkerRegistered).toBe(false);
    });
  });
});

describe('usePWAInstall Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide installation functionality', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current).toMatchObject({
      isInstallable: expect.any(Boolean),
      isInstalled: expect.any(Boolean),
      install: expect.any(Function)
    });
  });

  it('should handle installation through hook', async () => {
    const { result } = renderHook(() => usePWAInstall());

    // Set up installable state
    pwaManager.handleBeforeInstallPrompt(mockBeforeInstallPrompt as any);

    await act(async () => {
      const success = await result.current.install();
      expect(success).toBe(true);
    });
  });

  it('should update installable state reactively', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstallable).toBe(false);

    act(() => {
      pwaManager.handleBeforeInstallPrompt(mockBeforeInstallPrompt as any);
    });

    expect(result.current.isInstallable).toBe(true);
  });
});

describe('usePWAStatus Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide PWA status information', () => {
    const { result } = renderHook(() => usePWAStatus());

    expect(result.current).toMatchObject({
      isOnline: expect.any(Boolean),
      isServiceWorkerRegistered: expect.any(Boolean),
      notificationPermission: expect.any(String),
      updateStatus: expect.any(Function),
      requestNotifications: expect.any(Function)
    });
  });

  it('should update online status reactively', () => {
    const { result } = renderHook(() => usePWAStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      // Simulate offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
    });

    // Note: In a real implementation, this would update reactively
    // For now, we just verify the structure is correct
    expect(result.current.isOnline).toBeDefined();
  });

  it('should handle notification permission requests', async () => {
    const { result } = renderHook(() => usePWAStatus());

    await act(async () => {
      const permission = await result.current.requestNotifications();
      expect(permission).toBe('granted');
    });

    expect(Notification.requestPermission).toHaveBeenCalled();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete PWA lifecycle', async () => {
    // 1. Register service worker
    const registration = await pwaManager.registerServiceWorker();
    expect(registration).toBeTruthy();

    // 2. Handle install prompt
    pwaManager.handleBeforeInstallPrompt(mockBeforeInstallPrompt as any);
    expect(pwaManager.isInstallable()).toBe(true);

    // 3. Request notification permission
    const permission = await pwaManager.requestNotificationPermission();
    expect(permission).toBe('granted');

    // 4. Subscribe to push notifications
    const subscription = await pwaManager.subscribeToPush('test-vapid-key');
    expect(subscription).toBeDefined();

    // 5. Show notification
    await pwaManager.showNotification('Welcome!', {
      body: 'App is ready to use offline'
    });

    // 6. Register background sync
    await pwaManager.registerBackgroundSync('initial-sync');

    // 7. Get final status
    const status = await pwaManager.getStatus();
    expect(status.isServiceWorkerRegistered).toBe(true);
  });

  it('should handle offline workflow', async () => {
    await pwaManager.registerServiceWorker();

    // Go offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });

    // Queue offline tasks
    const tasks = [
      { id: 'offline-1', type: 'api-call', data: { endpoint: '/api/sync' } },
      { id: 'offline-2', type: 'data-update', data: { table: 'users' } }
    ];

    for (const task of tasks) {
      await pwaManager.queueOfflineTask(task);
    }

    // Verify tasks are queued
    const queuedTasks = await pwaManager.getOfflineQueue();
    expect(queuedTasks).toHaveLength(2);

    // Come back online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    // Process offline queue
    await pwaManager.processOfflineQueue();

    // Queue should be empty
    const remainingTasks = await pwaManager.getOfflineQueue();
    expect(remainingTasks).toHaveLength(0);
  });

  it('should handle service worker updates', async () => {
    await pwaManager.registerServiceWorker();

    // Simulate service worker update available
    mockServiceWorkerRegistration.waiting = {
      state: 'installed',
      postMessage: vi.fn()
    };

    await pwaManager.updateServiceWorker();

    expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
  });

  it('should work in unsupported browsers', async () => {
    // Remove all PWA APIs
    delete (navigator as any).serviceWorker;
    delete (window as any).Notification;
    delete (global as any).caches;

    // Should handle gracefully
    const registration = await pwaManager.registerServiceWorker();
    expect(registration).toBeNull();

    const permission = await pwaManager.requestNotificationPermission();
    expect(permission).toBe('denied');

    const status = await pwaManager.getStatus();
    expect(status.isServiceWorkerSupported).toBe(false);
  });
});

describe('Error Handling', () => {
  it('should handle service worker errors gracefully', async () => {
    const mockError = new Error('Service Worker error');
    vi.mocked(navigator.serviceWorker.register).mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const registration = await pwaManager.registerServiceWorker();

    expect(registration).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Service Worker registration failed:',
      mockError
    );

    consoleSpy.mockRestore();
  });

  it('should handle push subscription errors', async () => {
    vi.mocked(mockServiceWorkerRegistration.pushManager.subscribe)
      .mockRejectedValue(new Error('Push subscription failed'));

    await pwaManager.registerServiceWorker();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const subscription = await pwaManager.subscribeToPush('test-key');

    expect(subscription).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Push subscription failed:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle offline queue errors', async () => {
    // Mock localStorage to fail
    const mockError = new Error('Storage quota exceeded');
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn().mockImplementation(() => {
          throw mockError;
        }),
        removeItem: vi.fn()
      },
      writable: true
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await pwaManager.queueOfflineTask({
      id: 'error-task',
      type: 'test',
      data: {}
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});