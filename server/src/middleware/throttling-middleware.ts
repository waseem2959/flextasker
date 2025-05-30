/**
 * Request Throttling Middleware
 * 
 * This middleware provides fine-grained control over request rates for specific
 * routes or endpoints, with different throttling strategies and customization options.
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient, isRedisHealthy } from '../utils/cache/redis-client';
import { logger } from '../utils/logger';
import { ErrorType } from '../../../shared/types/errors';

// Extend the rate-limiter-flexible types to include our Redis client
declare module 'rate-limiter-flexible' {
  interface IRateLimiterStoreOptions {
    storeClient: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

/**
 * Throttling strategy types
 */
export enum ThrottlingStrategy {
  FIXED_WINDOW = 'fixed',     // Fixed window rate limiting
  SLIDING_WINDOW = 'sliding', // Sliding window rate limiting
  TOKEN_BUCKET = 'token',     // Token bucket algorithm
  LEAKY_BUCKET = 'leaky'      // Leaky bucket algorithm
}

/**
 * Throttling options interface
 */
export interface ThrottlingOptions {
  prefix?: string;               // Key prefix for Redis
  strategy?: ThrottlingStrategy; // Throttling strategy
  points?: number;               // Max requests in window
  duration?: number;             // Window duration in seconds
  blockDuration?: number;        // Block duration after limit exceeded (seconds)
  keyGenerator?: (req: Request) => string; // Function to generate unique key
  skip?: (req: Request) => boolean;        // Function to skip throttling for certain requests
  errorMessage?: string;         // Custom error message
  headers?: boolean;             // Whether to add rate limit headers
}

/**
 * Default throttling options
 */
const DEFAULT_OPTIONS: ThrottlingOptions = {
  prefix: 'throttle:',
  strategy: ThrottlingStrategy.SLIDING_WINDOW,
  points: 30,
  duration: 60,
  blockDuration: 60,
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }
    return `ip:${req.ip}`;
  },
  skip: () => false,
  headers: true
};

/**
 * Create a throttling middleware
 * 
 * @param options Throttling options
 * @returns Express middleware
 */
export function createThrottlingMiddleware(options: ThrottlingOptions = {}): (req: Request, res: Response, next: NextFunction) => Promise<void | Response> {
  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Create rate limiter instance
  let rateLimiter: RateLimiterRedis | RateLimiterMemory | null = null;
  let rateLimiterInitialized = false;
  let initializationError: Error | null = null;
  
  // Initialize rate limiter asynchronously
  const initRateLimiter = async (): Promise<void> => {
    if (rateLimiterInitialized) return;
    
    try {
      // Check if Redis is available and ready
      const useRedis = await isRedisHealthy();
      
      if (useRedis && redisClient) {
        // Create Redis-based rate limiter
        rateLimiter = new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: mergedOptions.prefix,
          points: mergedOptions.points,
          duration: mergedOptions.duration,
          blockDuration: mergedOptions.blockDuration,
          inMemoryBlockOnConsumed: mergedOptions.points,
          inMemoryBlockDuration: mergedOptions.blockDuration,
          insuranceLimiter: new RateLimiterMemory({
            keyPrefix: `fallback_${mergedOptions.prefix}`,
            points: mergedOptions.points ?? 30,
            duration: mergedOptions.duration ?? 60
          })
        });
        
        logger.debug('Using Redis-based rate limiter');
      } else {
        // Fall back to in-memory rate limiter if Redis is not available
        logger.warn('Falling back to in-memory rate limiter');
        rateLimiter = new RateLimiterMemory({
          keyPrefix: `mem_${mergedOptions.prefix}`,
          points: mergedOptions.points ?? 30,
          duration: mergedOptions.duration ?? 60,
          blockDuration: mergedOptions.blockDuration
        });
      }
      
      rateLimiterInitialized = true;
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error('Failed to initialize rate limiter');
      logger.error('Failed to initialize rate limiter', { error: initializationError });
      throw initializationError;
    }
  };
  
  // Initialize rate limiter immediately
  const initPromise = initRateLimiter().catch(err => {
    logger.error('Rate limiter initialization error', { error: err });
  });
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    // Skip if the request matches skip condition
    if (mergedOptions.skip?.(req)) {
      return next();
    }
    
    // Generate the key for this request
    const key = mergedOptions.keyGenerator ? mergedOptions.keyGenerator(req) : `ip:${req.ip}`;
    
    try {
      // Wait for rate limiter to be ready
      if (!rateLimiterInitialized) {
        await initPromise;
      }
      
      if (initializationError) {
        throw initializationError;
      }
      
      if (!rateLimiter) {
        throw new Error('Rate limiter not initialized');
      }
      
      // Try to consume a point
      const rateLimiterRes = await rateLimiter.consume(key);
      
      // Add rate limit headers if enabled
      if (mergedOptions.headers) {
        res.setHeader('X-RateLimit-Limit', String(mergedOptions.points ?? 30));
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());
      }
      
      return next();
    } catch (error) {
      // Handle rate limit exceeded
      if (error instanceof RateLimiterRes) {
        // Add rate limit headers if enabled
        if (mergedOptions.headers) {
          res.setHeader('X-RateLimit-Limit', String(mergedOptions.points ?? 30));
          res.setHeader('X-RateLimit-Remaining', '0');
          res.setHeader('X-RateLimit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
          res.setHeader('Retry-After', Math.ceil(error.msBeforeNext / 1000).toString());
        }
        
        // Log the throttling event
        logger.warn('Request throttled', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          key,
          msBeforeNext: error.msBeforeNext
        });
        
        // Return error response
        return res.status(429).json({
          success: false,
          error: {
            type: ErrorType.RATE_LIMIT,  // Using RATE_LIMIT from ErrorType enum
            message: mergedOptions.errorMessage ?? 'Too many requests, please try again later',
            retryAfter: Math.ceil(error.msBeforeNext / 1000)
          }
        });
      }
      
      // For other errors, pass to the next error handler
      return next(error);
    }
  };
}

/**
 * Throttle specific endpoints with different limits
 * 
 * This creates a middleware that applies different throttling rules
 * based on the request path.
 * 
 * @param rules Map of paths to throttling options
 * @returns Express middleware
 */
export function endpointThrottling(rules: Record<string, ThrottlingOptions>) {
  const throttlers = new Map<string, ReturnType<typeof createThrottlingMiddleware>>();
  
  // Create throttlers for each rule
  Object.entries(rules).forEach(([path, options]) => {
    throttlers.set(path, createThrottlingMiddleware(options));
  });
  
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    let matchedPath = '';
    
    // Find the most specific path that matches
    for (const [rulePath] of throttlers.entries()) {
      if (path.startsWith(rulePath) && rulePath.length > matchedPath.length) {
        matchedPath = rulePath;
      }
    }
    
    if (matchedPath && throttlers.has(matchedPath)) {
      // Use the specific throttler for this path
      return throttlers.get(matchedPath)!(req, res, next);
    }
    
    // No specific throttler for this path, continue to next middleware
    return next();
  };
}

/**
 * Common throttling presets for different API endpoints
 */
export const ThrottlingPresets = {
  /**
   * Default API throttling (30 requests per minute)
   */
  DEFAULT: {
    points: 30,
    duration: 60,
    blockDuration: 300
  },
  
  /**
   * Strict API throttling (10 requests per minute)
   */
  STRICT: {
    points: 10,
    duration: 60,
    blockDuration: 600
  },
  
  /**
   * Loose API throttling (100 requests per minute)
   */
  LOOSE: {
    points: 100,
    duration: 60,
    blockDuration: 60
  },
  
  /**
   * Authentication endpoint throttling (5 requests per minute)
   */
  AUTH: {
    points: 5,
    duration: 60,
    blockDuration: 900,
    errorMessage: 'Too many authentication attempts. Please try again later.'
  },
  
  /**
   * Public API throttling (60 requests per minute)
   */
  PUBLIC_API: {
    points: 60,
    duration: 60,
    blockDuration: 300
  }
};
