/**
 * Database Connection Manager with Read Replicas
 * 
 * This module provides intelligent database connection management with
 * read/write splitting, connection pooling, and automatic failover.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  writeUrl: string;
  readUrls: string[];
  connectionPoolSize: {
    min: number;
    max: number;
  };
  connectionTimeout: number;
  queryTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Connection pool statistics
 */
interface ConnectionStats {
  write: {
    active: number;
    idle: number;
    total: number;
  };
  read: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    write: number;
    read: number;
    total: number;
  };
  errors: {
    connection: number;
    query: number;
    timeout: number;
  };
}

/**
 * Database Connection Manager
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private writeClient: PrismaClient | null = null;
  private readClients: PrismaClient[] = [];
  private currentReadIndex = 0;
  private config: DatabaseConfig;
  private stats: ConnectionStats;
  private isInitialized = false;

  private constructor() {
    this.config = this.loadConfiguration();
    this.stats = this.initializeStats();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing database connections', {
        writeUrl: this.maskUrl(this.config.writeUrl),
        readReplicas: this.config.readUrls.length
      });

      // Initialize write connection
      await this.initializeWriteConnection();

      // Initialize read connections
      await this.initializeReadConnections();

      // Test connections
      await this.testConnections();

      this.isInitialized = true;
      logger.info('Database connections initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize database connections', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get write client for mutations
   */
  getWriteClient(): PrismaClient {
    if (!this.writeClient) {
      throw new Error('Write client not initialized');
    }
    this.stats.queries.write++;
    this.stats.queries.total++;
    return this.writeClient;
  }

  /**
   * Get read client for queries (with load balancing)
   */
  getReadClient(): PrismaClient {
    if (this.readClients.length === 0) {
      // Fallback to write client if no read replicas
      logger.debug('No read replicas available, using write client');
      return this.getWriteClient();
    }

    // Round-robin load balancing
    const client = this.readClients[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readClients.length;
    
    this.stats.queries.read++;
    this.stats.queries.total++;
    return client;
  }

  /**
   * Get appropriate client based on operation type
   */
  getClient(operation: 'read' | 'write' = 'read'): PrismaClient {
    return operation === 'write' ? this.getWriteClient() : this.getReadClient();
  }

  /**
   * Execute query with automatic client selection
   */
  async executeQuery<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    operation: 'read' | 'write' = 'read',
    retries = 0
  ): Promise<T> {
    try {
      const client = this.getClient(operation);
      return await queryFn(client);
    } catch (error) {
      this.stats.errors.query++;
      
      if (retries < this.config.retryAttempts) {
        logger.warn('Query failed, retrying', {
          operation,
          attempt: retries + 1,
          maxAttempts: this.config.retryAttempts,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        await this.delay(this.config.retryDelay * (retries + 1));
        return this.executeQuery(queryFn, operation, retries + 1);
      }
      
      logger.error('Query failed after all retries', {
        operation,
        attempts: retries + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Health check for all connections
   */
  async healthCheck(): Promise<{
    write: { healthy: boolean; latency?: number; error?: string };
    read: Array<{ healthy: boolean; latency?: number; error?: string }>;
    overall: boolean;
  }> {
    const results = {
      write: { healthy: false, latency: 0, error: '' },
      read: [] as Array<{ healthy: boolean; latency?: number; error?: string }>,
      overall: false
    };

    // Check write connection
    try {
      const start = Date.now();
      if (this.writeClient) {
        await this.writeClient.$queryRaw`SELECT 1`;
      }
      results.write = {
        healthy: true,
        latency: Date.now() - start,
        error: ''
      };
    } catch (error) {
      results.write = {
        healthy: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check read connections
    for (const readClient of this.readClients) {
      try {
        const start = Date.now();
        await readClient.$queryRaw`SELECT 1`;
        results.read.push({
          healthy: true,
          latency: Date.now() - start
        });
      } catch (error) {
        results.read.push({
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Overall health
    results.overall = results.write.healthy && 
      (results.read.length === 0 || results.read.some(r => r.healthy));

    return results;
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    logger.info('Disconnecting database connections');

    const disconnectPromises = [];

    if (this.writeClient) {
      disconnectPromises.push(this.writeClient.$disconnect());
    }

    for (const readClient of this.readClients) {
      disconnectPromises.push(readClient.$disconnect());
    }

    try {
      await Promise.all(disconnectPromises);
      logger.info('All database connections closed');
    } catch (error) {
      logger.error('Error closing database connections', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    this.writeClient = null;
    this.readClients = [];
    this.isInitialized = false;
  }

  /**
   * Load configuration from environment
   */
  private loadConfiguration(): DatabaseConfig {
    const writeUrl = process.env.DATABASE_URL;
    if (!writeUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Read replica URLs (comma-separated)
    const readUrlsEnv = process.env.DATABASE_READ_URLS || '';
    const readUrls = readUrlsEnv ? readUrlsEnv.split(',').map(url => url.trim()) : [];

    return {
      writeUrl,
      readUrls,
      connectionPoolSize: {
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),
        max: parseInt(process.env.DB_POOL_MAX || '10', 10)
      },
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000', 10)
    };
  }

  /**
   * Initialize write connection
   */
  private async initializeWriteConnection(): Promise<void> {
    this.writeClient = new PrismaClient({
      datasources: {
        db: { url: this.config.writeUrl }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    await this.writeClient.$connect();
    logger.info('Write database connection established');
  }

  /**
   * Initialize read connections
   */
  private async initializeReadConnections(): Promise<void> {
    if (this.config.readUrls.length === 0) {
      logger.info('No read replicas configured, using write connection for reads');
      return;
    }

    for (let i = 0; i < this.config.readUrls.length; i++) {
      const readUrl = this.config.readUrls[i];
      try {
        const readClient = new PrismaClient({
          datasources: {
            db: { url: readUrl }
          },
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });

        await readClient.$connect();
        this.readClients.push(readClient);
        logger.info('Read replica connection established', { 
          replica: i + 1, 
          url: this.maskUrl(readUrl) 
        });
      } catch (error) {
        logger.error('Failed to connect to read replica', {
          replica: i + 1,
          url: this.maskUrl(readUrl),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Read replica initialization completed', {
      configured: this.config.readUrls.length,
      connected: this.readClients.length
    });
  }

  /**
   * Test all connections
   */
  private async testConnections(): Promise<void> {
    // Test write connection
    if (this.writeClient) {
      await this.writeClient.$queryRaw`SELECT 1`;
    }

    // Test read connections
    for (const readClient of this.readClients) {
      await readClient.$queryRaw`SELECT 1`;
    }
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): ConnectionStats {
    return {
      write: { active: 0, idle: 0, total: 0 },
      read: { active: 0, idle: 0, total: 0 },
      queries: { write: 0, read: 0, total: 0 },
      errors: { connection: 0, query: 0, timeout: 0 }
    };
  }

  /**
   * Mask sensitive URL information
   */
  private maskUrl(url: string): string {
    return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

export default databaseManager;
