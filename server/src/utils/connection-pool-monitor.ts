/**
 * Connection Pool Monitor
 * 
 * This module provides monitoring and optimization for database connection pools,
 * including PgBouncer integration and connection health tracking.
 */

import { databaseManager } from './database-manager';
import { logger } from './logger';

/**
 * Connection pool metrics interface
 */
interface PoolMetrics {
  timestamp: number;
  connections: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  health: {
    writePool: boolean;
    readPools: boolean[];
    overallHealth: boolean;
  };
  performance: {
    throughput: number; // queries per second
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
  };
}

/**
 * Connection Pool Configuration
 */
interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  statementTimeout: number;
  poolMode: 'session' | 'transaction' | 'statement';
  maxClientConnections: number;
  defaultPoolSize: number;
}

/**
 * Connection Pool Monitor
 */
export class ConnectionPoolMonitor {
  private static instance: ConnectionPoolMonitor;
  private metrics: PoolMetrics[] = [];
  private maxMetricsHistory = 1000;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private queryTimes: number[] = [];
  private maxQueryTimeHistory = 1000;

  private constructor() {}

  static getInstance(): ConnectionPoolMonitor {
    if (!ConnectionPoolMonitor.instance) {
      ConnectionPoolMonitor.instance = new ConnectionPoolMonitor();
    }
    return ConnectionPoolMonitor.instance;
  }

  /**
   * Start monitoring connection pools
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      logger.warn('Connection pool monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    logger.info('Connection pool monitoring started', { intervalMs });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Connection pool monitoring stopped');
  }

  /**
   * Record query execution time
   */
  recordQueryTime(timeMs: number): void {
    this.queryTimes.push(timeMs);
    
    // Keep only recent query times
    if (this.queryTimes.length > this.maxQueryTimeHistory) {
      this.queryTimes = this.queryTimes.slice(-this.maxQueryTimeHistory);
    }
  }

  /**
   * Get current pool metrics
   */
  getCurrentMetrics(): PoolMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): PoolMetrics[] {
    const history = this.metrics.slice();
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get pool performance statistics
   */
  getPerformanceStats(): {
    averageLatency: number;
    throughput: number;
    errorRate: number;
    connectionUtilization: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        connectionUtilization: 0,
        recommendations: ['No metrics available yet']
      };
    }

    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.performance.latency.p50, 0) / recentMetrics.length;
    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.performance.throughput, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) / recentMetrics.length;
    
    const latestMetrics = recentMetrics[recentMetrics.length - 1];
    const connectionUtilization = latestMetrics.connections.active / latestMetrics.connections.total;

    const recommendations = this.generateRecommendations(avgLatency, avgThroughput, avgErrorRate, connectionUtilization);

    return {
      averageLatency: Math.round(avgLatency),
      throughput: Math.round(avgThroughput),
      errorRate: Math.round(avgErrorRate * 100) / 100,
      connectionUtilization: Math.round(connectionUtilization * 100) / 100,
      recommendations
    };
  }

  /**
   * Get PgBouncer configuration recommendations
   */
  getPgBouncerConfig(): PoolConfig {
    const stats = this.getPerformanceStats();
    
    return {
      maxConnections: stats.connectionUtilization > 0.8 ? 25 : 20,
      minConnections: 5,
      idleTimeout: 600, // 10 minutes
      connectionTimeout: 10000, // 10 seconds
      statementTimeout: 30000, // 30 seconds
      poolMode: stats.throughput > 100 ? 'transaction' : 'session',
      maxClientConnections: 100,
      defaultPoolSize: stats.connectionUtilization > 0.7 ? 25 : 20
    };
  }

  /**
   * Generate PgBouncer configuration file
   */
  generatePgBouncerConfig(): string {
    const config = this.getPgBouncerConfig();
    const writeUrl = process.env.DATABASE_URL || '';
    const readUrls = (process.env.DATABASE_READ_URLS || '').split(',').filter(url => url.trim());

    let configFile = `[databases]
; Write database
flextasker_write = ${writeUrl}

`;

    // Add read replicas
    readUrls.forEach((url, index) => {
      configFile += `; Read replica ${index + 1}
flextasker_read_${index + 1} = ${url.trim()}

`;
    });

    configFile += `[pgbouncer]
; Pool configuration
pool_mode = ${config.poolMode}
max_client_conn = ${config.maxClientConnections}
default_pool_size = ${config.defaultPoolSize}
min_pool_size = ${config.minConnections}
reserve_pool_size = 5

; Timeouts
server_connect_timeout = ${Math.floor(config.connectionTimeout / 1000)}
server_idle_timeout = ${Math.floor(config.idleTimeout)}
query_timeout = ${Math.floor(config.statementTimeout / 1000)}

; Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

; Security
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

; Admin
admin_users = postgres
stats_users = postgres

; Listen
listen_addr = 0.0.0.0
listen_port = 6432

; Limits
max_db_connections = ${config.maxConnections}
max_user_connections = ${config.maxClientConnections}

; Performance
server_reset_query = DISCARD ALL
server_check_query = SELECT 1
server_check_delay = 30
`;

    return configFile;
  }

  /**
   * Check pool health and generate alerts
   */
  checkPoolHealth(): {
    healthy: boolean;
    alerts: Array<{
      severity: 'low' | 'medium' | 'high';
      message: string;
      metric: string;
      value: number;
      threshold: number;
    }>;
  } {
    const alerts: any[] = [];
    const stats = this.getPerformanceStats();
    const currentMetrics = this.getCurrentMetrics();

    if (!currentMetrics) {
      return { healthy: false, alerts: [{ severity: 'high', message: 'No metrics available', metric: 'availability', value: 0, threshold: 1 }] };
    }

    // Check connection utilization
    if (stats.connectionUtilization > 0.9) {
      alerts.push({
        severity: 'high',
        message: 'Connection pool utilization is very high',
        metric: 'connection_utilization',
        value: stats.connectionUtilization,
        threshold: 0.9
      });
    } else if (stats.connectionUtilization > 0.8) {
      alerts.push({
        severity: 'medium',
        message: 'Connection pool utilization is high',
        metric: 'connection_utilization',
        value: stats.connectionUtilization,
        threshold: 0.8
      });
    }

    // Check error rate
    if (stats.errorRate > 5) {
      alerts.push({
        severity: 'high',
        message: 'Database error rate is high',
        metric: 'error_rate',
        value: stats.errorRate,
        threshold: 5
      });
    } else if (stats.errorRate > 2) {
      alerts.push({
        severity: 'medium',
        message: 'Database error rate is elevated',
        metric: 'error_rate',
        value: stats.errorRate,
        threshold: 2
      });
    }

    // Check latency
    if (stats.averageLatency > 1000) {
      alerts.push({
        severity: 'high',
        message: 'Database latency is very high',
        metric: 'latency',
        value: stats.averageLatency,
        threshold: 1000
      });
    } else if (stats.averageLatency > 500) {
      alerts.push({
        severity: 'medium',
        message: 'Database latency is high',
        metric: 'latency',
        value: stats.averageLatency,
        threshold: 500
      });
    }

    // Check pool health
    if (!currentMetrics.health.overallHealth) {
      alerts.push({
        severity: 'high',
        message: 'Database connection pool is unhealthy',
        metric: 'pool_health',
        value: 0,
        threshold: 1
      });
    }

    const healthy = alerts.filter(a => a.severity === 'high').length === 0;

    return { healthy, alerts };
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const dbStats = databaseManager.getStats();
      const healthCheck = await databaseManager.healthCheck();
      
      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics();
      
      const metrics: PoolMetrics = {
        timestamp: Date.now(),
        connections: {
          active: dbStats.write.active + dbStats.read.active,
          idle: dbStats.write.idle + dbStats.read.idle,
          total: dbStats.write.total + dbStats.read.total,
          waiting: 0 // Would need to be implemented in database manager
        },
        queries: {
          total: dbStats.queries.total,
          successful: dbStats.queries.total - (dbStats.errors.query || 0),
          failed: dbStats.errors.query || 0,
          averageTime: performance.latency.p50
        },
        health: {
          writePool: healthCheck.write.healthy,
          readPools: healthCheck.read.map(r => r.healthy),
          overallHealth: healthCheck.overall
        },
        performance
      };

      this.metrics.push(metrics);

      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      logger.debug('Connection pool metrics collected', {
        connections: metrics.connections,
        health: metrics.health.overallHealth
      });

    } catch (error) {
      logger.error('Failed to collect connection pool metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calculate performance metrics from query times
   */
  private calculatePerformanceMetrics(): PoolMetrics['performance'] {
    if (this.queryTimes.length === 0) {
      return {
        throughput: 0,
        latency: { p50: 0, p95: 0, p99: 0 },
        errorRate: 0
      };
    }

    const sortedTimes = [...this.queryTimes].sort((a, b) => a - b);
    const length = sortedTimes.length;

    const p50 = sortedTimes[Math.floor(length * 0.5)];
    const p95 = sortedTimes[Math.floor(length * 0.95)];
    const p99 = sortedTimes[Math.floor(length * 0.99)];

    // Calculate throughput (queries per second over last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneMinuteAgo);
    const throughput = recentMetrics.length > 0 
      ? recentMetrics[recentMetrics.length - 1].queries.total - (recentMetrics[0]?.queries.total || 0)
      : 0;

    // Calculate error rate
    const totalQueries = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].queries.total : 0;
    const totalErrors = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].queries.failed : 0;
    const errorRate = totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0;

    return {
      throughput,
      latency: { p50, p95, p99 },
      errorRate
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    avgLatency: number,
    avgThroughput: number,
    avgErrorRate: number,
    connectionUtilization: number
  ): string[] {
    const recommendations: string[] = [];

    if (connectionUtilization > 0.8) {
      recommendations.push('Consider increasing connection pool size');
    }

    if (avgLatency > 500) {
      recommendations.push('High latency detected - consider read replicas or query optimization');
    }

    if (avgErrorRate > 2) {
      recommendations.push('High error rate - check database health and query patterns');
    }

    if (avgThroughput < 10) {
      recommendations.push('Low throughput - consider connection pooling optimization');
    }

    if (connectionUtilization < 0.3) {
      recommendations.push('Low connection utilization - consider reducing pool size');
    }

    if (recommendations.length === 0) {
      recommendations.push('Connection pool performance is optimal');
    }

    return recommendations;
  }
}

// Export singleton instance
export const connectionPoolMonitor = ConnectionPoolMonitor.getInstance();

export default connectionPoolMonitor;
