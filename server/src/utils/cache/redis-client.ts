/**
 * Redis Client
 * 
 * This module provides a centralized Redis client for the application
 * with connection handling, health checks, and reconnection logic.
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../logger';

// Configuration from environment variables with defaults
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_USERNAME = process.env.REDIS_USERNAME;
const RECONNECT_STRATEGY_MAX_RETRIES = 10;

// Extend Redis client type with isReady property
interface ExtendedRedisClient extends RedisClientType {
  isReady: boolean;
}

/**
 * Create and configure a Redis client
 */
function createRedisClient(): ExtendedRedisClient {
  // Create Redis client with type assertion
  const client = createClient({
    url: REDIS_URL,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries: number) => {
        // Exponential backoff with maximum retry limit
        if (retries > RECONNECT_STRATEGY_MAX_RETRIES) {
          logger.error('Redis reconnection failed after max retries');
          return new Error('Redis reconnection failed');
        }
        
        // Exponential backoff: 2^retries * 100ms (capped at 5 seconds)
        return Math.min(Math.pow(2, retries) * 100, 5000);
      }
    }
  }) as unknown as ExtendedRedisClient;
  
  // Initialize isReady flag
  client.isReady = false;
  
  // Set up event handlers
  client.on('error', (err: Error) => {
    logger.error('Redis client error', { error: err.message });
  });
  
  client.on('reconnecting', () => {
    client.isReady = false;
    logger.warn('Redis client reconnecting');
  });
  
  client.on('connect', () => {
    client.isReady = true;
    logger.info('Redis client connected');
  });
  
  client.on('ready', () => {
    client.isReady = true;
    logger.info('Redis client ready');
  });
  
  client.on('end', () => {
    client.isReady = false;
    logger.info('Redis client disconnected');
  });
  
  return client;
}

// Create singleton instance
const redisClient = createRedisClient();

// Connect immediately unless in test environment
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch((err: Error) => {
    logger.error('Failed to connect to Redis', { error: err.message });
  });
}

/**
 * Check if Redis is connected
 * @returns Promise<boolean> True if Redis is connected and ready
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (!redisClient.isReady) {
      return false;
    }
    
    // Simple ping-pong to verify connection
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
}

// Export client
export { redisClient };
