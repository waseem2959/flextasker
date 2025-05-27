/**
 * Rate Limiter Middleware
 * 
 * This middleware provides API rate limiting to protect against abuse and DoS attacks.
 * It uses Redis to track and limit requests per client based on IP address or API key.
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient } from '../utils/cache/redis-client';
import { logger } from '../utils/logger';
import { ErrorType } from '../../../shared/types/errors';

// Rate limit configurations based on environment
const MAX_REQUESTS_PER_WINDOW = process.env.NODE_ENV === 'production' ? 100 : 300;
const WINDOW_SIZE_IN_SECONDS = 60; // 1 minute window

// Create Redis-based rate limiter
const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit:',
  points: MAX_REQUESTS_PER_WINDOW, // Number of requests allowed in window
  duration: WINDOW_SIZE_IN_SECONDS,
  blockDuration: 60, // Block for 1 minute if limit exceeded
  inmemoryBlockOnConsumed: MAX_REQUESTS_PER_WINDOW + 10, // Safety buffer
  inmemoryBlockDuration: 60,
  insuranceLimiter: {
    points: 10, // Fallback limit if Redis is down
    duration: 60
  }
});

/**
 * Get client identifier from request
 * Uses API key if available, otherwise IP address
 */
function getClientIdentifier(req: Request): string {
  // Prefer API key if available
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  // Fall back to IP address
  return `ip:${req.ip}`;
}

/**
 * Rate limiter middleware for Express
 */
export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip rate limiting for certain paths
  const skipPaths = ['/health', '/api/health', '/api/docs'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  try {
    // Get client identifier
    const clientId = getClientIdentifier(req);
    
    // Consume points
    await limiter.consume(clientId);
    next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      // Rate limit exceeded
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      // Set rate limit headers
      res.set('Retry-After', String(Math.round(error.msBeforeNext / 1000)));
      res.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Date.now() + error.msBeforeNext));
      
      // Send error response
      return res.status(429).json({
        success: false,
        error: {
          type: ErrorType.RATE_LIMIT,
          message: 'Too many requests, please try again later',
          details: {
            retryAfter: Math.ceil(error.msBeforeNext / 1000)
          }
        }
      });
    }
    
    // Other errors
    logger.error('Rate limiter error', { error });
    next();
  }
};

export default rateLimiter;
