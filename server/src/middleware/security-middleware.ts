/**
 * Security Middleware
 * 
 * This middleware provides security features for protecting the application against
 * common web vulnerabilities such as XSS, CSRF, clickjacking, etc.
 */

import csrf from 'csurf';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppError } from '../utils/error-utils';
import { logger } from '../utils/logger';

/**
 * CSRF protection middleware
 * 
 * This protects against Cross-Site Request Forgery attacks by requiring
 * a special token for all state-changing requests (POST, PUT, DELETE).
 */
const csrfProtection = csrf({
  cookie: {
    key: 'csrf',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

/**
 * CSRF error handler
 * 
 * This catches CSRF token validation errors and returns a standardized
 * error response instead of the default error.
 */
interface CsrfError extends Error {
  code?: string;
}

export function handleCsrfError(err: unknown, req: Request, _res: Response, next: NextFunction) {
  const csrfError = err as CsrfError;
  
  if (csrfError.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF attack detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers
    });
    
    return next(new AppError('Invalid or missing CSRF token', 403, true, 'INVALID_CSRF_TOKEN'));
  }
  
  // Pass the error to the next error handler
  next(err);
}

/**
 * XSS prevention helper to sanitize user input
 * 
 * This escapes HTML special characters to prevent XSS attacks
 * when user input is rendered in HTML.
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Input sanitization middleware for request body
 * 
 * This recursively sanitizes all string values in the request body
 * to prevent XSS attacks.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    // Recursive function to sanitize all string values in an object
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }
      
      // Handle objects
      const sanitized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
}

/**
 * Security headers middleware using helmet
 * 
 * This sets various HTTP headers to improve security by using
 * the helmet package with sensible defaults.
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://storage.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.flextasker.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    referrerPolicy: {
      policy: 'same-origin'
    }
  });
}

/**
 * Rate limiting configuration
 */
const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message ?? 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Rate limiters for different endpoint types
 */
export const rateLimiters = {
  // General API rate limit
  api: createRateLimit(
    1 * 60 * 1000, // 1 minute
    60, // 60 requests per minute
    'API rate limit exceeded, please try again in 1 minute.'
  ),

  // Authentication endpoints (stricter)
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts per 15 minutes
    'Too many authentication attempts, please try again in 15 minutes.'
  ),

  // General application rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per 15 minutes
    'Too many requests from this IP, please try again in 15 minutes.'
  )
};

/**
 * Export security middleware collection
 */
export const security = {
  csrf: csrfProtection,
  handleCsrfError,
  sanitizeBody,
  securityHeaders: securityHeaders(),
  sanitizeInput,
  rateLimit: rateLimiters
};
