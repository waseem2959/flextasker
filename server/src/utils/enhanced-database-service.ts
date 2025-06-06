/**
 * Enhanced Database Service with Caching and Read Replicas
 * 
 * This service combines database optimization, read replicas, and Redis caching
 * for maximum performance and scalability.
 */

import { PrismaClient } from '@prisma/client';
import { databaseManager } from './database-manager';
import { OptimizedQueries, QueryPerformanceMonitor } from './database-optimization';
import { logger } from './logger';
import { redisCache } from './redis-cache';

/**
 * Cache configuration for different data types
 */
interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  invalidateOn: string[];
}

/**
 * Query options interface
 */
interface QueryOptions {
  useCache?: boolean;
  cacheConfig?: Partial<CacheConfig>;
  forceWrite?: boolean;
  timeout?: number;
}

/**
 * Enhanced Database Service
 */
export class EnhancedDatabaseService {
  private static instance: EnhancedDatabaseService;
  private queryMonitor: QueryPerformanceMonitor;
  private optimizedQueries: OptimizedQueries;
  
  // Default cache configurations
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    user: {
      ttl: 300, // 5 minutes
      keyPrefix: 'user',
      invalidateOn: ['user:update', 'user:delete']
    },
    task: {
      ttl: 180, // 3 minutes
      keyPrefix: 'task',
      invalidateOn: ['task:update', 'task:delete', 'task:create']
    },
    bid: {
      ttl: 60, // 1 minute
      keyPrefix: 'bid',
      invalidateOn: ['bid:update', 'bid:delete', 'bid:create']
    },
    review: {
      ttl: 600, // 10 minutes
      keyPrefix: 'review',
      invalidateOn: ['review:update', 'review:delete', 'review:create']
    },
    stats: {
      ttl: 900, // 15 minutes
      keyPrefix: 'stats',
      invalidateOn: ['task:update', 'bid:update', 'review:create']
    }
  };

  private constructor() {
    this.queryMonitor = QueryPerformanceMonitor.getInstance();
    // Initialize with write client initially, will be updated after database manager init
    this.optimizedQueries = new OptimizedQueries(databaseManager.getWriteClient());
  }

  static getInstance(): EnhancedDatabaseService {
    if (!EnhancedDatabaseService.instance) {
      EnhancedDatabaseService.instance = new EnhancedDatabaseService();
    }
    return EnhancedDatabaseService.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await databaseManager.initialize();
    // Update optimized queries with proper client
    this.optimizedQueries = new OptimizedQueries(databaseManager.getWriteClient());
    logger.info('Enhanced database service initialized');
  }

  /**
   * Execute cached query with read replica support
   */
  async cachedQuery<T>(
    queryName: string,
    queryFn: (client: PrismaClient) => Promise<T>,
    cacheKey: string,
    options: QueryOptions = {}
  ): Promise<T> {
    const {
      useCache = true,
      cacheConfig = {},
      forceWrite = false,
      // timeout = 30000 // Timeout configuration available if needed
    } = options;

    const config = { ...this.cacheConfigs.user, ...cacheConfig };
    const fullCacheKey = `${config.keyPrefix}:${cacheKey}`;

    // Try cache first if enabled
    if (useCache) {
      try {
        const cached = await redisCache.get(fullCacheKey);
        if (cached !== null) {
          logger.debug('Cache hit for query', { queryName, cacheKey: fullCacheKey });
          return cached;
        }
      } catch (error) {
        logger.warn('Cache read failed, proceeding with database query', {
          queryName,
          cacheKey: fullCacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Execute query with monitoring
    const result = await this.queryMonitor.monitorQuery(queryName, async () => {
      const operation = forceWrite ? 'write' : 'read';
      return databaseManager.executeQuery(queryFn, operation);
    });

    // Cache the result if enabled
    if (useCache && result !== null) {
      try {
        await redisCache.set(fullCacheKey, result, config.ttl);
        logger.debug('Query result cached', { queryName, cacheKey: fullCacheKey, ttl: config.ttl });
      } catch (error) {
        logger.warn('Failed to cache query result', {
          queryName,
          cacheKey: fullCacheKey,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        // In a more sophisticated implementation, you'd use Redis SCAN with patterns
        // For now, we'll clear specific keys or use a simple pattern matching
        await redisCache.delete(pattern);
        logger.debug('Cache invalidated', { pattern });
      } catch (error) {
        logger.warn('Cache invalidation failed', {
          pattern,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Get user by ID with caching
   */
  async getUserById(userId: string, options: QueryOptions = {}): Promise<any> {
    return this.cachedQuery(
      'getUserById',
      (client) => client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          isActive: true
        }
      }),
      `user:${userId}`,
      {
        ...options,
        cacheConfig: this.cacheConfigs.user
      }
    );
  }

  /**
   * Get user with stats (cached)
   */
  async getUserWithStats(userId: string, options: QueryOptions = {}): Promise<any> {
    return this.cachedQuery(
      'getUserWithStats',
      () => this.optimizedQueries.getUserWithStats(userId),
      `user:stats:${userId}`,
      {
        ...options,
        cacheConfig: this.cacheConfigs.stats
      }
    );
  }

  /**
   * Search users with caching
   */
  async searchUsers(
    query: string, 
    pagination: { page: number; limit: number },
    options: QueryOptions = {}
  ): Promise<any> {
    const cacheKey = `search:${query}:${pagination.page}:${pagination.limit}`;
    
    return this.cachedQuery(
      'searchUsers',
      () => this.optimizedQueries.searchUsers(query, pagination),
      cacheKey,
      {
        ...options,
        cacheConfig: { ...this.cacheConfigs.user, ttl: 120 } // Shorter TTL for search results
      }
    );
  }

  /**
   * Search tasks with caching
   */
  async searchTasks(
    filters: any,
    options: QueryOptions = {}
  ): Promise<any> {
    const cacheKey = `search:tasks:${JSON.stringify(filters)}`;
    
    return this.cachedQuery(
      'searchTasks',
      () => this.optimizedQueries.searchTasks(filters),
      cacheKey,
      {
        ...options,
        cacheConfig: { ...this.cacheConfigs.task, ttl: 120 }
      }
    );
  }

  /**
   * Get paginated results with caching
   */
  async getPaginatedResults(
    model: any,
    options: any,
    cacheKeyBase: string,
    queryOptions: QueryOptions = {}
  ): Promise<any> {
    const cacheKey = `${cacheKeyBase}:${JSON.stringify(options)}`;
    
    return this.cachedQuery(
      'getPaginatedResults',
      () => this.optimizedQueries.getPaginatedResults(model, options),
      cacheKey,
      queryOptions
    );
  }

  /**
   * Create record with cache invalidation
   */
  async createRecord<T>(
    model: any,
    data: any,
    invalidationPatterns: string[] = []
  ): Promise<T> {
    const result = await this.queryMonitor.monitorQuery('createRecord', async () => {
      return databaseManager.executeQuery(
        (_client) => model.create({ data }),
        'write'
      );
    });

    // Invalidate related cache entries
    await this.invalidateCache(invalidationPatterns);

    return result as T;
  }

  /**
   * Update record with cache invalidation
   */
  async updateRecord<T>(
    model: any,
    where: any,
    data: any,
    invalidationPatterns: string[] = []
  ): Promise<T> {
    const result = await this.queryMonitor.monitorQuery('updateRecord', async () => {
      return databaseManager.executeQuery(
        (_client) => model.update({ where, data }),
        'write'
      );
    });

    // Invalidate related cache entries
    await this.invalidateCache(invalidationPatterns);

    return result as T;
  }

  /**
   * Delete record with cache invalidation
   */
  async deleteRecord<T>(
    model: any,
    where: any,
    invalidationPatterns: string[] = []
  ): Promise<T> {
    const result = await this.queryMonitor.monitorQuery('deleteRecord', async () => {
      return databaseManager.executeQuery(
        (_client) => model.delete({ where }),
        'write'
      );
    });

    // Invalidate related cache entries
    await this.invalidateCache(invalidationPatterns);

    return result as T;
  }

  /**
   * Execute raw query with caching support
   */
  async executeRawQuery<T>(
    queryName: string,
    query: string,
    params: any[] = [],
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<T> {
    if (cacheKey && options.useCache !== false) {
      return this.cachedQuery(
        queryName,
        (client) => client.$queryRawUnsafe(query, ...params),
        cacheKey,
        options
      );
    }

    return this.queryMonitor.monitorQuery(queryName, async () => {
      const operation = options.forceWrite ? 'write' : 'read';
      return databaseManager.executeQuery(
        (client) => client.$queryRawUnsafe(query, ...params),
        operation
      );
    });
  }

  /**
   * Get database health and statistics
   */
  async getHealthStats(): Promise<{
    connections: any;
    performance: any;
    cache: any;
  }> {
    const [connectionHealth, queryStats, cacheStats] = await Promise.all([
      databaseManager.healthCheck(),
      this.queryMonitor.getStats(),
      redisCache.getStats()
    ]);

    return {
      connections: {
        ...connectionHealth,
        stats: databaseManager.getStats()
      },
      performance: queryStats,
      cache: cacheStats
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(): Promise<void> {
    logger.info('Starting cache warm-up');

    try {
      // Warm up popular tasks
      await this.searchTasks({ 
        page: 1, 
        limit: 20 
      }, { 
        useCache: true 
      });

      // Warm up categories or other frequently accessed data
      // Add more warm-up queries as needed

      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cache configuration for a data type
   */
  getCacheConfig(dataType: string): CacheConfig | undefined {
    return this.cacheConfigs[dataType];
  }

  /**
   * Update cache configuration
   */
  updateCacheConfig(dataType: string, config: Partial<CacheConfig>): void {
    if (this.cacheConfigs[dataType]) {
      this.cacheConfigs[dataType] = { ...this.cacheConfigs[dataType], ...config };
    }
  }
}

// Export singleton instance
export const enhancedDb = EnhancedDatabaseService.getInstance();

export default enhancedDb;
