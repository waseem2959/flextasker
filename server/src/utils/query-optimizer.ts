/**
 * Database Query Optimizer
 * 
 * Advanced query optimization utilities for Prisma with intelligent
 * includes, selects, indexing recommendations, and performance monitoring.
 */

import { PrismaClient } from '@prisma/client';

interface QueryPerformanceMetric {
  query: string;
  duration: number;
  timestamp: number;
  rowsAffected: number;
  cacheable: boolean;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'composite';
  reason: string;
  estimatedImprovement: number;
}

interface QueryPattern {
  pattern: string;
  frequency: number;
  avgDuration: number;
  tables: string[];
  joins: string[];
  conditions: string[];
}

class QueryOptimizer {
  private performanceMetrics: QueryPerformanceMetric[] = [];
  private queryPatterns = new Map<string, QueryPattern>();
  private slowQueryThreshold = 100; // ms
  private indexRecommendations: IndexRecommendation[] = [];

  /**
   * Optimize Prisma query with intelligent includes and selects
   */
  optimizePrismaQuery<T>(
    baseQuery: any,
    options: {
      include?: string[];
      select?: string[];
      maxIncludes?: number;
      enableSmartSelects?: boolean;
    } = {}
  ): any {
    const {
      include = [],
      select = [],
      maxIncludes = 5,
      enableSmartSelects = true
    } = options;

    const optimizedQuery = { ...baseQuery };

    // Optimize includes
    if (include.length > 0) {
      optimizedQuery.include = this.optimizeIncludes(include, maxIncludes);
    }

    // Optimize selects
    if (select.length > 0 && enableSmartSelects) {
      optimizedQuery.select = this.optimizeSelects(select);
    }

    // Add query hints for performance
    if (optimizedQuery.where) {
      optimizedQuery.where = this.optimizeWhereClause(optimizedQuery.where);
    }

    // Optimize ordering
    if (optimizedQuery.orderBy) {
      optimizedQuery.orderBy = this.optimizeOrderBy(optimizedQuery.orderBy);
    }

    return optimizedQuery;
  }

  /**
   * Smart pagination with estimated counts for better performance
   */
  async optimizedPagination<T>(
    prisma: PrismaClient,
    model: any,
    query: any,
    page: number,
    limit: number
  ): Promise<{
    data: T[];
    total: number;
    estimatedTotal?: number;
    hasMore: boolean;
    performance: {
      queryTime: number;
      countTime: number;
    };
  }> {
    const offset = (page - 1) * limit;
    const startTime = Date.now();

    // For large datasets, use estimated count after certain threshold
    const useEstimatedCount = page > 10 || limit > 100;

    let countPromise: Promise<number>;
    if (useEstimatedCount) {
      // Use approximate count for better performance
      countPromise = this.getEstimatedCount(prisma, model, query.where);
    } else {
      // Use exact count for smaller datasets
      countPromise = model.count({ where: query.where });
    }

    // Execute data query and count in parallel
    const [data, total] = await Promise.all([
      model.findMany({
        ...query,
        skip: offset,
        take: limit + 1 // Fetch one extra to check if there's more
      }),
      countPromise
    ]);

    const queryTime = Date.now() - startTime;
    const hasMore = data.length > limit;
    
    // Remove the extra item if it exists
    if (hasMore) {
      data.pop();
    }

    // Record performance metrics
    this.recordQueryPerformance({
      query: `${model.name}.findMany`,
      duration: queryTime,
      timestamp: Date.now(),
      rowsAffected: data.length,
      cacheable: true
    });

    return {
      data,
      total: useEstimatedCount ? Math.max(total, offset + data.length) : total,
      estimatedTotal: useEstimatedCount ? total : undefined,
      hasMore,
      performance: {
        queryTime,
        countTime: 0 // Would need actual measurement
      }
    };
  }

  /**
   * Optimize includes to prevent N+1 queries
   */
  private optimizeIncludes(includes: string[], maxIncludes: number): any {
    const includeObj: any = {};
    const prioritizedIncludes = this.prioritizeIncludes(includes);

    prioritizedIncludes.slice(0, maxIncludes).forEach(include => {
      if (include.includes('.')) {
        // Nested include
        const parts = include.split('.');
        let current = includeObj;
        
        parts.forEach((part, index) => {
          if (index === parts.length - 1) {
            current[part] = true;
          } else {
            current[part] = current[part] || { include: {} };
            current = current[part].include;
          }
        });
      } else {
        // Simple include
        includeObj[include] = this.getOptimalIncludeConfig(include);
      }
    });

    return includeObj;
  }

  /**
   * Prioritize includes based on query patterns and frequency
   */
  private prioritizeIncludes(includes: string[]): string[] {
    const priorities = {
      'owner': 10,
      'category': 9,
      'bids': 8,
      'reviews': 7,
      'attachments': 6,
      'messages': 5
    };

    return includes.sort((a, b) => {
      const priorityA = priorities[a as keyof typeof priorities] || 0;
      const priorityB = priorities[b as keyof typeof priorities] || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * Get optimal include configuration for a relation
   */
  private getOptimalIncludeConfig(include: string): any {
    const configs: Record<string, any> = {
      'owner': {
        select: {
          id: true,
          name: true,
          avatar: true,
          rating: true,
          verificationLevel: true
        }
      },
      'category': {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true
        }
      },
      'bids': {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limit bids to prevent large responses
      },
      'reviews': {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }
    };

    return configs[include] || true;
  }

  /**
   * Optimize select fields
   */
  private optimizeSelects(selects: string[]): any {
    const selectObj: any = {};
    
    // Always include required fields
    const requiredFields = ['id', 'createdAt', 'updatedAt'];
    const allSelects = [...new Set([...requiredFields, ...selects])];

    allSelects.forEach(field => {
      if (field.includes('.')) {
        // Nested select
        const parts = field.split('.');
        let current = selectObj;
        
        parts.forEach((part, index) => {
          if (index === parts.length - 1) {
            current[part] = true;
          } else {
            current[part] = current[part] || { select: {} };
            current = current[part].select;
          }
        });
      } else {
        selectObj[field] = true;
      }
    });

    return selectObj;
  }

  /**
   * Optimize WHERE clauses for better index usage
   */
  private optimizeWhereClause(where: any): any {
    const optimized = { ...where };

    // Optimize text search
    if (optimized.title?.contains || optimized.description?.contains) {
      // Convert to full-text search if available
      const searchTerm = optimized.title?.contains || optimized.description?.contains;
      
      // Use database-specific full-text search
      optimized.OR = [
        { title: { search: searchTerm } },
        { description: { search: searchTerm } }
      ];
      
      delete optimized.title?.contains;
      delete optimized.description?.contains;
    }

    // Optimize date ranges
    if (optimized.createdAt?.gte && optimized.createdAt?.lte) {
      // Ensure date range is reasonable
      const start = new Date(optimized.createdAt.gte);
      const end = new Date(optimized.createdAt.lte);
      
      if (end.getTime() - start.getTime() > 365 * 24 * 60 * 60 * 1000) {
        // Range too large, limit to 1 year
        optimized.createdAt.gte = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
    }

    // Optimize IN clauses
    Object.keys(optimized).forEach(key => {
      if (optimized[key]?.in && Array.isArray(optimized[key].in)) {
        // Limit IN clause size for performance
        if (optimized[key].in.length > 100) {
          optimized[key].in = optimized[key].in.slice(0, 100);
        }
      }
    });

    return optimized;
  }

  /**
   * Optimize ORDER BY clauses
   */
  private optimizeOrderBy(orderBy: any): any {
    if (Array.isArray(orderBy)) {
      // Limit number of order by clauses
      return orderBy.slice(0, 3);
    }

    return orderBy;
  }

  /**
   * Get estimated count for large datasets
   */
  private async getEstimatedCount(
    prisma: PrismaClient,
    model: any,
    where?: any
  ): Promise<number> {
    try {
      // Use database-specific estimated count
      // For PostgreSQL: SELECT reltuples FROM pg_class WHERE relname = 'table_name'
      // For MySQL: SELECT table_rows FROM information_schema.tables WHERE table_name = 'table_name'
      // For now, use a sampled count approach
      
      if (!where || Object.keys(where).length === 0) {
        // If no WHERE clause, try to get table statistics
        return this.getTableRowCount(model.name);
      }

      // For filtered queries, use sampling
      const sample = await model.findMany({
        where,
        take: 1000,
        select: { id: true }
      });

      // Estimate based on sample
      if (sample.length < 1000) {
        return sample.length;
      } else {
        // Extrapolate from sample
        const totalEstimate = await this.getTableRowCount(model.name);
        return Math.min(totalEstimate, sample.length * 10);
      }
    } catch (error) {
      console.warn('Failed to get estimated count, falling back to exact count');
      return model.count({ where });
    }
  }

  /**
   * Get approximate table row count from database statistics
   */
  private async getTableRowCount(tableName: string): Promise<number> {
    // This would need to be implemented based on your database
    // For now, return a reasonable estimate
    const estimates: Record<string, number> = {
      'Task': 10000,
      'User': 5000,
      'Bid': 25000,
      'Review': 8000,
      'Message': 50000
    };

    return estimates[tableName] || 1000;
  }

  /**
   * Record query performance metrics
   */
  recordQueryPerformance(metric: QueryPerformanceMetric): void {
    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.shift();
    }

    // Update query patterns
    this.updateQueryPattern(metric);

    // Check for slow queries
    if (metric.duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected: ${metric.query} took ${metric.duration}ms`);
      this.generateIndexRecommendation(metric);
    }
  }

  /**
   * Update query pattern statistics
   */
  private updateQueryPattern(metric: QueryPerformanceMetric): void {
    const pattern = this.normalizeQueryPattern(metric.query);
    const existing = this.queryPatterns.get(pattern);

    if (existing) {
      existing.frequency++;
      existing.avgDuration = (existing.avgDuration * (existing.frequency - 1) + metric.duration) / existing.frequency;
    } else {
      this.queryPatterns.set(pattern, {
        pattern,
        frequency: 1,
        avgDuration: metric.duration,
        tables: this.extractTables(metric.query),
        joins: this.extractJoins(metric.query),
        conditions: this.extractConditions(metric.query)
      });
    }
  }

  /**
   * Generate index recommendations based on slow queries
   */
  private generateIndexRecommendation(metric: QueryPerformanceMetric): void {
    const tables = this.extractTables(metric.query);
    const conditions = this.extractConditions(metric.query);

    if (tables.length > 0 && conditions.length > 0) {
      const recommendation: IndexRecommendation = {
        table: tables[0],
        columns: conditions,
        type: conditions.length > 1 ? 'composite' : 'btree',
        reason: `Slow query detected: ${metric.query}`,
        estimatedImprovement: this.estimateIndexImprovement(metric.duration)
      };

      // Check if recommendation already exists
      const exists = this.indexRecommendations.some(rec => 
        rec.table === recommendation.table && 
        JSON.stringify(rec.columns) === JSON.stringify(recommendation.columns)
      );

      if (!exists) {
        this.indexRecommendations.push(recommendation);
      }
    }
  }

  /**
   * Estimate performance improvement from adding an index
   */
  private estimateIndexImprovement(currentDuration: number): number {
    // Simplified estimation - actual improvement depends on data size and query complexity
    if (currentDuration > 1000) return 80; // 80% improvement
    if (currentDuration > 500) return 60;  // 60% improvement
    if (currentDuration > 200) return 40;  // 40% improvement
    return 20; // 20% improvement
  }

  /**
   * Extract table names from query
   */
  private extractTables(query: string): string[] {
    // This is a simplified extraction - would need more sophisticated parsing
    const matches = query.match(/\b(User|Task|Bid|Review|Message|Category)\b/gi);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extract JOIN patterns from query
   */
  private extractJoins(query: string): string[] {
    // Simplified JOIN extraction
    return [];
  }

  /**
   * Extract WHERE conditions from query
   */
  private extractConditions(query: string): string[] {
    // Simplified condition extraction
    const commonConditions = ['id', 'status', 'createdAt', 'userId', 'categoryId'];
    return commonConditions.filter(condition => query.includes(condition));
  }

  /**
   * Normalize query pattern for grouping
   */
  private normalizeQueryPattern(query: string): string {
    return query
      .replace(/\d+/g, '?') // Replace numbers with placeholders
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    slowQueries: QueryPerformanceMetric[];
    avgQueryTime: number;
    queryPatterns: QueryPattern[];
    indexRecommendations: IndexRecommendation[];
    cachingOpportunities: string[];
  } {
    const slowQueries = this.performanceMetrics
      .filter(metric => metric.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const avgQueryTime = this.performanceMetrics.length > 0
      ? this.performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.performanceMetrics.length
      : 0;

    const queryPatterns = Array.from(this.queryPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    const cachingOpportunities = queryPatterns
      .filter(pattern => pattern.frequency > 10 && pattern.avgDuration > 50)
      .map(pattern => pattern.pattern);

    return {
      slowQueries,
      avgQueryTime,
      queryPatterns,
      indexRecommendations: this.indexRecommendations,
      cachingOpportunities
    };
  }

  /**
   * Clear performance data
   */
  clearMetrics(): void {
    this.performanceMetrics = [];
    this.queryPatterns.clear();
    this.indexRecommendations = [];
  }
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();
export default queryOptimizer;