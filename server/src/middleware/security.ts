/**
 * Security Middleware
 * 
 * This module provides security middleware for protecting the application against
 * common web vulnerabilities such as XSS, CSRF, clickjacking, etc.
 */

import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import helmet from 'helmet';
import { ErrorType } from '../../../shared/types/errors';
import { logger } from '../utils/logger';

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    key: 'csrf',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

// CSRF error handler
export function handleCsrfError(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF attack detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers
    });
    
    return res.status(403).json({
      success: false,
      error: {
        type: ErrorType.SECURITY,
        message: 'Invalid or missing CSRF token',
        code: 'INVALID_CSRF_TOKEN'
      }
    });
  }
  
  next(err);
}

// XSS prevention helper to sanitize user input
export function sanitizeInput(input: string): string {
  if (!input) return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Input sanitization middleware for request body
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody: Record<string, any> = {};
    
    // Recursively sanitize string values in the body
    const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          result[key] = sanitizeInput(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
          result[key] = value.map(item => 
            typeof item === 'string' 
              ? sanitizeInput(item) 
              : (typeof item === 'object' ? sanitizeObject(item) : item)
          );
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
}

// Security headers middleware using helmet
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "wss:", "ws:"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true
  });
}

// Export security middleware collection
export const security = {
  csrf: csrfProtection,
  handleCsrfError,
  sanitizeBody,
  securityHeaders: securityHeaders()
};
