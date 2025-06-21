/**
 * Cache Warming Service
 * 
 * Intelligently preloads and warms cache with frequently accessed data
 * based on user behavior, time patterns, and predictive algorithms.
 */

import { cacheManager } from './cache-manager';
// import { queryCache } from './query-cache'; // Not currently used
import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../monitoring/error-tracking';

interface WarmingStrategy {
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  condition?: () => boolean;
  dataProvider: () => Promise<Array<{ key: string; data: any; tags?: string[] }>>;
  schedule?: {
    immediate?: boolean;
    onMount?: boolean;
    onIdle?: boolean;
    onInterval?: number; // milliseconds
    onTimeOfDay?: string[]; // ['09:00', '17:00']
  };
  dependencies?: string[]; // Other strategies that must complete first
}

interface WarmingPattern {
  route: string;
  queries: string[];
  weight: number; // Higher weight = more important
  conditions?: {
    userRole?: string[];
    timeOfDay?: string[];
    dayOfWeek?: number[];
  };
}

interface UserBehaviorData {
  frequentRoutes: Array<{ route: string; visits: number; lastVisit: number }>;
  commonQueries: Array<{ query: string; frequency: number; avgResponseTime: number }>;
  timePatterns: Array<{ hour: number; activity: number }>;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  connectionSpeed: 'slow' | 'medium' | 'fast';
}

interface WarmingMetrics {
  strategiesExecuted: number;
  totalEntriesWarmed: number;
  totalTimeSpent: number;
  successRate: number;
  averageWarmingTime: number;
  cacheHitImprovement: number;
  bandwidthSaved: number;
}

class CacheWarmerService {
  private strategies = new Map<string, WarmingStrategy>();
  private patterns: WarmingPattern[] = [];
  private userBehavior: UserBehaviorData | null = null;
  private metrics: WarmingMetrics;
  private isWarming = false;
  private warmingQueue: string[] = [];
  private completedStrategies = new Set<string>();

  constructor() {
    this.metrics = {
      strategiesExecuted: 0,
      totalEntriesWarmed: 0,
      totalTimeSpent: 0,
      successRate: 0,
      averageWarmingTime: 0,
      cacheHitImprovement: 0,
      bandwidthSaved: 0
    };

    this.initialize();
  }

  /**
   * Initialize cache warming with default strategies
   */
  private async initialize(): Promise<void> {
    try {
      // Load user behavior data
      await this.loadUserBehavior();

      // Setup default warming strategies
      this.setupDefaultStrategies();

      // Setup user behavior patterns
      this.setupBehaviorPatterns();

      // Start warming process
      this.startWarming();

      console.log('Cache warmer initialized with', this.strategies.size, 'strategies');
    } catch (error) {
      console.error('Cache warmer initialization failed:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          component: 'CacheWarmer',
          operation: 'initialize'
        }
      });
    }
  }

  /**
   * Setup default warming strategies
   */
  private setupDefaultStrategies(): void {
    // Critical app data - load immediately
    this.addStrategy({
      name: 'critical-app-data',
      priority: 'critical',
      schedule: { immediate: true },
      dataProvider: async () => [
        {
          key: 'app-config',
          data: await this.fetchAppConfig(),
          tags: ['config', 'app']
        },
        {
          key: 'feature-flags',
          data: await this.fetchFeatureFlags(),
          tags: ['config', 'features']
        },
        {
          key: 'user-session',
          data: await this.fetchUserSession(),
          tags: ['user', 'session']
        }
      ]
    });

    // User profile and preferences - load on mount
    this.addStrategy({
      name: 'user-profile',
      priority: 'high',
      condition: () => this.isUserAuthenticated(),
      schedule: { onMount: true },
      dependencies: ['critical-app-data'],
      dataProvider: async () => [
        {
          key: 'user-profile',
          data: await this.fetchUserProfile(),
          tags: ['user', 'profile']
        },
        {
          key: 'user-preferences',
          data: await this.fetchUserPreferences(),
          tags: ['user', 'preferences']
        },
        {
          key: 'user-notifications',
          data: await this.fetchUserNotifications(),
          tags: ['user', 'notifications']
        }
      ]
    });

    // Recent tasks and activity - load when idle
    this.addStrategy({
      name: 'recent-activity',
      priority: 'medium',
      condition: () => this.isUserAuthenticated(),
      schedule: { onIdle: true },
      dependencies: ['user-profile'],
      dataProvider: async () => [
        {
          key: 'recent-tasks',
          data: await this.fetchRecentTasks(),
          tags: ['tasks', 'recent']
        },
        {
          key: 'user-bids',
          data: await this.fetchUserBids(),
          tags: ['bids', 'user']
        },
        {
          key: 'task-recommendations',
          data: await this.fetchTaskRecommendations(),
          tags: ['tasks', 'recommendations']
        }
      ]
    });

    // Popular and trending data - load periodically
    this.addStrategy({
      name: 'trending-data',
      priority: 'low',
      schedule: { 
        onIdle: true,
        onInterval: 15 * 60 * 1000 // Every 15 minutes
      },
      dataProvider: async () => [
        {
          key: 'popular-tasks',
          data: await this.fetchPopularTasks(),
          tags: ['tasks', 'popular']
        },
        {
          key: 'trending-categories',
          data: await this.fetchTrendingCategories(),
          tags: ['categories', 'trending']
        },
        {
          key: 'top-taskers',
          data: await this.fetchTopTaskers(),
          tags: ['users', 'top']
        }
      ]
    });

    // Location-based data - load based on user location
    this.addStrategy({
      name: 'location-data',
      priority: 'medium',
      condition: () => this.hasLocationPermission(),
      schedule: { onMount: true },
      dataProvider: async () => {
        const location = await this.getUserLocation();
        return [
          {
            key: 'nearby-tasks',
            data: await this.fetchNearbyTasks(location),
            tags: ['tasks', 'location']
          },
          {
            key: 'local-taskers',
            data: await this.fetchLocalTaskers(location),
            tags: ['users', 'location']
          }
        ];
      }
    });

    // Time-based strategies
    this.addStrategy({
      name: 'morning-boost',
      priority: 'medium',
      condition: () => this.isTimeOfDay('morning'),
      schedule: { immediate: true },
      dataProvider: async () => [
        {
          key: 'daily-summary',
          data: await this.fetchDailySummary(),
          tags: ['summary', 'daily']
        },
        {
          key: 'urgent-tasks',
          data: await this.fetchUrgentTasks(),
          tags: ['tasks', 'urgent']
        }
      ]
    });
  }

  /**
   * Setup user behavior patterns for predictive warming
   */
  private setupBehaviorPatterns(): void {
    this.patterns = [
      {
        route: '/dashboard',
        queries: ['user-stats', 'recent-activity', 'notifications'],
        weight: 10,
        conditions: {
          timeOfDay: ['09:00-12:00', '13:00-18:00']
        }
      },
      {
        route: '/tasks',
        queries: ['tasks-list', 'categories', 'filters'],
        weight: 8,
        conditions: {
          userRole: ['client', 'tasker']
        }
      },
      {
        route: '/task/*',
        queries: ['task-details', 'related-tasks', 'tasker-profile'],
        weight: 7
      },
      {
        route: '/profile',
        queries: ['user-profile', 'user-reviews', 'user-stats'],
        weight: 5,
        conditions: {
          timeOfDay: ['18:00-22:00']
        }
      },
      {
        route: '/messages',
        queries: ['conversations', 'unread-count'],
        weight: 6,
        conditions: {
          timeOfDay: ['09:00-18:00']
        }
      }
    ];
  }

  /**
   * Add custom warming strategy
   */
  addStrategy(strategy: WarmingStrategy): void {
    this.strategies.set(strategy.name, strategy);
    
    // Schedule based on strategy configuration
    this.scheduleStrategy(strategy);
  }

  /**
   * Schedule strategy execution
   */
  private scheduleStrategy(strategy: WarmingStrategy): void {
    const { schedule } = strategy;
    if (!schedule) return;

    // Immediate execution
    if (schedule.immediate) {
      this.executeStrategy(strategy.name);
    }

    // On mount execution
    if (schedule.onMount) {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.executeStrategy(strategy.name), 100);
      });
    }

    // On idle execution
    if (schedule.onIdle) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.executeStrategy(strategy.name));
      } else {
        setTimeout(() => this.executeStrategy(strategy.name), 5000);
      }
    }

    // Interval execution
    if (schedule.onInterval) {
      setInterval(() => {
        this.executeStrategy(strategy.name);
      }, schedule.onInterval);
    }

    // Time-based execution
    if (schedule.onTimeOfDay) {
      this.scheduleTimeBasedExecution(strategy.name, schedule.onTimeOfDay);
    }
  }

  /**
   * Execute warming strategy
   */
  async executeStrategy(strategyName: string): Promise<void> {
    if (this.completedStrategies.has(strategyName)) {
      return; // Already completed
    }

    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      console.warn(`Strategy ${strategyName} not found`);
      return;
    }

    // Check conditions
    if (strategy.condition && !strategy.condition()) {
      return;
    }

    // Check dependencies
    if (strategy.dependencies) {
      const unmetDependencies = strategy.dependencies.filter(dep => 
        !this.completedStrategies.has(dep)
      );
      
      if (unmetDependencies.length > 0) {
        // Queue for later execution
        this.warmingQueue.push(strategyName);
        return;
      }
    }

    const startTime = performance.now();

    try {
      console.log(`Executing warming strategy: ${strategyName}`);

      const data = await strategy.dataProvider();
      
      // Cache the data
      await Promise.all(
        data.map(item => 
          cacheManager.set(item.key, item.data, {
            tags: item.tags,
            priority: this.mapPriorityToCache(strategy.priority)
          })
        )
      );

      // Mark as completed
      this.completedStrategies.add(strategyName);

      // Update metrics
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.updateMetrics(data.length, executionTime, true);

      // Process queued strategies
      this.processQueue();

      performanceMonitor.recordMetric({
        name: 'cache.warm.strategy',
        value: executionTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          strategy: strategyName,
          priority: strategy.priority,
          entries: String(data.length)
        }
      });

      console.log(`Strategy ${strategyName} completed in ${executionTime.toFixed(2)}ms. Warmed ${data.length} entries.`);

    } catch (error) {
      console.error(`Strategy ${strategyName} failed:`, error);
      this.updateMetrics(0, performance.now() - startTime, false);
      
      errorTracker.reportError(error as Error, {
        customTags: {
          component: 'CacheWarmer',
          strategy: strategyName,
          operation: 'executeStrategy'
        }
      });
    }
  }

  /**
   * Process queued strategies
   */
  private processQueue(): void {
    const readyStrategies = this.warmingQueue.filter(strategyName => {
      const strategy = this.strategies.get(strategyName);
      if (!strategy || !strategy.dependencies) return true;
      
      return strategy.dependencies.every(dep => this.completedStrategies.has(dep));
    });

    readyStrategies.forEach(strategyName => {
      const index = this.warmingQueue.indexOf(strategyName);
      if (index > -1) {
        this.warmingQueue.splice(index, 1);
        this.executeStrategy(strategyName);
      }
    });
  }

  /**
   * Start warming process
   */
  private startWarming(): void {
    if (this.isWarming) return;
    
    this.isWarming = true;
    console.log('Cache warming started');

    // Execute immediate strategies first
    for (const [name, strategy] of this.strategies) {
      if (strategy.schedule?.immediate) {
        this.executeStrategy(name);
      }
    }

    // Setup behavior-based warming
    this.setupBehaviorBasedWarming();
  }

  /**
   * Setup predictive warming based on user behavior
   */
  private setupBehaviorBasedWarming(): void {
    // Monitor route changes for predictive warming
    window.addEventListener('popstate', () => {
      this.onRouteChange(window.location.pathname);
    });

    // Monitor user interactions
    document.addEventListener('mouseover', (event) => {
      this.onElementHover(event.target as Element);
    });

    // Monitor scroll patterns
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.onScrollEnd();
      }, 500);
    });
  }

  /**
   * Handle route changes for predictive warming
   */
  private onRouteChange(route: string): void {
    const matchingPatterns = this.patterns.filter(pattern => {
      if (pattern.route.includes('*')) {
        const baseRoute = pattern.route.replace('/*', '');
        return route.startsWith(baseRoute);
      }
      return route === pattern.route;
    });

    matchingPatterns.forEach(pattern => {
      if (this.shouldWarmPattern(pattern)) {
        this.warmQueriesForPattern(pattern);
      }
    });

    // Update user behavior
    this.updateUserBehavior(route);
  }

  /**
   * Handle element hover for link prefetching
   */
  private onElementHover(element: Element): void {
    if (element.tagName === 'A' && element.getAttribute('href')) {
      const href = element.getAttribute('href')!;
      
      // Prefetch data for hovered links
      setTimeout(() => {
        this.prefetchForRoute(href);
      }, 100); // Small delay to avoid excessive prefetching
    }
  }

  /**
   * Handle scroll end for content preloading
   */
  private onScrollEnd(): void {
    const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    // If user scrolled more than 70%, they're likely engaged
    if (scrollPercentage > 70) {
      this.warmEngagementBasedContent();
    }
  }

  /**
   * Warm content based on user engagement
   */
  private async warmEngagementBasedContent(): Promise<void> {
    try {
      // Prefetch related content, next page data, etc.
      const engagementData = await this.fetchEngagementBasedContent();
      
      await Promise.all(
        engagementData.map(item =>
          cacheManager.set(item.key, item.data, {
            tags: ['engagement', 'content'],
            priority: 'low'
          })
        )
      );
    } catch (error) {
      console.warn('Engagement-based warming failed:', error);
    }
  }

  /**
   * Data fetching methods (would integrate with actual API)
   */
  private async fetchAppConfig(): Promise<any> {
    // Mock implementation
    return {
      version: '1.0.0',
      features: ['tasks', 'messaging', 'payments'],
      maintenance: false
    };
  }

  private async fetchFeatureFlags(): Promise<any> {
    return {
      newTaskWizard: true,
      enhancedMessaging: true,
      videoCallsFeature: false
    };
  }

  private async fetchUserSession(): Promise<any> {
    return {
      sessionId: 'session_' + Date.now(),
      deviceId: 'device_' + Math.random().toString(36),
      lastActivity: Date.now()
    };
  }

  private async fetchUserProfile(): Promise<any> {
    if (!this.isUserAuthenticated()) return null;
    
    return {
      id: 'user_123',
      name: 'John Doe',
      avatar: '/avatars/default.png',
      role: 'client'
    };
  }

  private async fetchUserPreferences(): Promise<any> {
    return {
      theme: 'light',
      notifications: true,
      language: 'en'
    };
  }

  private async fetchUserNotifications(): Promise<any> {
    return {
      unread: 3,
      recent: []
    };
  }

  private async fetchRecentTasks(): Promise<any> {
    return [];
  }

  private async fetchUserBids(): Promise<any> {
    return [];
  }

  private async fetchTaskRecommendations(): Promise<any> {
    return [];
  }

  private async fetchPopularTasks(): Promise<any> {
    return [];
  }

  private async fetchTrendingCategories(): Promise<any> {
    return [];
  }

  private async fetchTopTaskers(): Promise<any> {
    return [];
  }

  private async fetchNearbyTasks(_location: any): Promise<any> { // location parameter renamed to indicate it's not used
    return [];
  }

  private async fetchLocalTaskers(_location: any): Promise<any> { // location parameter renamed to indicate it's not used
    return [];
  }

  private async fetchDailySummary(): Promise<any> {
    return {
      newTasks: 5,
      activeBids: 2,
      messages: 1
    };
  }

  private async fetchUrgentTasks(): Promise<any> {
    return [];
  }

  private async fetchEngagementBasedContent(): Promise<Array<{ key: string; data: any }>> {
    return [];
  }

  /**
   * Utility methods
   */
  private isUserAuthenticated(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }

  private hasLocationPermission(): boolean {
    return 'geolocation' in navigator;
  }

  private async getUserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        (error) => reject(error)
      );
    });
  }

  private isTimeOfDay(period: string): boolean {
    const hour = new Date().getHours();
    
    switch (period) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 22;
      case 'night':
        return hour >= 22 || hour < 6;
      default:
        return false;
    }
  }

  private scheduleTimeBasedExecution(strategyName: string, times: string[]): void {
    times.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const timeUntilExecution = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.executeStrategy(strategyName);
        
        // Schedule for next day
        setInterval(() => {
          this.executeStrategy(strategyName);
        }, 24 * 60 * 60 * 1000);
      }, timeUntilExecution);
    });
  }

  private shouldWarmPattern(pattern: WarmingPattern): boolean {
    if (!pattern.conditions) return true;
    
    const { userRole, timeOfDay, dayOfWeek } = pattern.conditions;
    
    if (userRole && !this.userHasRole(userRole)) return false;
    if (timeOfDay && !this.isInTimeRange(timeOfDay)) return false;
    if (dayOfWeek && !dayOfWeek.includes(new Date().getDay())) return false;
    
    return true;
  }

  private userHasRole(roles: string[]): boolean {
    const userRole = localStorage.getItem('user_role') || 'guest';
    return roles.includes(userRole);
  }

  private isInTimeRange(timeRanges: string[]): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return timeRanges.some(range => {
      const [start, end] = range.split('-');
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      return currentTime >= startTime && currentTime <= endTime;
    });
  }

  private async warmQueriesForPattern(pattern: WarmingPattern): Promise<void> {
    // This would typically prefetch queries for the pattern
    console.log(`Warming queries for pattern: ${pattern.route}`);
  }

  private prefetchForRoute(route: string): void {
    // This would typically prefetch data for the route
    console.log(`Prefetching for route: ${route}`);
  }

  private mapPriorityToCache(priority: string): 'low' | 'normal' | 'high' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  private updateMetrics(entriesWarmed: number, executionTime: number, success: boolean): void {
    this.metrics.strategiesExecuted++;
    this.metrics.totalEntriesWarmed += entriesWarmed;
    this.metrics.totalTimeSpent += executionTime;
    
    if (success) {
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.strategiesExecuted - 1) + 1) / 
        this.metrics.strategiesExecuted;
    } else {
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.strategiesExecuted - 1)) / 
        this.metrics.strategiesExecuted;
    }
    
    this.metrics.averageWarmingTime = 
      this.metrics.totalTimeSpent / this.metrics.strategiesExecuted;
  }

  private async loadUserBehavior(): Promise<void> {
    try {
      const stored = localStorage.getItem('user_behavior');
      if (stored) {
        this.userBehavior = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user behavior:', error);
    }
  }

  private updateUserBehavior(route: string): void {
    if (!this.userBehavior) {
      this.userBehavior = {
        frequentRoutes: [],
        commonQueries: [],
        timePatterns: [],
        deviceType: this.detectDeviceType(),
        connectionSpeed: this.detectConnectionSpeed()
      };
    }

    // Update route frequency
    const existingRoute = this.userBehavior.frequentRoutes.find(r => r.route === route);
    if (existingRoute) {
      existingRoute.visits++;
      existingRoute.lastVisit = Date.now();
    } else {
      this.userBehavior.frequentRoutes.push({
        route,
        visits: 1,
        lastVisit: Date.now()
      });
    }

    // Save updated behavior
    localStorage.setItem('user_behavior', JSON.stringify(this.userBehavior));
  }

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';
    
    const speed = connection.downlink;
    if (speed < 1) return 'slow';
    if (speed < 10) return 'medium';
    return 'fast';
  }

  /**
   * Get warming metrics
   */
  getMetrics(): WarmingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get user behavior data
   */
  getUserBehavior(): UserBehaviorData | null {
    return this.userBehavior;
  }

  /**
   * Manual cache warming trigger
   */
  async warmNow(strategyNames?: string[]): Promise<void> {
    const strategies = strategyNames || Array.from(this.strategies.keys());
    
    await Promise.all(
      strategies.map(name => this.executeStrategy(name))
    );
  }

  /**
   * Clear warming state
   */
  reset(): void {
    this.completedStrategies.clear();
    this.warmingQueue = [];
    this.isWarming = false;
    this.metrics = {
      strategiesExecuted: 0,
      totalEntriesWarmed: 0,
      totalTimeSpent: 0,
      successRate: 0,
      averageWarmingTime: 0,
      cacheHitImprovement: 0,
      bandwidthSaved: 0
    };
  }
}

// Create singleton instance
export const cacheWarmer = new CacheWarmerService();

// React hook for cache warming
export function useCacheWarmer() {
  return {
    addStrategy: (strategy: WarmingStrategy) => cacheWarmer.addStrategy(strategy),
    warmNow: (strategyNames?: string[]) => cacheWarmer.warmNow(strategyNames),
    getMetrics: () => cacheWarmer.getMetrics(),
    getUserBehavior: () => cacheWarmer.getUserBehavior(),
    reset: () => cacheWarmer.reset()
  };
}

export type { WarmingStrategy, WarmingPattern, UserBehaviorData, WarmingMetrics };
export default cacheWarmer;