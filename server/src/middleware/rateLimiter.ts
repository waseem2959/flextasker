import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware - this is like having a bouncer at a club who
 * makes sure people don't overwhelm the system by making too many requests
 * too quickly. This protects our server from abuse and ensures fair usage.
 */

// General rate limiter for most endpoints
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

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait before trying again.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  
  // Skip successful requests (only count failed attempts)
  skipSuccessfulRequests: true,
});

// Lenient rate limiter for file uploads (they take longer)
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  
  message: {
    success: false,
    message: 'Too many file uploads. Please wait before uploading more files.',
    retryAfter: '1 hour',
    timestamp: new Date().toISOString(),
  },
});
