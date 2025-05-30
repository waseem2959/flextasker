/**
 * Rate Limiter Middleware
 * 
 * This middleware provides rate limiting functionality to protect the API
 * from abuse and ensure fair usage. It limits the number of requests a client
 * can make within a specific time window.
 */

import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for most endpoints
 * 
 * This limits the number of requests a client can make to the API
 * within a specified time window. Configuration is loaded from environment
 * variables with sensible defaults.
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'), // 100 requests per window
  
  // Custom error message
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  
  // Custom headers to inform client about rate limits
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Skip rate limiting for certain conditions
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  
  // Custom key generator (by default uses IP address)
  keyGenerator: (req) => {
    // If user is authenticated, use their user ID, otherwise use IP
    const key = req.user?.id ?? req.ip;
    if (!key) {
      throw new Error('Unable to generate key');
    }
    return key;
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * 
 * This provides enhanced protection for sensitive endpoints like login,
 * registration, and password reset to prevent brute force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait before trying again.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  
  // Always use IP address for auth rate limiting
  // This prevents attackers from bypassing the limit by not sending auth tokens
  keyGenerator: (req) => req.ip ?? 'unknown',
  
  // Don't skip any requests for auth endpoints
  skip: () => false,
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for API endpoints
 * 
 * This provides a balanced approach for API endpoints that need
 * more requests than auth endpoints but still require protection.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  
  message: {
    success: false,
    message: 'API rate limit exceeded. Please slow down your requests.',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString(),
  },
  
  // Use a combination of IP and API key if available
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey ?? req.ip ?? 'unknown';
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});
