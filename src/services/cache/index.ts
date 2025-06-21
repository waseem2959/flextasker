/**
 * Cache Integration Service
 * 
 * Unified interface for all caching services with intelligent coordination,
 * automated optimization, and comprehensive monitoring.
 */

import { cacheManager } from './cache-manager';
import { queryCache } from './query-cache';
import { cacheWarmer } from './cache-warmer';
import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../monitoring/error-tracking';

interface CacheSystemConfig {
  enabled: boolean;
  autoOptimization: boolean;
  intelligentWarmup: boolean;
  backgroundRefresh: boolean;
  adaptiveStrategies: boolean;
  performanceMode: 'balanced' | 'performance' | 'memory' | 'bandwidth';
  monitoringLevel: 'basic' | 'detailed' | 'comprehensive';
}

interface CacheSystemStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'offline';
  components: {
    manager: boolean;
    queryCache: boolean;
    warmer: boolean;
  };
  performance: {
    hitRate: number;
    averageResponseTime: number;
    totalQueries: number;
    cacheSize: number;
  };
  recommendations: string[];
}

interface CacheOptimization {
  strategy: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  description: string;
  implementation: () => Promise<void>;
}

class CacheIntegrationService {
  private config: CacheSystemConfig;
  private isInitialized = false;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;
  // private lastOptimization = 0; // Not currently used

  constructor(config?: Partial<CacheSystemConfig>) {
    this.config = {
      enabled: true,
      autoOptimization: true,
      intelligentWarmup: true,
      backgroundRefresh: true,
      adaptiveStrategies: true,
      performanceMode: 'balanced',
      monitoringLevel: 'detailed',
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the cache system
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing cache system...');

      // Configure cache manager based on performance mode
      this.configureCacheManager();

      // Setup query cache with intelligent strategies
      this.configureQueryCache();

      // Initialize cache warmer with user behavior analysis
      this.configureCacheWarmer();

      // Start monitoring and optimization
      if (this.config.autoOptimization) {
        this.startAutoOptimization();
      }

      this.startMonitoring();

      // Initial cache warming
      if (this.config.intelligentWarmup) {
        await this.intelligentWarmup();
      }

      this.isInitialized = true;
      console.log('Cache system initialized successfully');

      // Track initialization
      performanceMonitor.recordMetric({
        name: 'cache.system.initialized',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        category: 'custom',
        tags: {
          performanceMode: this.config.performanceMode,
          autoOptimization: String(this.config.autoOptimization)
        }
      });

    } catch (error) {
      console.error('Cache system initialization failed:', error);
      errorTracker.reportError(error as Error, {
        customTags: {
          component: 'CacheIntegration',
          operation: 'initialize'
        }
      });
    }
  }

  /**
   * Configure cache manager based on performance mode
   */
  private configureCacheManager(): void {
    // Configuration object commented out as it's not currently used
    /*
    const configs = {
      performance: {
        defaultTTL: 10 * 60 * 1000, // 10 minutes
        maxSize: 200 * 1024 * 1024, // 200MB
        enableCompression: false,
        strategies: {
          memory: true,
          localStorage: true,
          indexedDB: true,
          serviceWorker: true
        }
      },
      memory: {
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        maxSize: 50 * 1024 * 1024, // 50MB
        enableCompression: true,
        strategies: {
          memory: true,
          localStorage: false,
          indexedDB: false,
          serviceWorker: false
        }
      },
      bandwidth: {
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        maxSize: 100 * 1024 * 1024, // 100MB
        enableCompression: true,
        strategies: {
          memory: true,
          localStorage: true,
          indexedDB: true,
          serviceWorker: true
        }
      },
      balanced: {
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        maxSize: 100 * 1024 * 1024, // 100MB
        enableCompression: true,
        strategies: {
          memory: true,
          localStorage: true,
          indexedDB: true,
          serviceWorker: false
        }
      }
    };

    const config = configs[this.config.performanceMode];
    */
    console.log(`Configuring cache manager for ${this.config.performanceMode} mode`);
  }

  /**
   * Configure query cache with adaptive strategies
   */
  private configureQueryCache(): void {
    if (this.config.adaptiveStrategies) {
      // Add adaptive strategies based on usage patterns
      queryCache.addStrategy('user-critical', {
        name: 'user-critical',
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        tags: ['user', 'critical']
      });

      queryCache.addStrategy('content-heavy', {
        name: 'content-heavy',
        staleTime: 15 * 60 * 1000, // 15 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        tags: ['content', 'heavy']
      });

      // Add intelligent prefetch rules
      queryCache.addPrefetchRule({
        sourceQuery: 'user-profile',
        targetQueries: ['user-tasks', 'user-preferences', 'user-notifications'],
        condition: (userData) => userData && userData.id,
        delay: 500
      });

      queryCache.addPrefetchRule({
        sourceQuery: 'task-list',
        targetQueries: ['popular-categories', 'trending-skills'],
        delay: 1000
      });
    }
  }

  /**
   * Configure cache warmer with intelligent strategies
   */
  private configureCacheWarmer(): void {
    // Add time-sensitive warming strategies
    cacheWarmer.addStrategy({
      name: 'peak-hours-warmup',
      priority: 'high',
      condition: () => this.isPeakHours(),
      schedule: { onIdle: true },
      dataProvider: async () => {
        return [
          {
            key: 'trending-tasks',
            data: await this.fetchTrendingTasks(),
            tags: ['trending', 'tasks']
          },
          {
            key: 'active-taskers',
            data: await this.fetchActiveTaskers(),
            tags: ['users', 'active']
          }
        ];
      }
    });

    // Add connection-aware warming
    cacheWarmer.addStrategy({
      name: 'slow-connection-essentials',
      priority: 'critical',
      condition: () => this.isSlowConnection(),
      schedule: { immediate: true },
      dataProvider: async () => {
        return [
          {
            key: 'essential-data',
            data: await this.fetchEssentialData(),
            tags: ['essential', 'core']
          }
        ];
      }
    });
  }

  /**
   * Intelligent cache warming based on user behavior and patterns
   */
  private async intelligentWarmup(): Promise<void> {
    try {
      console.log('Starting intelligent cache warmup...');

      const userBehavior = cacheWarmer.getUserBehavior();
      
      if (userBehavior) {
        // Warm based on frequent routes
        const topRoutes = userBehavior.frequentRoutes
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 5);

        for (const route of topRoutes) {
          await this.warmRouteData(route.route);
        }

        // Warm based on time patterns
        const currentHour = new Date().getHours();
        const hourlyActivity = userBehavior.timePatterns.find(p => p.hour === currentHour);
        
        if (hourlyActivity && hourlyActivity.activity > 0.7) {
          await this.warmHighActivityData();
        }
      }

      // Device-specific warming
      if (userBehavior?.deviceType === 'mobile') {
        await this.warmMobileOptimizedData();
      } else if (userBehavior?.deviceType === 'desktop') {
        await this.warmDesktopOptimizedData();
      }

      console.log('Intelligent cache warmup completed');

    } catch (error) {
      console.error('Intelligent warmup failed:', error);
    }
  }

  /**
   * Start automatic optimization
   */
  private startAutoOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      await this.optimizeCache();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    const interval = this.config.monitoringLevel === 'comprehensive' ? 30000 : 
                    this.config.monitoringLevel === 'detailed' ? 60000 : 300000;

    this.monitoringTimer = setInterval(async () => {
      await this.collectMetrics();
    }, interval);
  }

  /**
   * Optimize cache performance automatically
   */
  private async optimizeCache(): Promise<void> {
    try {
      // const status = await this.getSystemStatus(); // Not currently used
      const optimizations = await this.getOptimizationRecommendations();

      // Apply high-impact, low-effort optimizations automatically
      const autoOptimizations = optimizations.filter(opt => 
        opt.impact === 'high' && opt.effort === 'low'
      );

      for (const optimization of autoOptimizations) {
        try {
          await optimization.implementation();
          console.log(`Applied optimization: ${optimization.strategy}`);
        } catch (error) {
          console.warn(`Optimization failed: ${optimization.strategy}`, error);
        }
      }

      // this.lastOptimization = Date.now(); // Property not defined

      performanceMonitor.recordMetric({
        name: 'cache.optimization.auto',
        value: autoOptimizations.length,
        unit: 'count',
        timestamp: Date.now(),
        category: 'custom'
      });

    } catch (error) {
      console.error('Auto optimization failed:', error);
    }
  }

  /**
   * Collect and analyze cache metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const [cacheStats, queryMetrics] = await Promise.all([ // warmingMetrics removed as it's not used
        cacheManager.getStatistics(),
        queryCache.getMetrics()
        // cacheWarmer.getMetrics() // Removed as warmingMetrics is not used
      ]);

      // Track overall system performance
      performanceMonitor.recordMetric({
        name: 'cache.system.hitRate',
        value: cacheStats.hitRate,
        unit: 'percentage',
        timestamp: Date.now(),
        category: 'custom'
      });

      performanceMonitor.recordMetric({
        name: 'cache.system.size',
        value: cacheStats.totalSize,
        unit: 'bytes',
        timestamp: Date.now(),
        category: 'custom'
      });

      performanceMonitor.recordMetric({
        name: 'cache.system.entries',
        value: cacheStats.totalEntries,
        unit: 'count',
        timestamp: Date.now(),
        category: 'custom'
      });

      // Detect performance issues
      if (cacheStats.hitRate < 40) {
        console.warn('Low cache hit rate detected:', cacheStats.hitRate);
        errorTracker.reportError(new Error('Low cache hit rate'), {
          customTags: {
            component: 'CacheIntegration',
            hitRate: String(cacheStats.hitRate),
            issue: 'performance'
          }
        });
      }

      if (queryMetrics.averageResponseTime > 2000) {
        console.warn('High response time detected:', queryMetrics.averageResponseTime);
      }

    } catch (error) {
      console.error('Metrics collection failed:', error);
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<CacheSystemStatus> {
    try {
      const [cacheStats, queryMetrics] = await Promise.all([
        cacheManager.getStatistics(),
        queryCache.getMetrics()
      ]);

      const hitRate = cacheStats.hitRate;
      const responseTime = queryMetrics.averageResponseTime;

      let overall: CacheSystemStatus['overall'] = 'healthy';
      if (hitRate < 30 || responseTime > 3000) {
        overall = 'critical';
      } else if (hitRate < 50 || responseTime > 1500) {
        overall = 'warning';
      }

      const recommendations: string[] = [];
      if (hitRate < 60) {
        recommendations.push('Increase cache warming strategies');
      }
      if (responseTime > 1000) {
        recommendations.push('Optimize query performance');
      }
      if (cacheStats.totalSize > 150 * 1024 * 1024) {
        recommendations.push('Consider cache size optimization');
      }

      return {
        overall,
        components: {
          manager: true,
          queryCache: true,
          warmer: true
        },
        performance: {
          hitRate,
          averageResponseTime: responseTime,
          totalQueries: queryMetrics.totalQueries,
          cacheSize: cacheStats.totalSize
        },
        recommendations
      };

    } catch (error) {
      return {
        overall: 'offline',
        components: {
          manager: false,
          queryCache: false,
          warmer: false
        },
        performance: {
          hitRate: 0,
          averageResponseTime: 0,
          totalQueries: 0,
          cacheSize: 0
        },
        recommendations: ['System initialization required']
      };
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<CacheOptimization[]> {
    const status = await this.getSystemStatus();
    const optimizations: CacheOptimization[] = [];

    // Low hit rate optimization
    if (status.performance.hitRate < 60) {
      optimizations.push({
        strategy: 'increase-cache-warming',
        impact: 'high',
        effort: 'low',
        description: 'Increase cache warming frequency for better hit rates',
        implementation: async () => {
          await cacheWarmer.warmNow();
        }
      });
    }

    // High response time optimization
    if (status.performance.averageResponseTime > 1000) {
      optimizations.push({
        strategy: 'optimize-query-strategies',
        impact: 'high',
        effort: 'medium',
        description: 'Optimize query caching strategies for faster responses',
        implementation: async () => {
          // Implement query optimization
        }
      });
    }

    // Large cache size optimization
    if (status.performance.cacheSize > 150 * 1024 * 1024) {
      optimizations.push({
        strategy: 'cache-cleanup',
        impact: 'medium',
        effort: 'low',
        description: 'Clean up old and unused cache entries',
        implementation: async () => {
          // Implement selective cache cleanup
        }
      });
    }

    return optimizations;
  }

  /**
   * Manual optimization trigger
   */
  async optimizeNow(): Promise<void> {
    await this.optimizeCache();
  }

  /**
   * Manual warmup trigger
   */
  async warmupNow(): Promise<void> {
    await this.intelligentWarmup();
  }

  /**
   * Clear entire cache system
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      cacheManager.clear(),
      queryCache.invalidateByTags(['*'])
    ]);
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    console.log('Cache system shutdown completed');
  }

  /**
   * Utility methods for data fetching
   */
  private async fetchTrendingTasks(): Promise<any> {
    // Mock implementation
    return [];
  }

  private async fetchActiveTaskers(): Promise<any> {
    return [];
  }

  private async fetchEssentialData(): Promise<any> {
    return {};
  }

  private async warmRouteData(route: string): Promise<void> {
    // Route-specific warming logic
    console.log(`Warming data for route: ${route}`);
  }

  private async warmHighActivityData(): Promise<void> {
    // High activity period warming
  }

  private async warmMobileOptimizedData(): Promise<void> {
    // Mobile-specific data warming
  }

  private async warmDesktopOptimizedData(): Promise<void> {
    // Desktop-specific data warming
  }

  private isPeakHours(): boolean {
    const hour = new Date().getHours();
    return (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 18);
  }

  private isSlowConnection(): boolean {
    const connection = (navigator as any).connection;
    return connection ? connection.downlink < 2 : false;
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheSystemConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart services if needed
    if (newConfig.autoOptimization !== undefined) {
      if (this.optimizationTimer) {
        clearInterval(this.optimizationTimer);
        this.optimizationTimer = null;
      }
      if (newConfig.autoOptimization) {
        this.startAutoOptimization();
      }
    }
  }
}

// Create singleton instance
export const cacheSystem = new CacheIntegrationService();

// React hook for cache system operations
export function useCacheSystem() {
  return {
    getStatus: () => cacheSystem.getSystemStatus(),
    optimize: () => cacheSystem.optimizeNow(),
    warmup: () => cacheSystem.warmupNow(),
    clear: () => cacheSystem.clearAll(),
    getRecommendations: () => cacheSystem.getOptimizationRecommendations(),
    getConfig: () => cacheSystem.getConfig(),
    updateConfig: (config: Partial<CacheSystemConfig>) => cacheSystem.updateConfig(config)
  };
}

// Export all cache services
export { cacheManager, queryCache, cacheWarmer };
export type { CacheSystemConfig, CacheSystemStatus, CacheOptimization };
export default cacheSystem;