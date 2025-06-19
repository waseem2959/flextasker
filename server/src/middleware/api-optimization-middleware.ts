/**
 * API Optimization Middleware
 * 
 * Advanced middleware for API performance optimization including
 * response compression, caching, query optimization, and rate limiting.
 */

import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import compression from 'compression';
import { z } from 'zod';

interface OptimizationConfig {
  enableCompression: boolean;
  enableCaching: boolean;
  enableQueryOptimization: boolean;
  defaultCacheTTL: number;
  maxRequestSize: string;
  enablePagination: boolean;
  defaultPageSize: number;
  maxPageSize: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  vary?: string[];
  staleWhileRevalidate?: boolean;
}

interface QueryOptimization {
  enableIncludes: boolean;
  enableSelect: boolean;
  maxIncludes: number;
  allowedIncludes: string[];
  allowedSelects: string[];
}

class APIOptimizationMiddleware {
  private redis: Redis | null = null;
  private config: OptimizationConfig;
  private queryStats = new Map<string, {
    count: number;
    avgTime: number;
    lastUsed: number;
  }>();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableCompression: true,
      enableCaching: true,
      enableQueryOptimization: true,
      defaultCacheTTL: 5 * 60, // 5 minutes
      maxRequestSize: '10mb',
      enablePagination: true,
      defaultPageSize: 20,
      maxPageSize: 100,
      ...config
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection for caching
   */
  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('✅ Redis connected for API caching');
      }
    } catch (error) {
      console.warn('⚠️ Redis connection failed, caching disabled:', error);
    }
  }

  /**
   * Response compression middleware
   */
  compressionMiddleware() {
    if (!this.config.enableCompression) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return compression({
      filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (!req.headers['accept-encoding']) return false;
        
        // Compress JSON responses
        if (res.getHeader('content-type')?.toString().includes('application/json')) {
          return true;
        }
        
        // Use default compression filter for other content
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses larger than 1KB
      level: 6, // Balanced compression level
    });
  }

  /**
   * Smart caching middleware with cache tags and invalidation
   */
  cacheMiddleware(options: CacheOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableCaching || !this.redis || req.method !== 'GET') {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);
      const ttl = options.ttl || this.config.defaultCacheTTL;

      try {
        // Check cache
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const parsedData = JSON.parse(cached);
          
          // Add cache headers
          res.set({
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${ttl}`,
            'ETag': this.generateETag(parsedData)
          });

          // Handle conditional requests
          if (req.headers['if-none-match'] === res.get('ETag')) {
            return res.status(304).end();
          }

          return res.json(parsedData);
        }

        // Cache miss - intercept response
        const originalSend = res.json;
        res.json = (data: any) => {
          // Cache the response
          this.cacheResponse(cacheKey, data, ttl, options.tags);
          
          res.set({
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}`,
            'ETag': this.generateETag(data)
          });

          return originalSend.call(res, data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Query optimization middleware for database queries
   */
  queryOptimizationMiddleware(options: QueryOptimization) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableQueryOptimization) {
        return next();
      }

      // Parse and validate query parameters
      const optimizedQuery = this.optimizeQuery(req.query, options);
      req.query = optimizedQuery;

      // Track query patterns
      this.trackQueryPattern(req);

      next();
    };
  }

  /**
   * Pagination middleware with smart defaults
   */
  paginationMiddleware() {
    const paginationSchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number()
        .min(1)
        .max(this.config.maxPageSize)
        .default(this.config.defaultPageSize),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).default('desc')
    });

    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enablePagination) {
        return next();
      }

      try {
        const pagination = paginationSchema.parse(req.query);
        
        // Add pagination to request
        req.pagination = {
          page: pagination.page,
          limit: pagination.limit,
          offset: (pagination.page - 1) * pagination.limit,
          sort: pagination.sort,
          order: pagination.order
        };

        // Add pagination helper to response
        res.paginate = (data: any[], total: number) => {
          const totalPages = Math.ceil(total / pagination.limit);
          const hasNext = pagination.page < totalPages;
          const hasPrev = pagination.page > 1;

          return {
            data,
            meta: {
              page: pagination.page,
              limit: pagination.limit,
              total,
              totalPages,
              hasNext,
              hasPrev,
              nextPage: hasNext ? pagination.page + 1 : null,
              prevPage: hasPrev ? pagination.page - 1 : null
            },
            links: {
              self: this.buildPageUrl(req, pagination.page),
              first: this.buildPageUrl(req, 1),
              last: this.buildPageUrl(req, totalPages),
              next: hasNext ? this.buildPageUrl(req, pagination.page + 1) : null,
              prev: hasPrev ? this.buildPageUrl(req, pagination.page - 1) : null
            }
          };
        };

        next();
      } catch (error) {
        res.status(400).json({
          error: 'Invalid pagination parameters',
          details: error
        });
      }
    };
  }

  /**
   * Request/Response timing middleware
   */
  timingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        
        // Add timing header
        res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        
        // Log slow requests
        if (duration > 1000) {
          console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
        }
        
        // Update query stats
        this.updateQueryStats(req.path, duration);
      });

      next();
    };
  }

  /**
   * Bulk operations middleware
   */
  bulkOperationsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if this is a bulk operation
      if (req.path.includes('/bulk') && req.method === 'POST') {
        // Validate bulk request structure
        if (!Array.isArray(req.body)) {
          return res.status(400).json({
            error: 'Bulk operations require an array of operations'
          });
        }

        // Limit bulk operation size
        const maxBulkSize = 100;
        if (req.body.length > maxBulkSize) {
          return res.status(400).json({
            error: `Bulk operations limited to ${maxBulkSize} items`
          });
        }

        // Add bulk processing helpers
        req.bulkSize = req.body.length;
        res.bulkResponse = (results: any[], errors: any[] = []) => {
          return res.json({
            processed: results.length,
            errors: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined
          });
        };
      }

      next();
    };
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const userId = req.user?.id || 'anonymous';
    return `api:${req.method}:${url}:${userId}`;
  }

  /**
   * Generate ETag for response data
   */
  private generateETag(data: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }

  /**
   * Cache response with tags
   */
  private async cacheResponse(
    key: string, 
    data: any, 
    ttl: number, 
    tags?: string[]
  ): Promise<void> {
    if (!this.redis) return;

    try {
      // Store the cached data
      await this.redis.setex(key, ttl, JSON.stringify(data));

      // Store cache tags for invalidation
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await this.redis.sadd(`cache:tag:${tag}`, key);
          await this.redis.expire(`cache:tag:${tag}`, ttl + 300); // Longer TTL for tags
        }
      }
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.redis) return;

    try {
      for (const tag of tags) {
        const keys = await this.redis.smembers(`cache:tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`cache:tag:${tag}`);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Optimize query parameters
   */
  private optimizeQuery(query: any, options: QueryOptimization): any {
    const optimized = { ...query };

    // Handle includes parameter
    if (options.enableIncludes && query.include) {
      const includes = query.include.split(',').filter((inc: string) => 
        options.allowedIncludes.includes(inc.trim())
      );
      optimized.include = includes.slice(0, options.maxIncludes).join(',');
    }

    // Handle select parameter
    if (options.enableSelect && query.select) {
      const selects = query.select.split(',').filter((sel: string) => 
        options.allowedSelects.includes(sel.trim())
      );
      optimized.select = selects.join(',');
    }

    return optimized;
  }

  /**
   * Track query patterns for optimization
   */
  private trackQueryPattern(req: Request): void {
    const pattern = `${req.method}:${req.route?.path || req.path}`;
    const existing = this.queryStats.get(pattern);

    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
    } else {
      this.queryStats.set(pattern, {
        count: 1,
        avgTime: 0,
        lastUsed: Date.now()
      });
    }
  }

  /**
   * Update query timing statistics
   */
  private updateQueryStats(path: string, duration: number): void {
    const pattern = `GET:${path}`;
    const stats = this.queryStats.get(pattern);

    if (stats) {
      stats.avgTime = (stats.avgTime * (stats.count - 1) + duration) / stats.count;
    }
  }

  /**
   * Build pagination URL
   */
  private buildPageUrl(req: Request, page: number): string {
    const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
    url.searchParams.set('page', page.toString());
    return url.pathname + url.search;
  }

  /**
   * Get query statistics
   */
  getQueryStats(): Map<string, any> {
    return this.queryStats;
  }

  /**
   * Get optimization metrics
   */
  async getMetrics(): Promise<{
    cacheHitRate: number;
    avgResponseTime: number;
    slowQueries: string[];
    popularEndpoints: string[];
  }> {
    const stats = Array.from(this.queryStats.entries());
    
    return {
      cacheHitRate: 0, // Would need to track cache hits/misses
      avgResponseTime: stats.reduce((sum, [, stat]) => sum + stat.avgTime, 0) / stats.length || 0,
      slowQueries: stats
        .filter(([, stat]) => stat.avgTime > 1000)
        .map(([pattern]) => pattern),
      popularEndpoints: stats
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([pattern]) => pattern)
    };
  }
}

// Extend Express Request/Response types
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        offset: number;
        sort?: string;
        order: 'asc' | 'desc';
      };
      bulkSize?: number;
    }

    interface Response {
      paginate?: (data: any[], total: number) => any;
      bulkResponse?: (results: any[], errors?: any[]) => Response;
    }
  }
}

// Export singleton instance
export const apiOptimization = new APIOptimizationMiddleware();

// Export convenience methods
export const {
  compressionMiddleware,
  cacheMiddleware,
  queryOptimizationMiddleware,
  paginationMiddleware,
  timingMiddleware,
  bulkOperationsMiddleware
} = apiOptimization;

export default apiOptimization;