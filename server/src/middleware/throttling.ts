/**
 * Request Throttling Middleware
 * 
 * This middleware provides fine-grained control over request rates for specific
 * routes or endpoints, with different throttling strategies and customization options.
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedisClient } from '../utils/cache/redis-client';
import { logger } from '../utils/logger';
import { ErrorType } from '../../../shared/types/errors';

// Throttling strategy types
export enum ThrottlingStrategy {
  FIXED_WINDOW = 'fixed',     // Fixed window rate limiting
  SLIDING_WINDOW = 'sliding', // Sliding window rate limiting
  TOKEN_BUCKET = 'token',     // Token bucket algorithm
  LEAKY_BUCKET = 'leaky'      // Leaky bucket algorithm
}

// Throttling options interface
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

// Default options
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

// Create a Map to store limiter instances
const limiters = new Map<string, RateLimiterRedis | RateLimiterMemory>();

/**
 * Create a throttling middleware
 * 
 * @param options Throttling options
 * @returns Express middleware
 */
export function createThrottlingMiddleware(options: ThrottlingOptions = {}): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const limiterKey = `${opts.prefix}:${opts.strategy}:${opts.points}:${opts.duration}`;
  
  // Create limiter if it doesn't exist
  if (!limiters.has(limiterKey)) {
    let limiter: RateLimiterRedis | RateLimiterMemory;
    
    // Common options for all strategies
    const commonOptions = {
      storeClient: getRedisClient(),
      keyPrefix: opts.prefix,
      points: opts.points,
      duration: opts.duration,
      blockDuration: opts.blockDuration
    };
    
    // Create limiter based on strategy
    try {
      switch (opts.strategy) {
        case ThrottlingStrategy.TOKEN_BUCKET:
          // Token bucket adds tokens at a fixed rate
          limiter = new RateLimiterRedis({
            ...commonOptions,
            inmemoryBlockOnConsumed: opts.points! + 1,
            inMemoryBlockDuration: opts.blockDuration,
            insuranceLimiter: new RateLimiterMemory({
              points: 10,
              duration: 60
            })
          });
          break;
          
        case ThrottlingStrategy.LEAKY_BUCKET:
          // Leaky bucket processes requests at a constant rate
          limiter = new RateLimiterRedis({
            ...commonOptions,
            execEvenly: true, // This enables leaky bucket behavior
            inmemoryBlockOnConsumed: opts.points! + 1,
            inMemoryBlockDuration: opts.blockDuration,
            insuranceLimiter: new RateLimiterMemory({
              points: 10,
              duration: 60,
              execEvenly: true
            })
          });
          break;
          
        case ThrottlingStrategy.FIXED_WINDOW:
          // Fixed window resets all points after duration
          limiter = new RateLimiterRedis({
            ...commonOptions,
            inmemoryBlockOnConsumed: opts.points! + 1,
            inMemoryBlockDuration: opts.blockDuration,
            insuranceLimiter: new RateLimiterMemory({
              points: 10,
              duration: 60
            })
          });
          break;
          
        case ThrottlingStrategy.SLIDING_WINDOW:
        default:
          // Sliding window is the default strategy
          limiter = new RateLimiterRedis({
            ...commonOptions,
            inmemoryBlockOnConsumed: opts.points! + 1,
            inMemoryBlockDuration: opts.blockDuration,
            insuranceLimiter: new RateLimiterMemory({
              points: 10,
              duration: 60
            })
          });
      }
      
      limiters.set(limiterKey, limiter);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create rate limiter, using memory fallback', { error: errorMessage });
      
      // Fallback to memory limiter
      limiter = new RateLimiterMemory({
        points: opts.points,
        duration: opts.duration
      });
      
      limiters.set(limiterKey, limiter);
    }
  }
  
  const limiter = limiters.get(limiterKey)!;
  
  // Return the middleware function
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip throttling if skip function returns true
    if (opts.skip && opts.skip(req)) {
      return next();
    }
    
    try {
      // Get client identifier
      const key = opts.keyGenerator!(req);
      
      // Consume points
      const rateLimiterRes = await limiter.consume(key);
      
      // Add rate limit headers if enabled
      if (opts.headers) {
        res.set('X-RateLimit-Limit', String(opts.points));
        res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints));
        res.set('X-RateLimit-Reset', String(Math.round(Date.now() / 1000 + rateLimiterRes.msBeforeNext / 1000)));
      }
      
      next();
    } catch (error: unknown) {
      if (error instanceof RateLimiterRes) {
        // Rate limit exceeded
        logger.warn('Throttling limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          strategy: opts.strategy
        });
        
        // Set rate limit headers if enabled
        if (opts.headers) {
          const rateLimiterError = error as RateLimiterRes;
          res.set('Retry-After', String(Math.round(rateLimiterError.msBeforeNext / 1000)));
          res.set('X-RateLimit-Limit', String(opts.points));
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', String(Date.now() + rateLimiterError.msBeforeNext));
        }
        
        // Send error response
        res.status(429).json({
          success: false,
          error: {
            type: ErrorType.RATE_LIMIT,
            message: opts.errorMessage || 'Too many requests, please try again later',
            details: {
              retryAfter: Math.ceil((error as RateLimiterRes).msBeforeNext / 1000)
            }
          }
        });
        return;
      }
      
      // Other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Throttling error', { error: errorMessage });
      next();
    }
  };
}

/**
 * Throttle specific endpoints with different limits
 * 
 * This creates a middleware that applies different throttling rules
 * based on the request path and method.
 * 
 * @param rules Map of paths to throttling options
 * @returns Express middleware
 */
export function endpointThrottling(rules: Record<string, ThrottlingOptions>): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  // Precompile path patterns and create middlewares
  const compiledRules = Object.entries(rules).map(([path, options]) => {
    // Convert path pattern to regex
    // Support Express-style path params (/user/:id) and wildcards (*)
    const pattern = path
      .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
      .replace(/\*/g, '.*')         // Replace * with regex
      .replace(/\//g, '\\/');       // Escape slashes
    
    const regex = new RegExp(`^${pattern}$`);
    const middleware = createThrottlingMiddleware(options);
    
    return { regex, middleware };
  });
  
  // Return a middleware that delegates to the appropriate rule
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const path = req.path;
    
    // Find matching rule
    const matchingRule = compiledRules.find(({ regex }) => regex.test(path));
    
    if (matchingRule) {
      // Apply the matching rule's middleware
      return matchingRule.middleware(req, res, next);
    }
    
    // No matching rule, proceed
    next();
  };
}

/**
 * Common throttling presets for different API endpoints
 */
export const ThrottlingPresets = {
  // Strict limits for authentication endpoints to prevent brute force
  AUTH: {
    prefix: 'throttle:auth:',
    points: 5,
    duration: 60, // 5 requests per minute
    blockDuration: 300, // 5 minute block after exceeding
    errorMessage: 'Too many authentication attempts, please try again later'
  },
  
  // Moderate limits for most API endpoints
  API: {
    prefix: 'throttle:api:',
    points: 60,
    duration: 60, // 60 requests per minute
    blockDuration: 60
  },
  
  // Generous limits for read-only operations
  READ: {
    prefix: 'throttle:read:',
    points: 120,
    duration: 60, // 120 requests per minute
    blockDuration: 30
  },
  
  // Very strict limits for expensive operations
  EXPENSIVE: {
    prefix: 'throttle:expensive:',
    points: 10,
    duration: 300, // 10 requests per 5 minutes
    blockDuration: 600,
    errorMessage: 'Too many requests for resource-intensive operations'
  },
  
  // Limits for public API endpoints
  PUBLIC_API: {
    prefix: 'throttle:public:',
    points: 30,
    duration: 60, // 30 requests per minute
    blockDuration: 60
  }
};

export default {
  createThrottlingMiddleware,
  endpointThrottling,
  ThrottlingStrategy,
  ThrottlingPresets
};
