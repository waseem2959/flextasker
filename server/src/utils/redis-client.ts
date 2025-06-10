/**
 * Redis Client Configuration and Management
 * 
 * This module provides Redis client configuration for distributed caching,
 * session management, and real-time features with cluster support.
 */

import Redis, { Cluster, ClusterOptions, RedisOptions } from 'ioredis';
import { logger } from './logger';

/**
 * Redis configuration interface
 */
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  connectTimeout: number;
  commandTimeout: number;
}

/**
 * Redis cluster configuration
 */
interface RedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  options: ClusterOptions;
}

/**
 * Environment-based Redis configuration
 */
const getRedisConfig = (): RedisConfig | RedisClusterConfig => {
  // const isProduction = process.env.NODE_ENV === 'production';
  const isCluster = process.env.REDIS_CLUSTER === 'true';

  if (isCluster) {
    // Redis Cluster configuration for production
    const nodes = process.env.REDIS_CLUSTER_NODES?.split(',').map(node => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port, 10) };
    }) || [
      { host: 'redis-cluster-1', port: 6379 },
      { host: 'redis-cluster-2', port: 6379 },
      { host: 'redis-cluster-3', port: 6379 }
    ];

    return {
      nodes,
      options: {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'flextasker:',
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
          connectTimeout: 10000,
          commandTimeout: 5000
        },
        enableOfflineQueue: false,
        scaleReads: 'slave',
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 300,
        retryDelayOnMoved: 0,
        // retryDelayOnAsk: 0, // This property doesn't exist in ClusterOptions
        enableReadyCheck: true
      }
    };
  }

  // Single Redis instance configuration
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'flextasker:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    connectTimeout: 10000,
    commandTimeout: 5000
  };
};

/**
 * Redis Client Manager
 */
class RedisClientManager {
  private static instance: RedisClientManager;
  private client: Redis | Cluster | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;

  private constructor() {}

  static getInstance(): RedisClientManager {
    if (!RedisClientManager.instance) {
      RedisClientManager.instance = new RedisClientManager();
    }
    return RedisClientManager.instance;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<Redis | Cluster> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      const config = getRedisConfig();
      
      if ('nodes' in config) {
        // Cluster configuration
        logger.info('Connecting to Redis cluster', { 
          nodes: config.nodes.length,
          keyPrefix: config.options.redisOptions?.keyPrefix 
        });
        this.client = new Redis.Cluster(config.nodes, config.options);
      } else {
        // Single instance configuration
        logger.info('Connecting to Redis instance', { 
          host: config.host, 
          port: config.port,
          db: config.db,
          keyPrefix: config.keyPrefix 
        });
        this.client = new Redis(config as RedisOptions);
      }

      // Set up event listeners
      this.setupEventListeners();

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      logger.info('Redis connection established successfully');
      return this.client;

    } catch (error) {
      this.connectionAttempts++;
      logger.error('Redis connection failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: this.connectionAttempts,
        maxAttempts: this.maxConnectionAttempts
      });

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        logger.error('Max Redis connection attempts reached, falling back to memory cache');
        throw new Error('Redis connection failed after maximum attempts');
      }

      // Retry connection after delay
      await new Promise(resolve => setTimeout(resolve, 2000 * this.connectionAttempts));
      return this.connect();
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis | Cluster | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error('Error closing Redis connection', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Get Redis connection statistics
   */
  getStats(): any {
    if (!this.client) {
      return { connected: false, client: null };
    }

    if (this.client instanceof Redis.Cluster) {
      return {
        connected: this.isConnected,
        type: 'cluster',
        nodes: this.client.nodes().length,
        status: this.client.status
      };
    } else {
      return {
        connected: this.isConnected,
        type: 'single',
        status: this.client.status,
        host: this.client.options.host,
        port: this.client.options.port,
        db: this.client.options.db
      };
    }
  }

  /**
   * Setup Redis event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { 
        error: error.message,
        stack: error.stack 
      });
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay) => {
      logger.info('Redis client reconnecting', { delay });
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });

    // Cluster-specific events
    if (this.client instanceof Redis.Cluster) {
      this.client.on('node error', (error, node) => {
        logger.error('Redis cluster node error', { 
          error: error.message,
          node: `${node.options.host}:${node.options.port}`
        });
      });

      this.client.on('+node', (node) => {
        logger.info('Redis cluster node added', { 
          node: `${node.options.host}:${node.options.port}`
        });
      });

      this.client.on('-node', (node) => {
        logger.warn('Redis cluster node removed', { 
          node: `${node.options.host}:${node.options.port}`
        });
      });
    }
  }
}

// Export singleton instance
export const redisManager = RedisClientManager.getInstance();

/**
 * Get Redis client with automatic connection
 */
export const getRedisClient = async (): Promise<Redis | Cluster> => {
  return redisManager.connect();
};

/**
 * Check Redis health
 */
export const checkRedisHealth = async (): Promise<{ healthy: boolean; latency?: number; error?: string }> => {
  try {
    const client = redisManager.getClient();
    if (!client || !redisManager.isRedisConnected()) {
      return { healthy: false, error: 'Redis not connected' };
    }

    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return { healthy: true, latency };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export default redisManager;
