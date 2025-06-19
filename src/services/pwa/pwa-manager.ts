/**
 * Progressive Web App Manager
 * 
 * Comprehensive PWA management service that handles service worker registration,
 * offline capabilities, app installation, and background sync.
 */

import { errorTracker } from '../monitoring/error-tracking';

interface PWAConfig {
  enableOffline: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  cacheStrategies: {
    apiCalls: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    assets: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    pages: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  };
  offlinePages: string[];
  criticalAssets: string[];
}

interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  serviceWorkerReady: boolean;
  hasUpdate: boolean;
  installPromptAvailable: boolean;
}

interface OfflineTask {
  id: string;
  type: 'api-call' | 'form-submission' | 'file-upload';
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class PWAManagerService {
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private config: PWAConfig;
  private status: PWAStatus;
  private offlineTasks: OfflineTask[] = [];
  private updateAvailable = false;

  constructor(config?: Partial<PWAConfig>) {
    this.config = {
      enableOffline: true,
      enableBackgroundSync: true,
      enablePushNotifications: true,
      cacheStrategies: {
        apiCalls: 'network-first',
        assets: 'cache-first',
        pages: 'stale-while-revalidate'
      },
      offlinePages: ['/offline', '/dashboard', '/tasks'],
      criticalAssets: ['/manifest.json', '/favicon.ico'],
      ...config
    };

    this.status = {
      isInstallable: false,
      isInstalled: this.isAppInstalled(),
      isOnline: navigator.onLine,
      serviceWorkerReady: false,
      hasUpdate: false,
      installPromptAvailable: false
    };

    this.initialize();
  }

  /**
   * Initialize PWA features
   */
  private async initialize(): Promise<void> {
    try {
      // Check if PWA is supported
      if (!this.isPWASupported()) {
        console.warn('PWA features not supported in this browser');
        return;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Setup offline detection
      this.setupOfflineDetection();

      // Setup install prompt handling
      this.setupInstallPrompt();

      // Setup background sync
      if (this.config.enableBackgroundSync) {
        this.setupBackgroundSync();
      }

      // Setup push notifications
      if (this.config.enablePushNotifications) {
        await this.setupPushNotifications();
      }

      // Load offline tasks
      this.loadOfflineTasks();

      // Setup update detection
      this.setupUpdateDetection();

      console.log('PWA Manager initialized successfully');
    } catch (error) {
      console.error('PWA initialization failed:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          component: 'PWAManager',
          operation: 'initialize'
        }
      });
    }
  }

  /**
   * Check if PWA features are supported
   */
  private isPWASupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'caches' in window &&
      'fetch' in window
    );
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.serviceWorker = registration;
      this.status.serviceWorkerReady = true;

      console.log('Service Worker registered:', registration);

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Check for existing service worker
      if (registration.active) {
        this.setupServiceWorkerMessaging(registration);
      }

      registration.addEventListener('activate', () => {
        this.setupServiceWorkerMessaging(registration);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateAvailable = true;
        this.status.hasUpdate = true;
        this.notifyUpdateAvailable();
      }
    });
  }

  /**
   * Setup service worker messaging
   */
  private setupServiceWorkerMessaging(registration: ServiceWorkerRegistration): void {
    if (!registration.active) return;

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'CACHE_UPDATED':
          console.log('Cache updated:', payload);
          break;
        case 'OFFLINE_TASK_COMPLETED':
          this.handleOfflineTaskCompleted(payload);
          break;
        case 'BACKGROUND_SYNC_SUCCESS':
          console.log('Background sync completed:', payload);
          break;
        case 'PUSH_NOTIFICATION_RECEIVED':
          this.handlePushNotification(payload);
          break;
      }
    });

    // Send configuration to service worker
    this.sendMessageToServiceWorker({
      type: 'PWA_CONFIG',
      payload: this.config
    });
  }

  /**
   * Setup offline detection
   */
  private setupOfflineDetection(): void {
    const updateOnlineStatus = () => {
      this.status.isOnline = navigator.onLine;
      
      if (this.status.isOnline) {
        this.handleOnlineStateChange();
      } else {
        this.handleOfflineStateChange();
      }

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:connection-change', {
        detail: { isOnline: this.status.isOnline }
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();
  }

  /**
   * Handle online state change
   */
  private handleOnlineStateChange(): void {
    console.log('App is online');
    
    // Process offline tasks
    this.processOfflineTasks();
    
    // Sync data
    this.syncOfflineData();
  }

  /**
   * Handle offline state change
   */
  private handleOfflineStateChange(): void {
    console.log('App is offline');
    
    // Show offline notification
    this.showOfflineNotification();
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.status.installPromptAvailable = true;
      this.status.isInstallable = true;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:install-available'));
    });

    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true;
      this.installPrompt = null;
      this.status.installPromptAvailable = false;

      // Track installation
      this.trackInstallation();

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:installed'));
    });
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    // Background sync will be handled by the service worker
    console.log('Background sync enabled');
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      await this.subscribeToNotifications();
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribeToNotifications();
    }

    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToNotifications(): Promise<void> {
    if (!this.serviceWorker) {
      throw new Error('Service worker not registered');
    }

    try {
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey()
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Push notification subscription created');
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  }

  /**
   * Get VAPID public key (should be configured in environment)
   */
  private getVapidPublicKey(): Uint8Array {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    
    if (!vapidKey) {
      console.warn('VAPID public key not configured');
      return new Uint8Array();
    }

    return this.urlBase64ToUint8Array(vapidKey);
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // This would typically send to your API
    console.log('Subscription to send to server:', subscription);
    
    // Example implementation:
    /*
    await fetch('/api/push-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    */
  }

  /**
   * Show app install prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if app is installed
   */
  private isAppInstalled(): boolean {
    // Check for display-mode: standalone
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Add task to offline queue
   */
  public addOfflineTask(task: Omit<OfflineTask, 'id' | 'timestamp' | 'retryCount'>): void {
    const offlineTask: OfflineTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineTasks.push(offlineTask);
    this.saveOfflineTasks();

    // Try to sync immediately if online
    if (this.status.isOnline) {
      this.processOfflineTasks();
    }
  }

  /**
   * Process offline tasks
   */
  private async processOfflineTasks(): Promise<void> {
    if (this.offlineTasks.length === 0) return;

    const tasksToProcess = [...this.offlineTasks];
    
    for (const task of tasksToProcess) {
      try {
        await this.executeOfflineTask(task);
        this.removeOfflineTask(task.id);
      } catch (error) {
        task.retryCount++;
        
        if (task.retryCount >= task.maxRetries) {
          console.error(`Offline task ${task.id} failed after ${task.maxRetries} retries:`, error);
          this.removeOfflineTask(task.id);
        }
      }
    }

    this.saveOfflineTasks();
  }

  /**
   * Execute offline task
   */
  private async executeOfflineTask(task: OfflineTask): Promise<void> {
    const response = await fetch(task.url, {
      method: task.method,
      headers: {
        'Content-Type': 'application/json',
        ...task.headers
      },
      body: task.data ? JSON.stringify(task.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`Offline task ${task.id} completed successfully`);
  }

  /**
   * Handle offline task completion from service worker
   */
  private handleOfflineTaskCompleted(taskId: string): void {
    this.removeOfflineTask(taskId);
  }

  /**
   * Remove offline task
   */
  private removeOfflineTask(taskId: string): void {
    this.offlineTasks = this.offlineTasks.filter(task => task.id !== taskId);
    this.saveOfflineTasks();
  }

  /**
   * Save offline tasks to localStorage
   */
  private saveOfflineTasks(): void {
    localStorage.setItem('pwa_offline_tasks', JSON.stringify(this.offlineTasks));
  }

  /**
   * Load offline tasks from localStorage
   */
  private loadOfflineTasks(): void {
    try {
      const stored = localStorage.getItem('pwa_offline_tasks');
      if (stored) {
        this.offlineTasks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline tasks:', error);
      this.offlineTasks = [];
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup update detection
   */
  private setupUpdateDetection(): void {
    // Check for updates periodically
    setInterval(() => {
      if (this.serviceWorker) {
        this.serviceWorker.update();
      }
    }, 60000); // Check every minute
  }

  /**
   * Notify user of available update
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa:update-available'));

    // Show notification
    this.showUpdateNotification();
  }

  /**
   * Apply available update
   */
  public async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !this.serviceWorker) {
      throw new Error('No update available');
    }

    // Send message to service worker to skip waiting
    this.sendMessageToServiceWorker({
      type: 'SKIP_WAITING'
    });

    // Wait for the new service worker to become active
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      });
    });

    // Reload the page to use the new service worker
    window.location.reload();
  }

  /**
   * Send message to service worker
   */
  private sendMessageToServiceWorker(message: any): void {
    if (this.serviceWorker?.active) {
      this.serviceWorker.active.postMessage(message);
    }
  }

  /**
   * Handle push notification
   */
  private handlePushNotification(payload: any): void {
    console.log('Push notification received:', payload);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa:notification-received', {
      detail: payload
    }));
  }

  /**
   * Sync offline data
   */
  private async syncOfflineData(): Promise<void> {
    // This would typically sync any cached data with the server
    console.log('Syncing offline data...');
    
    // Example: sync user preferences, cached content, etc.
  }

  /**
   * Track installation analytics
   */
  private trackInstallation(): void {
    // Track PWA installation
    errorTracker.trackEvent({
      name: 'pwa_installed',
      properties: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    });
  }

  /**
   * Show offline notification
   */
  private showOfflineNotification(): void {
    const notification = document.createElement('div');
    notification.id = 'pwa-offline-notification';
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f39c12;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
      📶 You're offline. Some features may be limited.
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        margin-left: 10px;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
    }, 100);
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2196F3;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 10px;">
        🚀 A new version is available!
      </div>
      <button onclick="window.pwaManager.applyUpdate()" style="
        background: white;
        color: #2196F3;
        border: none;
        padding: 8px 16px;
        border-radius: 3px;
        cursor: pointer;
        margin-right: 10px;
      ">Update</button>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: 1px solid white;
        color: white;
        padding: 8px 16px;
        border-radius: 3px;
        cursor: pointer;
      ">Later</button>
    `;
    
    document.body.appendChild(notification);
  }

  /**
   * Get PWA status
   */
  public getStatus(): PWAStatus {
    return { ...this.status };
  }

  /**
   * Get offline tasks count
   */
  public getOfflineTasksCount(): number {
    return this.offlineTasks.length;
  }

  /**
   * Clear all offline tasks
   */
  public clearOfflineTasks(): void {
    this.offlineTasks = [];
    this.saveOfflineTasks();
  }

  /**
   * Enable/disable PWA features
   */
  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.initialize();
    } else {
      // Unregister service worker
      if (this.serviceWorker) {
        this.serviceWorker.unregister();
      }
    }
  }
}

// Create global instance
const pwaManager = new PWAManagerService();

// Make available globally for update notifications
(window as any).pwaManager = pwaManager;

// React hook for PWA functionality
export function usePWA() {
  return {
    install: () => pwaManager.showInstallPrompt(),
    getStatus: () => pwaManager.getStatus(),
    addOfflineTask: (task: Omit<OfflineTask, 'id' | 'timestamp' | 'retryCount'>) =>
      pwaManager.addOfflineTask(task),
    getOfflineTasksCount: () => pwaManager.getOfflineTasksCount(),
    clearOfflineTasks: () => pwaManager.clearOfflineTasks(),
    requestNotifications: () => pwaManager.requestNotificationPermission(),
    applyUpdate: () => pwaManager.applyUpdate()
  };
}

export type { PWAConfig, PWAStatus, OfflineTask };
export default pwaManager;