/**
 * Query Cache Service
 * 
 * Intelligent caching layer for API queries with React Query integration,
 * background refresh, cache invalidation, and offline support.
 */

import { QueryClient, QueryKey, QueryFunction } from '@tanstack/react-query';
import { cacheManager } from './cache-manager';
import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../monitoring/error-tracking';

interface QueryCacheConfig {
  defaultStaleTime: number;
  defaultCacheTime: number;
  backgroundRefetch: boolean;
  retryOnMount: boolean;
  retryOnWindowFocus: boolean;
  retryOnReconnect: boolean;
  maxRetries: number;
  retryDelay: (attemptIndex: number) => number;
  persistOfflineQueries: boolean;
  enableOptimisticUpdates: boolean;
  prefetchStrategies: {
    onMount: boolean;
    onHover: boolean;
    onIdle: boolean;
  };
}

interface CacheStrategy {
  name: string;
  staleTime: number;
  cacheTime: number;
  refetchOnMount: boolean;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
  tags?: string[];
}

interface PrefetchRule {
  sourceQuery: string;
  targetQueries: string[];
  condition?: (data: any) => boolean;
  delay?: number;
}

interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  averageResponseTime: number;
  backgroundRefreshes: number;
  optimisticUpdates: number;
  prefetches: number;
}

class QueryCacheService {
  private config: QueryCacheConfig;
  private queryClient: QueryClient;
  private strategies = new Map<string, CacheStrategy>();
  private prefetchRules: PrefetchRule[] = [];
  private metrics: QueryMetrics;
  private onlineQueries = new Set<string>();
  private offlineQueries = new Map<string, { query: QueryKey; data: any; timestamp: number }>();

  constructor(config?: Partial<QueryCacheConfig>) {
    this.config = {
      defaultStaleTime: 5 * 60 * 1000, // 5 minutes
      defaultCacheTime: 10 * 60 * 1000, // 10 minutes
      backgroundRefetch: true,
      retryOnMount: true,
      retryOnWindowFocus: false,
      retryOnReconnect: true,
      maxRetries: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      persistOfflineQueries: true,
      enableOptimisticUpdates: true,
      prefetchStrategies: {
        onMount: true,
        onHover: false,
        onIdle: true
      },
      ...config
    };

    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
      averageResponseTime: 0,
      backgroundRefreshes: 0,
      optimisticUpdates: 0,
      prefetches: 0
    };

    this.initializeQueryClient();
    this.setupCacheStrategies();
    this.setupPrefetchRules();
    this.loadOfflineQueries();
  }

  /**
   * Initialize React Query client with optimized settings
   */
  private initializeQueryClient(): void {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: this.config.defaultStaleTime,
          cacheTime: this.config.defaultCacheTime,
          refetchOnMount: this.config.retryOnMount,
          refetchOnWindowFocus: this.config.retryOnWindowFocus,
          refetchOnReconnect: this.config.retryOnReconnect,
          retry: this.config.maxRetries,
          retryDelay: this.config.retryDelay,
          
          // Custom query function wrapper
          queryFn: async (context) => {
            return this.enhancedQueryFunction(context);
          }
        },
        mutations: {
          retry: this.config.maxRetries,
          retryDelay: this.config.retryDelay,
          
          // Optimistic updates
          onMutate: async (variables) => {
            if (this.config.enableOptimisticUpdates) {
              return this.handleOptimisticUpdate(variables);
            }
          },
          
          onError: (error, variables, context) => {
            this.handleMutationError(error, variables, context);
          },
          
          onSettled: (data, error, variables, context) => {
            this.handleMutationSettled(data, error, variables, context);
          }
        }
      }
    });

    // Set up global error handling
    this.queryClient.setMutationDefaults(['optimistic'], {
      mutationFn: async (variables: any) => {
        // Handle optimistic mutations
        return this.executeOptimisticMutation(variables);
      }
    });
  }

  /**
   * Enhanced query function with caching and monitoring
   */
  private async enhancedQueryFunction(context: any): Promise<any> {
    const { queryKey, signal } = context;
    const cacheKey = this.generateCacheKey(queryKey);
    const startTime = performance.now();

    this.metrics.totalQueries++;

    try {
      // Check cache first
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        this.metrics.cacheHits++;
        
        // Background refresh if stale
        if (this.config.backgroundRefetch && this.isStale(cached, cacheKey)) {
          this.backgroundRefresh(queryKey, context);
        }
        
        return cached;
      }

      this.metrics.cacheMisses++;
      this.metrics.networkRequests++;

      // Execute the original query function
      const originalQueryFn = this.getOriginalQueryFunction(queryKey);
      if (!originalQueryFn) {
        throw new Error(`No query function found for key: ${JSON.stringify(queryKey)}`);
      }

      const result = await originalQueryFn(context);

      // Cache the result
      const strategy = this.getStrategy(queryKey);
      await cacheManager.set(cacheKey, result, {
        ttl: strategy.staleTime,
        tags: strategy.tags,
        priority: 'normal'
      });

      // Track performance
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateAverageResponseTime(responseTime);

      performanceMonitor.recordMetric({
        name: 'query.execution',
        value: responseTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'api',
        tags: {
          queryKey: this.sanitizeQueryKey(queryKey),
          cached: 'false'
        }
      });

      // Store for offline access
      if (this.config.persistOfflineQueries) {
        this.storeOfflineQuery(queryKey, result);
      }

      // Trigger prefetch rules
      this.evaluatePrefetchRules(queryKey, result);

      return result;

    } catch (error) {
      // Try offline cache as fallback
      if (!navigator.onLine && this.config.persistOfflineQueries) {
        const offlineData = this.getOfflineQuery(queryKey);
        if (offlineData) {
          console.log('Returning offline data for query:', queryKey);
          return offlineData.data;
        }
      }

      errorTracker.reportError(error as Error, {
        customTags: {
          component: 'QueryCache',
          operation: 'enhancedQueryFunction',
          queryKey: this.sanitizeQueryKey(queryKey)
        }
      });

      throw error;
    }
  }

  /**
   * Setup predefined cache strategies
   */
  private setupCacheStrategies(): void {
    // User data - cache for 10 minutes, background refresh
    this.addStrategy('user', {
      name: 'user',
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      tags: ['user', 'profile']
    });

    // Tasks - cache for 2 minutes, frequent updates
    this.addStrategy('tasks', {
      name: 'tasks',
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      tags: ['tasks', 'listings']
    });

    // Task details - cache for 5 minutes
    this.addStrategy('task-detail', {
      name: 'task-detail',
      staleTime: 5 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      tags: ['task', 'details']
    });

    // Messages - cache for 1 minute, real-time updates
    this.addStrategy('messages', {
      name: 'messages',
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      tags: ['messages', 'chat']
    });

    // Static data - cache for 1 hour
    this.addStrategy('static', {
      name: 'static',
      staleTime: 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      tags: ['static', 'config']
    });
  }

  /**
   * Setup intelligent prefetch rules
   */
  private setupPrefetchRules(): void {
    // When user data is loaded, prefetch their tasks
    this.addPrefetchRule({
      sourceQuery: 'user',
      targetQueries: ['user-tasks', 'user-bids'],
      condition: (userData) => userData && userData.id,
      delay: 1000 // Wait 1 second after user data loads
    });

    // When task list is loaded, prefetch popular task details
    this.addPrefetchRule({
      sourceQuery: 'tasks',
      targetQueries: ['task-detail'],
      condition: (tasksData) => tasksData && tasksData.length > 0,
      delay: 2000
    });

    // When dashboard is accessed, prefetch related data
    this.addPrefetchRule({
      sourceQuery: 'dashboard',
      targetQueries: ['notifications', 'recent-activity', 'stats'],
      delay: 500
    });
  }

  /**
   * Add custom cache strategy
   */
  addStrategy(pattern: string, strategy: CacheStrategy): void {
    this.strategies.set(pattern, strategy);
  }

  /**
   * Add prefetch rule
   */
  addPrefetchRule(rule: PrefetchRule): void {
    this.prefetchRules.push(rule);
  }

  /**
   * Get strategy for query key
   */
  private getStrategy(queryKey: QueryKey): CacheStrategy {
    const keyStr = JSON.stringify(queryKey);
    
    for (const [pattern, strategy] of this.strategies) {
      if (keyStr.includes(pattern)) {
        return strategy;
      }
    }
    
    // Default strategy
    return {
      name: 'default',
      staleTime: this.config.defaultStaleTime,
      cacheTime: this.config.defaultCacheTime,
      refetchOnMount: this.config.retryOnMount,
      refetchOnWindowFocus: this.config.retryOnWindowFocus,
      refetchOnReconnect: this.config.retryOnReconnect
    };
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      // Invalidate in cache manager
      await cacheManager.deleteByTags(tags);
      
      // Invalidate in React Query
      await this.queryClient.invalidateQueries({
        predicate: (query) => {
          const strategy = this.getStrategy(query.queryKey);
          return strategy.tags?.some(tag => tags.includes(tag)) || false;
        }
      });
      
      console.log('Invalidated cache for tags:', tags);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate specific query
   */
  async invalidateQuery(queryKey: QueryKey): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(queryKey);
      await cacheManager.delete(cacheKey);
      await this.queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      console.error('Query invalidation error:', error);
    }
  }

  /**
   * Prefetch query
   */
  async prefetchQuery(queryKey: QueryKey, queryFn: QueryFunction): Promise<void> {
    try {
      await this.queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: this.getStrategy(queryKey).staleTime
      });
      
      this.metrics.prefetches++;
      
      performanceMonitor.recordMetric({
        name: 'query.prefetch',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        category: 'api',
        tags: {
          queryKey: this.sanitizeQueryKey(queryKey)
        }
      });
    } catch (error) {
      console.warn('Prefetch error:', error);
    }
  }

  /**
   * Optimistic update
   */
  async optimisticUpdate<T>(
    queryKey: QueryKey,
    updater: (old: T | undefined) => T,
    rollback?: () => void
  ): Promise<{ previous: T | undefined }> {
    const previous = this.queryClient.getQueryData<T>(queryKey);
    
    try {
      // Apply optimistic update
      this.queryClient.setQueryData(queryKey, updater);
      this.metrics.optimisticUpdates++;
      
      return { previous };
    } catch (error) {
      // Rollback on error
      if (rollback) {
        rollback();
      } else if (previous !== undefined) {
        this.queryClient.setQueryData(queryKey, previous);
      }
      
      throw error;
    }
  }

  /**
   * Background refresh
   */
  private async backgroundRefresh(queryKey: QueryKey, context: any): Promise<void> {
    try {
      const originalQueryFn = this.getOriginalQueryFunction(queryKey);
      if (originalQueryFn) {
        const freshData = await originalQueryFn(context);
        
        // Update cache
        const cacheKey = this.generateCacheKey(queryKey);
        const strategy = this.getStrategy(queryKey);
        await cacheManager.set(cacheKey, freshData, {
          ttl: strategy.staleTime,
          tags: strategy.tags
        });
        
        // Update React Query cache
        this.queryClient.setQueryData(queryKey, freshData);
        
        this.metrics.backgroundRefreshes++;
      }
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  /**
   * Evaluate prefetch rules
   */
  private async evaluatePrefetchRules(sourceQuery: QueryKey, data: any): Promise<void> {
    const sourceStr = JSON.stringify(sourceQuery);
    
    for (const rule of this.prefetchRules) {
      if (sourceStr.includes(rule.sourceQuery)) {
        if (!rule.condition || rule.condition(data)) {
          // Schedule prefetch
          setTimeout(() => {
            rule.targetQueries.forEach(async (targetQuery) => {
              try {
                const queryFn = this.getOriginalQueryFunction([targetQuery]);
                if (queryFn) {
                  await this.prefetchQuery([targetQuery], queryFn);
                }
              } catch (error) {
                console.warn(`Prefetch failed for ${targetQuery}:`, error);
              }
            });
          }, rule.delay || 0);
        }
      }
    }
  }

  /**
   * Offline query management
   */
  private storeOfflineQuery(queryKey: QueryKey, data: any): void {
    const key = JSON.stringify(queryKey);
    this.offlineQueries.set(key, {
      query: queryKey,
      data,
      timestamp: Date.now()
    });
    
    // Persist to storage
    localStorage.setItem('offline_queries', JSON.stringify(Array.from(this.offlineQueries.entries())));
  }

  private getOfflineQuery(queryKey: QueryKey): { query: QueryKey; data: any; timestamp: number } | null {
    const key = JSON.stringify(queryKey);
    return this.offlineQueries.get(key) || null;
  }

  private loadOfflineQueries(): void {
    try {
      const stored = localStorage.getItem('offline_queries');
      if (stored) {
        const entries = JSON.parse(stored);
        this.offlineQueries = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load offline queries:', error);
    }
  }

  /**
   * Utility methods
   */
  private generateCacheKey(queryKey: QueryKey): string {
    return `query:${JSON.stringify(queryKey)}`;
  }

  private sanitizeQueryKey(queryKey: QueryKey): string {
    const str = JSON.stringify(queryKey);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  }

  private isStale(data: any, cacheKey: string): boolean {
    // Simple staleness check - in production, implement more sophisticated logic
    return Date.now() - (data.timestamp || 0) > this.config.defaultStaleTime;
  }

  private getOriginalQueryFunction(queryKey: QueryKey): QueryFunction | null {
    // This would typically be stored in a registry
    // For now, return null as queries should be registered separately
    return null;
  }

  private updateAverageResponseTime(responseTime: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.networkRequests - 1) + responseTime) / 
      this.metrics.networkRequests;
  }

  private handleOptimisticUpdate(variables: any): any {
    // Placeholder for optimistic update logic
    return { previous: null };
  }

  private handleMutationError(error: any, variables: any, context: any): void {
    console.error('Mutation error:', error);
    errorTracker.reportError(error, {
      customTags: {
        component: 'QueryCache',
        operation: 'mutation',
        variables: JSON.stringify(variables).substring(0, 100)
      }
    });
  }

  private handleMutationSettled(data: any, error: any, variables: any, context: any): void {
    // Cleanup and analytics after mutation completes
    if (error) {
      // Rollback optimistic updates if needed
    }
  }

  private async executeOptimisticMutation(variables: any): Promise<any> {
    // Placeholder for optimistic mutation execution
    return variables;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get query client instance
   */
  getQueryClient(): QueryClient {
    return this.queryClient;
  }

  /**
   * Warm cache with common queries
   */
  async warmCommonQueries(): Promise<void> {
    try {
      // This would typically prefetch commonly accessed data
      console.log('Warming common queries...');
      
      // Example: prefetch user data, recent tasks, notifications
      const commonQueries = [
        ['user', 'current'],
        ['tasks', 'recent'],
        ['notifications', 'unread']
      ];
      
      for (const queryKey of commonQueries) {
        try {
          const queryFn = this.getOriginalQueryFunction(queryKey);
          if (queryFn) {
            await this.prefetchQuery(queryKey, queryFn);
          }
        } catch (error) {
          console.warn(`Failed to warm query ${JSON.stringify(queryKey)}:`, error);
        }
      }
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  /**
   * Export cache state for debugging
   */
  exportCacheState(): any {
    return {
      strategies: Array.from(this.strategies.entries()),
      prefetchRules: this.prefetchRules,
      metrics: this.metrics,
      config: this.config,
      offlineQueries: Array.from(this.offlineQueries.entries()),
      reactQueryCache: this.queryClient.getQueryCache().getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state,
        dataUpdatedAt: query.state.dataUpdatedAt,
        isStale: query.isStale()
      }))
    };
  }
}

// Create singleton instance
export const queryCache = new QueryCacheService();

// React hook for query cache operations
export function useQueryCache() {
  return {
    invalidateByTags: (tags: string[]) => queryCache.invalidateByTags(tags),
    invalidateQuery: (queryKey: QueryKey) => queryCache.invalidateQuery(queryKey),
    prefetchQuery: (queryKey: QueryKey, queryFn: QueryFunction) => 
      queryCache.prefetchQuery(queryKey, queryFn),
    optimisticUpdate: <T>(queryKey: QueryKey, updater: (old: T | undefined) => T, rollback?: () => void) =>
      queryCache.optimisticUpdate(queryKey, updater, rollback),
    getMetrics: () => queryCache.getMetrics(),
    addStrategy: (pattern: string, strategy: CacheStrategy) => queryCache.addStrategy(pattern, strategy),
    addPrefetchRule: (rule: PrefetchRule) => queryCache.addPrefetchRule(rule)
  };
}

export type { QueryCacheConfig, CacheStrategy, PrefetchRule, QueryMetrics };
export default queryCache;