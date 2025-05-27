/**
 * Security Module
 * 
 * This module exports all security-related utilities for the application.
 */

// Re-export all security components
export * from './csrf';
export * from './headers';
export * from './sanitization';

// Import dependencies
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { monitorError } from '../monitoring';

/**
 * Initialize all security measures for an Express application
 * @param app Express application instance
 */
export function initializeSecurity(app: any): void {
  // Import security middleware
  const { 
    securityHeaders, 
    corsHeaders,
    csrfProtection,
    sanitizeBody,
    sanitizeQuery
  } = require('./index');
  
  // Apply security middleware
  app.use(securityHeaders);
  app.use(corsHeaders());
  app.use(sanitizeQuery());
  app.use(sanitizeBody());
  
  // Apply CSRF protection to all routes except API endpoints that need to be accessed from other services
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for API endpoints that need to be accessed by other services
    if (req.path.startsWith('/api/v1/webhook') || req.path.startsWith('/api/v1/external')) {
      next();
    } else {
      csrfProtection(req, res, next);
    }
  });
  
  logger.info('Security measures initialized');
}

/**
 * Rate limiting configuration for different types of routes
 */
export const rateLimitConfig = {
  // General API rate limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  
  // Auth endpoints (login, register) rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  
  // Password reset endpoints rate limit
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many password reset attempts, please try again later',
      timestamp: new Date().toISOString()
    }
  }
};

/**
 * Content security policy directives for different environments
 */
export const cspDirectives = {
  development: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'", // Allow eval for development tools
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "connect-src 'self' ws: wss:", // Allow WebSocket connections
    "frame-ancestors 'none'",
    "form-action 'self'"
  ],
  
  production: [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://randomuser.me",
    "connect-src 'self' https://api.flextasker.com",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ]
};
