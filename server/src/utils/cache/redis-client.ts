/**
 * Redis Client
 * 
 * This module provides a Redis client instance for caching operations.
 * It handles connection management, reconnection, and error handling.
 */

import Redis from 'ioredis';
import { logger } from '../logger';

// Configuration options from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_TLS = process.env.REDIS_TLS === 'true';

// Redis client options
const redisOptions: Redis.RedisOptions = {
  retryStrategy: (times: number) => {
    // Exponential backoff with a maximum of 30 seconds
    const delay = Math.min(Math.exp(times), 30) * 1000;
    logger.info(`Redis reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000, // 10 seconds
};

// Add password if provided
if (REDIS_PASSWORD) {
  redisOptions.password = REDIS_PASSWORD;
}

// Add TLS options if enabled
if (REDIS_TLS) {
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

// Create Redis client
const redisClient = new Redis(REDIS_URL, redisOptions);

// Handle Redis events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (error) => {
  logger.error('Redis client error', { error: error.message });
});

redisClient.on('close', () => {
  logger.warn('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
});

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return redisClient.status === 'ready';
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis.Redis {
  return redisClient;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
    redisClient.disconnect();
  }
}

export default redisClient;
